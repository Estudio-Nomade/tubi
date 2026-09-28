-- 0034_cupones_lifecycle.sql
-- Hook coupon release/consume into cancel, no-show, board, and trip cancel RPCs.

create or replace function public.cancelar_reserva(p_reserva_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_reserva public.reserva%rowtype;
  v_viaje public.viaje%rowtype;
  v_politica jsonb;
  v_pct numeric := 0;
  v_monto numeric := 0;
  v_antelacion interval;
  v_hours numeric;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('pasajero', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_reserva
  from public.reserva
  where id = p_reserva_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_rol = 'pasajero' and v_reserva.pasajero_id <> v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_reserva.estado not in ('pendiente_sena', 'confirmada') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = v_reserva.viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  -- pendiente_sena: no refund (sena never confirmed)
  if v_reserva.estado = 'pendiente_sena' then
    v_pct := 0;
    v_monto := 0;
  else
    -- confirmada: RN-03 from snapshot on reserva
    v_politica := v_reserva.politica_cancelacion;
    if v_politica is null
       or v_politica->>'devolucion_24h_pct' is null
       or v_politica->>'devolucion_12_24h_pct' is null
       or v_politica->>'devolucion_menos_12h_pct' is null then
      raise exception 'RESERVA_POLITICA_INVALIDA' using errcode = 'P0001';
    end if;

    v_antelacion := v_viaje.fecha_salida - now();
    v_hours := extract(epoch from v_antelacion) / 3600.0;

    if v_hours > 24 then
      v_pct := (v_politica->>'devolucion_24h_pct')::numeric;
    elsif v_hours >= 12 then
      v_pct := (v_politica->>'devolucion_12_24h_pct')::numeric;
    else
      v_pct := (v_politica->>'devolucion_menos_12h_pct')::numeric;
    end if;

    if v_pct is null or v_pct < 0 then
      v_pct := 0;
    end if;

    v_monto := round(v_reserva.monto_sena * v_pct / 100.0, 2);
    if v_monto < 0 then
      v_monto := 0;
    end if;
  end if;

  update public.reserva
  set
    estado = 'cancelada',
    cancelada_en = now(),
    monto_devolucion = v_monto,
    devolucion_pct = v_pct,
    updated_at = now()
  where id = v_reserva.id
  returning * into v_reserva;

  perform public.cupon_liberar_si_reservado(p_reserva_id);

  return jsonb_build_object(
    'ok', true,
    'reserva_id', v_reserva.id,
    'viaje_id', v_viaje.id,
    'estado', v_reserva.estado,
    'devolucion_pct', v_pct,
    'monto_devolucion', v_monto,
    'cancelada_en', v_reserva.cancelada_en
  );
end;
$$;

create or replace function public.cancelar_viaje(
  p_viaje_id uuid,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
  r public.reserva%rowtype;
  v_count int := 0;
  v_refund_total numeric := 0;
  v_sena_ok boolean;
  v_monto numeric;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'operador' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = p_viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_viaje.estado not in ('programado', 'recogida', 'en_curso') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  for r in
    select *
    from public.reserva
    where viaje_id = v_viaje.id
      and estado in ('pendiente_sena', 'confirmada', 'verificada')
    for update
  loop
    v_monto := 0;
    if r.estado in ('confirmada', 'verificada') then
      select exists (
        select 1
        from public.pago p
        where p.reserva_id = r.id
          and p.tipo = 'sena'
          and p.estado = 'confirmado'
      ) into v_sena_ok;
      if v_sena_ok then
        v_monto := r.monto_sena;
      end if;
    end if;

    update public.reserva
    set
      estado = 'cancelada',
      cancelada_en = now(),
      monto_devolucion = v_monto,
      devolucion_pct = case when v_monto > 0 then 100 else 0 end,
      updated_at = now()
    where id = r.id;

    perform public.cupon_liberar_si_reservado(r.id);

    v_count := v_count + 1;
    v_refund_total := v_refund_total + coalesce(v_monto, 0);
  end loop;

  update public.viaje
  set estado = 'cancelado', updated_at = now()
  where id = v_viaje.id;

  return jsonb_build_object(
    'ok', true,
    'viaje_id', v_viaje.id,
    'estado', 'cancelado',
    'reservas_canceladas', v_count,
    'monto_devolucion_total', v_refund_total,
    'motivo', p_motivo
  );
end;
$$;

create or replace function public.marcar_no_show(
  p_reserva_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_reserva public.reserva%rowtype;
  v_viaje public.viaje%rowtype;
  v_pasajero public.profiles%rowtype;
  v_ruta public.ruta%rowtype;
  v_pending int;
  v_viaje_estado estado_viaje;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('conductor', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_reserva
  from public.reserva
  where id = p_reserva_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = v_reserva.viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_rol = 'conductor' and v_viaje.conductor_id <> v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_reserva.estado = 'no_show' then
    raise exception 'YA_NO_SHOW' using errcode = 'P0001';
  end if;

  if v_reserva.estado not in ('confirmada', 'verificada') then
    raise exception 'ESTADO_INVALIDO' using errcode = 'P0001';
  end if;

  update public.reserva
  set estado = 'no_show', updated_at = now()
  where id = v_reserva.id
  returning * into v_reserva;

  perform public.cupon_marcar_usado(p_reserva_id);

  -- Auto en_curso when no passengers left pending pickup
  -- (confirmada / verificada still waiting). pendiente_sena ignored.
  select count(*)::int into v_pending
  from public.reserva r
  where r.viaje_id = v_viaje.id
    and r.estado in ('confirmada', 'verificada');

  v_viaje_estado := v_viaje.estado;
  if v_pending = 0 and v_viaje.estado in ('programado', 'recogida') then
    update public.viaje
    set estado = 'en_curso', updated_at = now()
    where id = v_viaje.id
    returning estado into v_viaje_estado;
  end if;

  select * into v_pasajero from public.profiles where id = v_reserva.pasajero_id;
  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;

  return jsonb_build_object(
    'ok', true,
    'reserva_id', v_reserva.id,
    'viaje_id', v_viaje.id,
    'estado', v_reserva.estado,
    'viaje_estado', v_viaje_estado,
    'pasajero_nombre', trim(both ' ' from concat_ws(' ', v_pasajero.nombre, v_pasajero.apellido)),
    'origen', v_ruta.origen,
    'destino', v_ruta.destino
  );
end;
$$;

create or replace function public.registrar_saldo_y_abordar(
  p_reserva_id uuid,
  p_metodo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_reserva public.reserva%rowtype;
  v_viaje public.viaje%rowtype;
  v_pasajero public.profiles%rowtype;
  v_ruta public.ruta%rowtype;
  v_monto numeric;
  v_descuento numeric;
  v_metodo metodo_pago;
  v_pago public.pago%rowtype;
  v_pago_id uuid := null;
  v_pending int;
  v_viaje_estado estado_viaje;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('conductor', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if p_metodo is null or p_metodo not in ('efectivo', 'transferencia') then
    raise exception 'METODO_INVALIDO' using errcode = 'P0001';
  end if;
  v_metodo := p_metodo::metodo_pago;

  select * into v_reserva
  from public.reserva
  where id = p_reserva_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = v_reserva.viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_rol = 'conductor' and v_viaje.conductor_id <> v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_reserva.estado = 'abordada' then
    raise exception 'YA_ABORDADA' using errcode = 'P0001';
  end if;

  if v_reserva.estado <> 'verificada' then
    raise exception 'RESERVA_NO_VERIFICADA' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.pago p
    where p.reserva_id = v_reserva.id
      and p.tipo = 'saldo'
      and p.estado = 'confirmado'
  ) then
    raise exception 'SALDO_YA_REGISTRADO' using errcode = 'P0001';
  end if;

  v_descuento := coalesce(v_reserva.descuento_monto, 0);
  v_monto := v_viaje.precio - v_reserva.monto_sena - v_descuento;
  if v_monto < 0 then
    v_monto := 0;
  end if;

  if v_monto > 0 then
    insert into public.pago (
      reserva_id,
      tipo,
      monto,
      metodo,
      estado,
      comprobante,
      confirmado_por
    ) values (
      v_reserva.id,
      'saldo',
      v_monto,
      v_metodo,
      'confirmado',
      null,
      v_uid
    )
    returning * into v_pago;
    v_pago_id := v_pago.id;
  end if;

  update public.reserva
  set estado = 'abordada', updated_at = now()
  where id = v_reserva.id
  returning * into v_reserva;

  perform public.cupon_marcar_usado(v_reserva.id);

  -- Auto en_curso when no passengers left pending pickup
  -- (confirmada / verificada still waiting). pendiente_sena ignored.
  select count(*)::int into v_pending
  from public.reserva r
  where r.viaje_id = v_viaje.id
    and r.estado in ('confirmada', 'verificada');

  v_viaje_estado := v_viaje.estado;
  if v_pending = 0 and v_viaje.estado in ('programado', 'recogida') then
    update public.viaje
    set estado = 'en_curso', updated_at = now()
    where id = v_viaje.id
    returning estado into v_viaje_estado;
  end if;

  select * into v_pasajero from public.profiles where id = v_reserva.pasajero_id;
  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;

  return jsonb_build_object(
    'ok', true,
    'reserva_id', v_reserva.id,
    'viaje_id', v_viaje.id,
    'pago_id', v_pago_id,
    'monto', v_monto,
    'metodo', v_metodo,
    'estado', v_reserva.estado,
    'viaje_estado', v_viaje_estado,
    'pasajero_nombre', trim(both ' ' from concat_ws(' ', v_pasajero.nombre, v_pasajero.apellido)),
    'origen', v_ruta.origen,
    'destino', v_ruta.destino
  );
end;
$$;

revoke all on function public.cancelar_reserva(uuid) from public;
grant execute on function public.cancelar_reserva(uuid) to authenticated;

revoke all on function public.cancelar_viaje(uuid, text) from public;
grant execute on function public.cancelar_viaje(uuid, text) to authenticated;

revoke all on function public.marcar_no_show(uuid) from public;
grant execute on function public.marcar_no_show(uuid) to authenticated;

revoke all on function public.registrar_saldo_y_abordar(uuid, text) from public;
grant execute on function public.registrar_saldo_y_abordar(uuid, text) to authenticated;

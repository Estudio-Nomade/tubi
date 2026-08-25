-- 0013_slice6_saldo_abordar.sql
-- Conductor registers balance payment + boards passenger (RN-02).
-- When no pending pickups remain, trip → en_curso.

grant insert on table public.pago to authenticated;

drop policy if exists pago_insert_saldo_conductor on public.pago;
create policy pago_insert_saldo_conductor
  on public.pago
  for insert
  to authenticated
  with check (
    tipo = 'saldo'
    and exists (
      select 1
      from public.reserva r
      join public.viaje v on v.id = r.viaje_id
      where r.id = pago.reserva_id
        and (
          v.conductor_id = (select auth.uid())
          or (select public.is_operador())
        )
    )
  );

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
  v_metodo metodo_pago;
  v_pago public.pago%rowtype;
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

  v_monto := v_viaje.precio - v_reserva.monto_sena;
  if v_monto < 0 then
    raise exception 'SALDO_INVALIDO' using errcode = 'P0001';
  end if;

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

  update public.reserva
  set estado = 'abordada', updated_at = now()
  where id = v_reserva.id
  returning * into v_reserva;

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
    'pago_id', v_pago.id,
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

revoke all on function public.registrar_saldo_y_abordar(uuid, text) from public;
grant execute on function public.registrar_saldo_y_abordar(uuid, text) to authenticated;

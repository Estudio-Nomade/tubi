-- 0033_cupones_crear_reserva.sql
-- Extiende crear_reserva con p_cupon_usuario_id opcional.

drop function if exists public.crear_reserva(uuid, text, numeric, numeric, text);

create or replace function public.crear_reserva(
  p_viaje_id uuid,
  p_recogida_label text default null,
  p_recogida_lat numeric default null,
  p_recogida_lng numeric default null,
  p_recogida_place_id text default null,
  p_cupon_usuario_id uuid default null
)
returns public.reserva
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
  v_ruta public.ruta%rowtype;
  v_capacidad int;
  v_ocupados int;
  v_sena numeric;
  v_politica jsonb;
  v_token text;
  v_row public.reserva;
  v_label text := trim(coalesce(p_recogida_label, ''));
  v_lat numeric := p_recogida_lat;
  v_lng numeric := p_recogida_lng;
  v_place_id text := nullif(trim(coalesce(p_recogida_place_id, '')), '');
  v_mode text;
  v_parada_origen public.parada%rowtype;
  v_enabled text;
  v_cupon public.cupon_usuario%rowtype;
  v_camp public.cupon_campania%rowtype;
  v_descuento numeric := 0;
  v_cupon_id uuid := null;
  -- Bbox partido de Tandil (sincronizar con domain/geo/tandil.ts).
  c_tandil_min_lat constant numeric := -37.7;
  c_tandil_max_lat constant numeric := -36.9;
  c_tandil_min_lng constant numeric := -59.8;
  c_tandil_max_lng constant numeric := -58.8;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('pasajero', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = p_viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_viaje.estado <> 'programado' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  -- Regla de recogida por origen de la ruta.
  if lower(trim(coalesce(v_ruta.origen, ''))) = 'tandil' then
    v_mode := 'libre_tandil';
    if v_label = '' then
      raise exception 'RECOGIDA_REQUERIDA' using errcode = 'P0001';
    end if;
    if v_lat is null or v_lng is null
       or v_lat < -90 or v_lat > 90
       or v_lng < -180 or v_lng > 180 then
      raise exception 'RECOGIDA_INVALIDA' using errcode = 'P0001';
    end if;
    if v_lat < c_tandil_min_lat or v_lat > c_tandil_max_lat
       or v_lng < c_tandil_min_lng or v_lng > c_tandil_max_lng then
      raise exception 'RECOGIDA_FUERA_ZONA' using errcode = 'P0001';
    end if;
  else
    v_mode := 'fijo_ruta';
    select * into v_parada_origen
    from public.parada
    where ruta_id = v_ruta.id
      and tipo = 'origen'
    order by orden
    limit 1;

    if not found then
      raise exception 'PARADA_ORIGEN_MISSING' using errcode = 'P0001';
    end if;

    -- El punto fijo se copia de la parada origen: se ignora lo que envíe el cliente.
    v_label := v_parada_origen.nombre;
    v_lat := v_parada_origen.lat;
    v_lng := v_parada_origen.lng;
    v_place_id := null;
  end if;

  select capacidad into v_capacidad
  from public.vehiculo
  where id = v_viaje.vehiculo_id;

  if v_capacidad is null then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  select count(*)::int into v_ocupados
  from public.reserva r
  where r.viaje_id = p_viaje_id
    and r.estado in ('pendiente_sena', 'confirmada', 'verificada', 'abordada');

  if v_ocupados >= v_capacidad then
    raise exception 'RESERVA_SIN_ASIENTOS' using errcode = 'P0001';
  end if;

  select (valor #>> '{}')::numeric into v_sena
  from public.settings
  where clave = 'reserva.sena_monto';

  if v_sena is null then
    raise exception 'SETTING_MISSING:reserva.sena_monto' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'devolucion_24h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_24h_pct'),
    'devolucion_12_24h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_12_24h_pct'),
    'devolucion_menos_12h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_menos_12h_pct')
  ) into v_politica;

  if v_politica->>'devolucion_24h_pct' is null
     or v_politica->>'devolucion_12_24h_pct' is null
     or v_politica->>'devolucion_menos_12h_pct' is null then
    raise exception 'SETTING_MISSING:reserva.devolucion_*' using errcode = 'P0001';
  end if;

  -- Cupón opcional
  if p_cupon_usuario_id is not null then
    select (valor #>> '{}') into v_enabled
    from public.settings where clave = 'cupones.enabled';
    if v_enabled is not null and lower(v_enabled) in ('false', '0', 'no') then
      raise exception 'CUPONES_DESHABILITADOS' using errcode = 'P0001';
    end if;

    select * into v_cupon
    from public.cupon_usuario
    where id = p_cupon_usuario_id
    for update;

    if not found
       or v_cupon.pasajero_id is distinct from v_uid
       or v_cupon.estado is distinct from 'disponible' then
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;

    if v_cupon.vence_en < now() then
      update public.cupon_usuario
      set estado = 'vencido', updated_at = now()
      where id = v_cupon.id;
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;

    select * into v_camp
    from public.cupon_campania
    where id = v_cupon.campania_id
    for update;

    if not found or not v_camp.activa then
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;

    if v_camp.ruta_id is not null and v_camp.ruta_id is distinct from v_viaje.ruta_id then
      raise exception 'CUPON_RUTA_INVALIDA' using errcode = 'P0001';
    end if;

    v_descuento := v_cupon.monto_descuento;
    v_cupon_id := v_cupon.id;
  end if;

  v_token := 'opq_' || encode(gen_random_bytes(16), 'hex');

  insert into public.reserva (
    viaje_id,
    pasajero_id,
    asiento_num,
    estado,
    monto_sena,
    qr_token,
    politica_cancelacion,
    recogida_label,
    recogida_lat,
    recogida_lng,
    recogida_place_id,
    recogida_mode,
    cupon_usuario_id,
    descuento_monto
  )
  values (
    p_viaje_id,
    v_uid,
    null,
    'pendiente_sena',
    v_sena,
    v_token,
    v_politica,
    v_label,
    v_lat,
    v_lng,
    v_place_id,
    v_mode,
    v_cupon_id,
    v_descuento
  )
  returning * into v_row;

  if v_cupon_id is not null then
    update public.cupon_usuario
    set estado = 'reservado',
        reserva_id = v_row.id,
        updated_at = now()
    where id = v_cupon_id;
  end if;

  return v_row;
end;
$$;

revoke all on function public.crear_reserva(uuid, text, numeric, numeric, text, uuid) from public;
grant execute on function public.crear_reserva(uuid, text, numeric, numeric, text, uuid) to authenticated;

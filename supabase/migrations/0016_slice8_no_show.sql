-- 0016_slice8_no_show.sql
-- Conductor marks passenger no-show (RN-04). Deposit retained (0% refund).
-- When no remaining confirmada/verificada, trip → en_curso (same as slice 6).

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

revoke all on function public.marcar_no_show(uuid) from public;
grant execute on function public.marcar_no_show(uuid) to authenticated;

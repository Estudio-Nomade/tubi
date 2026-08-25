-- 0018_slice9_completar_viaje.sql
-- Conductor closes trip: en_curso → completado (RN-06).

create or replace function public.completar_viaje(p_viaje_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
  v_pending int;
  v_ruta public.ruta%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('conductor', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = p_viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_rol = 'conductor' and v_viaje.conductor_id <> v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_viaje.estado <> 'en_curso' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  select count(*)::int into v_pending
  from public.reserva r
  where r.viaje_id = v_viaje.id
    and r.estado in ('confirmada', 'verificada');

  if v_pending > 0 then
    raise exception 'PENDIENTES_ACTIVOS' using errcode = 'P0001';
  end if;

  -- Close dangling pendiente_sena as cancelada (docs/06 edge case)
  update public.reserva
  set estado = 'cancelada', updated_at = now()
  where viaje_id = v_viaje.id
    and estado = 'pendiente_sena';

  update public.viaje
  set estado = 'completado', updated_at = now()
  where id = v_viaje.id;

  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;

  return jsonb_build_object(
    'ok', true,
    'viaje_id', v_viaje.id,
    'estado', 'completado',
    'origen', coalesce(v_ruta.origen, ''),
    'destino', coalesce(v_ruta.destino, '')
  );
end;
$$;

revoke all on function public.completar_viaje(uuid) from public;
grant execute on function public.completar_viaje(uuid) to authenticated;

-- 0012_slice5_conductor_verificar_qr.sql
-- Conductor: see own trips + trip reservas; verify QR; start pickup.

grant select on table public.viaje to authenticated;
grant update on table public.viaje to authenticated;

-- Conductor (or operador) can read own trips.
drop policy if exists viaje_select_conductor on public.viaje;
create policy viaje_select_conductor
  on public.viaje
  for select
  to authenticated
  using (
    conductor_id = (select auth.uid())
    or (select public.is_operador())
  );

-- Conductor may update own trip estado via RPC only preferred; keep narrow policy unused by app.
-- Reservas of trips I drive.
drop policy if exists reserva_select_conductor_viaje on public.reserva;
create policy reserva_select_conductor_viaje
  on public.reserva
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.viaje v
      where v.id = reserva.viaje_id
        and (
          v.conductor_id = (select auth.uid())
          or (select public.is_operador())
        )
    )
  );

-- Conductor can read passenger name/apellido for pax on their trips (no DNI).
drop policy if exists profiles_select_pasajeros_viaje_conductor on public.profiles;
create policy profiles_select_pasajeros_viaje_conductor
  on public.profiles
  for select
  to authenticated
  using (
    rol = 'pasajero'
    and exists (
      select 1
      from public.reserva r
      join public.viaje v on v.id = r.viaje_id
      where r.pasajero_id = profiles.id
        and (
          v.conductor_id = (select auth.uid())
          or (select public.is_operador())
        )
    )
  );

-- programado → recogida (own trip)
create or replace function public.iniciar_recogida(p_viaje_id uuid)
returns public.viaje
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
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

  if v_viaje.estado = 'recogida' then
    return v_viaje;
  end if;

  if v_viaje.estado <> 'programado' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  update public.viaje
  set estado = 'recogida', updated_at = now()
  where id = v_viaje.id
  returning * into v_viaje;

  return v_viaje;
end;
$$;

revoke all on function public.iniciar_recogida(uuid) from public;
grant execute on function public.iniciar_recogida(uuid) to authenticated;

-- QR verify: confirmada → verificada (RN-VERIFICACION / AD-11)
create or replace function public.verificar_reserva_qr(
  p_viaje_id uuid,
  p_qr_token text
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
  v_reserva public.reserva%rowtype;
  v_pasajero public.profiles%rowtype;
  v_ruta public.ruta%rowtype;
  v_token text := trim(coalesce(p_qr_token, ''));
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('conductor', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_token = '' then
    raise exception 'QR_INVALIDO' using errcode = 'P0001';
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

  select * into v_reserva
  from public.reserva
  where qr_token = v_token
  for update;

  if not found then
    raise exception 'QR_INVALIDO' using errcode = 'P0001';
  end if;

  if v_reserva.viaje_id <> v_viaje.id then
    raise exception 'QR_INVALIDO' using errcode = 'P0001';
  end if;

  if v_reserva.estado in ('verificada', 'abordada') then
    raise exception 'QR_YA_VERIFICADO' using errcode = 'P0001';
  end if;

  if v_reserva.estado <> 'confirmada' then
    raise exception 'QR_INVALIDO' using errcode = 'P0001';
  end if;

  update public.reserva
  set estado = 'verificada', updated_at = now()
  where id = v_reserva.id
  returning * into v_reserva;

  select * into v_pasajero from public.profiles where id = v_reserva.pasajero_id;
  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;

  return jsonb_build_object(
    'ok', true,
    'reserva_id', v_reserva.id,
    'pasajero_nombre', trim(both ' ' from concat_ws(' ', v_pasajero.nombre, v_pasajero.apellido)),
    'origen', v_ruta.origen,
    'destino', v_ruta.destino,
    'fecha_salida', v_viaje.fecha_salida,
    'estado', v_reserva.estado
  );
end;
$$;

revoke all on function public.verificar_reserva_qr(uuid, text) from public;
grant execute on function public.verificar_reserva_qr(uuid, text) to authenticated;

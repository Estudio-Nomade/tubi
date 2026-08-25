-- 0009_slice2_crear_reserva.sql
-- Slice 2B: reserva RLS + atomic crear_reserva RPC (capacity + settings snapshots + qr_token).

grant select, insert on table public.reserva to authenticated;

drop policy if exists reserva_select_own on public.reserva;
create policy reserva_select_own
  on public.reserva
  for select
  to authenticated
  using (
    pasajero_id = (select auth.uid())
    or (select public.is_operador())
  );

drop policy if exists reserva_insert_own on public.reserva;
create policy reserva_insert_own
  on public.reserva
  for insert
  to authenticated
  with check (
    pasajero_id = (select auth.uid())
    and public.current_rol() in ('pasajero', 'operador')
  );

-- Atomic booking: lock trip, check capacity, snapshot settings, opaque qr_token.
create or replace function public.crear_reserva(p_viaje_id uuid)
returns public.reserva
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
  v_capacidad int;
  v_ocupados int;
  v_sena numeric;
  v_politica jsonb;
  v_token text;
  v_row public.reserva;
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

  v_token := 'opq_' || encode(gen_random_bytes(16), 'hex');

  insert into public.reserva (
    viaje_id,
    pasajero_id,
    asiento_num,
    estado,
    monto_sena,
    qr_token,
    politica_cancelacion
  )
  values (
    p_viaje_id,
    v_uid,
    null,
    'pendiente_sena',
    v_sena,
    v_token,
    v_politica
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.crear_reserva(uuid) from public;
grant execute on function public.crear_reserva(uuid) to authenticated;

-- Public seat availability (RLS on reserva only allows own rows; catalog needs global count).
create or replace function public.asientos_libres_viaje(p_viaje_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    coalesce(
      (
        select v.capacidad
        from public.viaje j
        join public.vehiculo v on v.id = j.vehiculo_id
        where j.id = p_viaje_id
      ),
      0
    )
    - coalesce(
      (
        select count(*)::int
        from public.reserva r
        where r.viaje_id = p_viaje_id
          and r.estado in (
            'pendiente_sena',
            'confirmada',
            'verificada',
            'abordada'
          )
      ),
      0
    )
  );
$$;

revoke all on function public.asientos_libres_viaje(uuid) from public;
grant execute on function public.asientos_libres_viaje(uuid) to authenticated;

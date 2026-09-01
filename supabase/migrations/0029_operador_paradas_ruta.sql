-- 0029_operador_paradas_ruta.sql
-- Operador gestiona las paradas de una ruta (editar/crear/eliminar/reordenar).
-- Las paradas pertenecen a la ruta (1-N), no al viaje: editar aplica a TODOS
-- los viajes de esa ruta (presentes y futuros).
--
-- Invariantes:
--   * exactamente 1 parada tipo 'origen' y 1 'destino' por ruta (no se borran).
--   * orden único y contiguo 1..N (se renumeran al guardar).
--   * nombre / ciudad no vacíos, lat/lng válidos.

grant select, insert, update, delete on table public.parada to authenticated;

-- Reenumera 1..N según el orden actual (seguro frente al unique(ruta_id, orden)).
create or replace function public.renumerar_paradas_ruta(p_ruta_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  i int := 0;
begin
  for v_id in
    select id from public.parada
    where ruta_id = p_ruta_id
    order by orden, id
  loop
    i := i + 1;
    update public.parada set orden = 1000000 + i where id = v_id;
  end loop;

  i := 0;
  for v_id in
    select id from public.parada
    where ruta_id = p_ruta_id
    order by orden, id
  loop
    i := i + 1;
    update public.parada set orden = i where id = v_id;
  end loop;
end;
$$;

revoke all on function public.renumerar_paradas_ruta(uuid) from public;
grant execute on function public.renumerar_paradas_ruta(uuid) to authenticated;

-- Edita nombre / ciudad / coords de una parada (cualquier tipo). No cambia tipo ni orden.
create or replace function public.actualizar_parada(
  p_parada_id uuid,
  p_nombre text,
  p_ciudad text,
  p_lat numeric,
  p_lng numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_nombre text := trim(coalesce(p_nombre, ''));
  v_ciudad text := trim(coalesce(p_ciudad, ''));
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'operador' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.parada where id = p_parada_id) then
    raise exception 'PARADA_NO_ENCONTRADA' using errcode = 'P0001';
  end if;

  if v_nombre = '' then
    raise exception 'NOMBRE_INVALIDO' using errcode = 'P0001';
  end if;

  if v_ciudad = '' then
    raise exception 'CIUDAD_INVALIDA' using errcode = 'P0001';
  end if;

  if p_lat is null or p_lng is null
     or p_lat < -90 or p_lat > 90
     or p_lng < -180 or p_lng > 180 then
    raise exception 'COORDS_INVALIDAS' using errcode = 'P0001';
  end if;

  update public.parada
  set nombre = v_nombre,
      ciudad = v_ciudad,
      lat = p_lat,
      lng = p_lng
  where id = p_parada_id;

  return jsonb_build_object(
    'ok', true,
    'parada_id', p_parada_id,
    'nombre', v_nombre,
    'ciudad', v_ciudad,
    'lat', p_lat,
    'lng', p_lng
  );
end;
$$;

revoke all on function public.actualizar_parada(uuid, text, text, numeric, numeric) from public;
grant execute on function public.actualizar_parada(uuid, text, text, numeric, numeric) to authenticated;

-- Agrega una parada intermedia. Por defecto se inserta justo antes del destino.
create or replace function public.crear_parada_intermedia(
  p_ruta_id uuid,
  p_nombre text,
  p_ciudad text,
  p_lat numeric,
  p_lng numeric,
  p_orden int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_nombre text := trim(coalesce(p_nombre, ''));
  v_ciudad text := trim(coalesce(p_ciudad, ''));
  v_destino_orden int;
  v_orden int := p_orden;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'operador' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.ruta where id = p_ruta_id) then
    raise exception 'RUTA_NO_ENCONTRADA' using errcode = 'P0001';
  end if;

  if v_nombre = '' then
    raise exception 'NOMBRE_INVALIDO' using errcode = 'P0001';
  end if;

  if v_ciudad = '' then
    raise exception 'CIUDAD_INVALIDA' using errcode = 'P0001';
  end if;

  if p_lat is null or p_lng is null
     or p_lat < -90 or p_lat > 90
     or p_lng < -180 or p_lng > 180 then
    raise exception 'COORDS_INVALIDAS' using errcode = 'P0001';
  end if;

  select orden into v_destino_orden
  from public.parada
  where ruta_id = p_ruta_id and tipo = 'destino'
  order by orden
  limit 1;

  if v_destino_orden is null then
    raise exception 'PARADA_ORIGEN_MISSING' using errcode = 'P0001';
  end if;

  if v_orden is null then
    v_orden := v_destino_orden;
  end if;

  if v_orden < 2 or v_orden > v_destino_orden then
    raise exception 'ORDEN_INVALIDO' using errcode = 'P0001';
  end if;

  -- Corre a la derecha (>= v_orden) con dos fases para no violar unique(ruta_id, orden).
  update public.parada set orden = -orden
  where ruta_id = p_ruta_id and orden >= v_orden;

  update public.parada set orden = (-orden) + 1
  where ruta_id = p_ruta_id and orden < 0;

  insert into public.parada (ruta_id, nombre, ciudad, lat, lng, orden, tipo)
  values (p_ruta_id, v_nombre, v_ciudad, p_lat, p_lng, v_orden, 'intermedio')
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'parada_id', v_id,
    'ruta_id', p_ruta_id,
    'orden', v_orden
  );
end;
$$;

revoke all on function public.crear_parada_intermedia(uuid, text, text, numeric, numeric, int) from public;
grant execute on function public.crear_parada_intermedia(uuid, text, text, numeric, numeric, int) to authenticated;

-- Elimina una parada intermedia (origen/destino no se pueden borrar).
create or replace function public.eliminar_parada_intermedia(p_parada_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_ruta_id uuid;
  v_tipo public.tipo_parada;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'operador' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select ruta_id, tipo into v_ruta_id, v_tipo
  from public.parada where id = p_parada_id;

  if not found then
    raise exception 'PARADA_NO_ENCONTRADA' using errcode = 'P0001';
  end if;

  if v_tipo in ('origen', 'destino') then
    raise exception 'PARADA_NO_ELIMINABLE' using errcode = 'P0001';
  end if;

  delete from public.parada where id = p_parada_id;

  perform public.renumerar_paradas_ruta(v_ruta_id);

  return jsonb_build_object('ok', true, 'parada_id', p_parada_id, 'ruta_id', v_ruta_id);
end;
$$;

revoke all on function public.eliminar_parada_intermedia(uuid) from public;
grant execute on function public.eliminar_parada_intermedia(uuid) to authenticated;

-- Reordena todas las paradas de la ruta según el orden de p_ids (permutación completa).
create or replace function public.reordenar_paradas_ruta(
  p_ruta_id uuid,
  p_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_n int;
  v_id uuid;
  i int := 0;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'operador' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.ruta where id = p_ruta_id) then
    raise exception 'RUTA_NO_ENCONTRADA' using errcode = 'P0001';
  end if;

  select count(*) into v_n from public.parada where ruta_id = p_ruta_id;

  if v_n <> coalesce(array_length(p_ids, 1), 0) then
    raise exception 'ORDEN_INVALIDO' using errcode = 'P0001';
  end if;

  if (select count(distinct x) from unnest(p_ids) as x) <> v_n then
    raise exception 'ORDEN_INVALIDO' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from unnest(p_ids) as x(id)
    where x.id not in (select id from public.parada where ruta_id = p_ruta_id)
  ) then
    raise exception 'ORDEN_INVALIDO' using errcode = 'P0001';
  end if;

  -- Dos fases para no violar unique(ruta_id, orden).
  foreach v_id in array p_ids loop
    i := i + 1;
    update public.parada set orden = 2000000 + i where id = v_id and ruta_id = p_ruta_id;
  end loop;

  i := 0;
  foreach v_id in array p_ids loop
    i := i + 1;
    update public.parada set orden = i where id = v_id and ruta_id = p_ruta_id;
  end loop;

  return jsonb_build_object('ok', true, 'ruta_id', p_ruta_id);
end;
$$;

revoke all on function public.reordenar_paradas_ruta(uuid, uuid[]) from public;
grant execute on function public.reordenar_paradas_ruta(uuid, uuid[]) to authenticated;

-- 0022_fr10_crear_viaje.sql
-- Operator creates scheduled trip (FR-10).

create or replace function public.crear_viaje(
  p_ruta_id uuid,
  p_conductor_id uuid,
  p_vehiculo_id uuid,
  p_fecha_salida timestamptz,
  p_precio numeric default null,
  p_eta_llegada timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_precio numeric;
  v_id uuid;
  v_veh public.vehiculo%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'operador' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if p_fecha_salida is null or p_fecha_salida < (now() - interval '1 hour') then
    raise exception 'FECHA_INVALIDA' using errcode = 'P0001';
  end if;

  if p_eta_llegada is not null and p_eta_llegada <= p_fecha_salida then
    raise exception 'FECHA_INVALIDA' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.ruta where id = p_ruta_id) then
    raise exception 'RUTA_NO_ENCONTRADA' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_conductor_id and rol = 'conductor'
  ) then
    raise exception 'CONDUCTOR_INVALIDO' using errcode = 'P0001';
  end if;

  select * into v_veh from public.vehiculo where id = p_vehiculo_id;
  if not found then
    raise exception 'VEHICULO_INVALIDO' using errcode = 'P0001';
  end if;
  if v_veh.conductor_id is distinct from p_conductor_id then
    raise exception 'VEHICULO_NO_DEL_CONDUCTOR' using errcode = 'P0001';
  end if;

  if p_precio is null then
    begin
      select (valor #>> '{}')::numeric into v_precio
      from public.settings
      where clave = 'tarifa.precio_base_tandil_bsas';
    exception
      when invalid_text_representation then
        raise exception 'PRECIO_INVALIDO' using errcode = 'P0001';
    end;
  else
    v_precio := p_precio;
  end if;

  if v_precio is null or v_precio <= 0 then
    raise exception 'PRECIO_INVALIDO' using errcode = 'P0001';
  end if;

  insert into public.viaje (
    ruta_id,
    conductor_id,
    vehiculo_id,
    fecha_salida,
    eta_llegada,
    precio,
    estado
  )
  values (
    p_ruta_id,
    p_conductor_id,
    p_vehiculo_id,
    p_fecha_salida,
    p_eta_llegada,
    v_precio,
    'programado'
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'viaje_id', v_id,
    'estado', 'programado',
    'fecha_salida', p_fecha_salida,
    'precio', v_precio
  );
end;
$$;

revoke all on function public.crear_viaje(uuid, uuid, uuid, timestamptz, numeric, timestamptz) from public;
grant execute on function public.crear_viaje(uuid, uuid, uuid, timestamptz, numeric, timestamptz) to authenticated;

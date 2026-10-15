-- Marketplace: offer_source on viaje + peer publish + operator crear_viaje tags tubi_operated
-- Driver must be KYC verified (driver_kyc_status = verified) to be assigned or publish.

alter table public.viaje
  add column if not exists offer_source text not null default 'tubi_operated';

alter table public.viaje
  drop constraint if exists viaje_offer_source_check;

alter table public.viaje
  add constraint viaje_offer_source_check
  check (offer_source in ('peer', 'tubi_operated'));

comment on column public.viaje.offer_source is
  'peer = driver published; tubi_operated = operator assigned (badge Operado por Tubi)';

-- marketplace feature flag
insert into public.settings (clave, valor, tipo, descripcion)
values (
  'marketplace.enabled',
  'false',
  'boolean',
  'Habilita publicación peer de viajes compartidos'
)
on conflict (clave) do nothing;

-- Helper: driver is assignable / can publish
create or replace function public.driver_is_verified(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and p.is_driver is true
      and p.driver_kyc_status = 'verified'
  );
$$;

-- Update crear_viaje: require verified driver + set offer_source tubi_operated
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
  v_is_op boolean;
  v_precio numeric;
  v_id uuid;
  v_veh public.vehiculo%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select coalesce(is_operator, false) into v_is_op
  from public.profiles where id = v_uid;
  if not coalesce(v_is_op, false) then
    -- fallback legacy rol
    if not exists (
      select 1 from public.profiles where id = v_uid and rol = 'operador'
    ) then
      raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
    end if;
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

  if not public.driver_is_verified(p_conductor_id) then
    raise exception 'CONDUCTOR_NO_VERIFICADO' using errcode = 'P0001';
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
    estado,
    offer_source
  ) values (
    p_ruta_id,
    p_conductor_id,
    p_vehiculo_id,
    p_fecha_salida,
    p_eta_llegada,
    v_precio,
    'programado',
    'tubi_operated'
  )
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'offer_source', 'tubi_operated');
end;
$$;

-- Peer driver publishes own trip
create or replace function public.publicar_viaje_peer(
  p_ruta_id uuid,
  p_vehiculo_id uuid,
  p_fecha_salida timestamptz,
  p_precio numeric,
  p_eta_llegada timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_enabled boolean;
  v_id uuid;
  v_veh public.vehiculo%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  begin
    select coalesce((valor #>> '{}')::boolean, false) into v_enabled
    from public.settings where clave = 'marketplace.enabled';
  exception when others then
    v_enabled := false;
  end;

  if not coalesce(v_enabled, false) then
    raise exception 'MARKETPLACE_DISABLED' using errcode = 'P0001';
  end if;

  if not public.driver_is_verified(v_uid) then
    raise exception 'CONDUCTOR_NO_VERIFICADO' using errcode = 'P0001';
  end if;

  if p_fecha_salida is null or p_fecha_salida < (now() - interval '1 hour') then
    raise exception 'FECHA_INVALIDA' using errcode = 'P0001';
  end if;

  if p_precio is null or p_precio <= 0 then
    raise exception 'PRECIO_INVALIDO' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.ruta where id = p_ruta_id) then
    raise exception 'RUTA_NO_ENCONTRADA' using errcode = 'P0001';
  end if;

  select * into v_veh from public.vehiculo where id = p_vehiculo_id;
  if not found or v_veh.conductor_id is distinct from v_uid then
    raise exception 'VEHICULO_INVALIDO' using errcode = 'P0001';
  end if;

  insert into public.viaje (
    ruta_id,
    conductor_id,
    vehiculo_id,
    fecha_salida,
    eta_llegada,
    precio,
    estado,
    offer_source
  ) values (
    p_ruta_id,
    v_uid,
    p_vehiculo_id,
    p_fecha_salida,
    p_eta_llegada,
    p_precio,
    'programado',
    'peer'
  )
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'offer_source', 'peer');
end;
$$;

grant execute on function public.publicar_viaje_peer(uuid, uuid, timestamptz, numeric, timestamptz)
  to authenticated;
grant execute on function public.driver_is_verified(uuid) to authenticated;

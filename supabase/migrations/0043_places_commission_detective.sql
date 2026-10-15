-- Places A→B search helper, peer commission obligation, detective settings.

insert into public.settings (clave, valor, tipo, descripcion)
values
  (
    'commission.peer_pct',
    '0.15',
    'number',
    'Comisión plataforma sobre precio del tramo peer (0–1)'
  ),
  (
    'commission.on_noshow',
    'false',
    'boolean',
    'Si true, cobra comisión en no-show del pasajero'
  ),
  (
    'detective.pair_cancel_window_days',
    '14',
    'number',
    'Ventana días para señal de cancelaciones en par'
  ),
  (
    'reliability.cancel_rate_threshold',
    '0.4',
    'number',
    'Umbral tasa cancelación para detective'
  )
on conflict (clave) do nothing;

-- Search viajes whose ordered stops include origen city before destino city
create or replace function public.search_viajes_places(
  p_origen text,
  p_destino text,
  p_fecha_desde timestamptz default now(),
  p_fecha_hasta timestamptz default null,
  p_limit int default 50
)
returns setof public.viaje
language sql
stable
security definer
set search_path = public
as $$
  select v.*
  from public.viaje v
  where v.estado = 'programado'
    and v.fecha_salida >= p_fecha_desde
    and (p_fecha_hasta is null or v.fecha_salida <= p_fecha_hasta)
    and exists (
      select 1
      from public.parada po
      join public.parada pd
        on pd.ruta_id = po.ruta_id
       and pd.orden > po.orden
      where po.ruta_id = v.ruta_id
        and lower(trim(po.ciudad)) = lower(trim(p_origen))
        and lower(trim(pd.ciudad)) = lower(trim(p_destino))
    )
  order by v.fecha_salida asc
  limit greatest(coalesce(p_limit, 50), 1);
$$;

grant execute on function public.search_viajes_places(text, text, timestamptz, timestamptz, int)
  to authenticated;

-- Commission obligation (peer trips)
create table if not exists public.commission_obligation (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reserva (id) on delete cascade,
  viaje_id uuid not null references public.viaje (id) on delete cascade,
  conductor_id uuid not null references public.profiles (id),
  price numeric not null,
  seña numeric not null,
  commission numeric not null,
  settlement_driver_to_tubi numeric not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  constraint commission_obligation_status_check check (
    status in ('open', 'settled', 'waived', 'overdue')
  ),
  constraint commission_obligation_reserva_unique unique (reserva_id)
);

create index if not exists commission_obligation_conductor_status_idx
  on public.commission_obligation (conductor_id, status);

alter table public.commission_obligation enable row level security;

drop policy if exists commission_own_select on public.commission_obligation;
create policy commission_own_select on public.commission_obligation
  for select to authenticated
  using (
    conductor_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.is_operator or p.rol = 'operador')
    )
  );

drop policy if exists commission_op_update on public.commission_obligation;
create policy commission_op_update on public.commission_obligation
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.is_operator or p.rol = 'operador')
    )
  );

create or replace function public.compute_peer_commission(p_precio numeric)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pct numeric;
begin
  begin
    select (valor #>> '{}')::numeric into v_pct
    from public.settings where clave = 'commission.peer_pct';
  exception when others then
    v_pct := 0.15;
  end;
  if v_pct is null or v_pct < 0 or v_pct > 1 then
    v_pct := 0.15;
  end if;
  return round(p_precio * v_pct, 2);
end;
$$;

grant execute on function public.compute_peer_commission(numeric) to authenticated;

-- After accept on peer trip: open commission obligation
create or replace function public.open_commission_on_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viaje public.viaje%rowtype;
  v_c numeric;
  v_settle numeric;
begin
  if new.request_status is distinct from 'accepted' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.request_status is not distinct from 'accepted' then
    return new;
  end if;

  select * into v_viaje from public.viaje where id = new.viaje_id;
  if not found or v_viaje.offer_source is distinct from 'peer' then
    return new;
  end if;

  v_c := public.compute_peer_commission(v_viaje.precio);
  v_settle := round(v_c - new.monto_sena, 2);

  insert into public.commission_obligation (
    reserva_id,
    viaje_id,
    conductor_id,
    price,
    seña,
    commission,
    settlement_driver_to_tubi,
    status
  ) values (
    new.id,
    v_viaje.id,
    v_viaje.conductor_id,
    v_viaje.precio,
    new.monto_sena,
    v_c,
    v_settle,
    'open'
  )
  on conflict (reserva_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_open_commission_on_accept on public.reserva;
create trigger trg_open_commission_on_accept
  after insert or update of request_status on public.reserva
  for each row
  execute function public.open_commission_on_accept();

-- Block peer publish if driver has overdue commission
create or replace function public.driver_has_overdue_commission(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.commission_obligation
    where conductor_id = p_uid
      and status in ('open', 'overdue')
      and created_at < now() - interval '7 days'
  );
$$;

grant execute on function public.driver_has_overdue_commission(uuid) to authenticated;

-- Operator resolves detective signal
create or replace function public.resolve_detective_signal(
  p_signal_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = v_uid and (is_operator or rol = 'operador')
  ) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;
  if p_status not in ('ok', 'warned', 'paused') then
    raise exception 'ESTADO_INVALIDO' using errcode = 'P0001';
  end if;

  update public.detective_signal
  set status = p_status, resolved_at = now()
  where id = p_signal_id and status = 'open';

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  return jsonb_build_object('id', p_signal_id, 'status', p_status);
end;
$$;

grant execute on function public.resolve_detective_signal(uuid, text) to authenticated;

-- Patch publicar_viaje_peer: reject overdue commission (keep prior checks)
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

  if public.driver_has_overdue_commission(v_uid) then
    raise exception 'COMMISSION_OVERDUE' using errcode = 'P0001';
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

-- 0031_cupones.sql
-- Campaign + wallet coupons (design 2026-09-28).

create type public.estado_cupon_usuario as enum (
  'disponible',
  'reservado',
  'usado',
  'vencido',
  'anulado'
);

create table public.cupon_campania (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  monto_descuento numeric not null check (monto_descuento > 0),
  cupos_totales int null check (cupos_totales is null or cupos_totales > 0),
  cupos_usados int not null default 0 check (cupos_usados >= 0),
  vigencia_desde timestamptz not null,
  vigencia_hasta timestamptz not null,
  valido_dias_post_canje int not null default 14 check (valido_dias_post_canje > 0),
  max_por_usuario int not null default 1 check (max_por_usuario > 0),
  ruta_id uuid null references public.ruta (id),
  activa boolean not null default true,
  creada_por uuid null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cupon_campania_vigencia_chk check (vigencia_hasta > vigencia_desde),
  constraint cupon_campania_cupos_chk check (
    cupos_totales is null or cupos_usados <= cupos_totales
  )
);

-- Unique case-insensitive code
create unique index cupon_campania_codigo_uidx
  on public.cupon_campania (upper(trim(codigo)));

create table public.cupon_usuario (
  id uuid primary key default gen_random_uuid(),
  campania_id uuid not null references public.cupon_campania (id),
  pasajero_id uuid not null references public.profiles (id),
  estado public.estado_cupon_usuario not null default 'disponible',
  monto_descuento numeric not null check (monto_descuento > 0),
  reserva_id uuid null references public.reserva (id),
  canjeado_en timestamptz not null default now(),
  vence_en timestamptz not null,
  usado_en timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cupon_usuario_pasajero_idx on public.cupon_usuario (pasajero_id, estado);
create index cupon_usuario_reserva_idx on public.cupon_usuario (reserva_id)
  where reserva_id is not null;

-- At most one "live" coupon per (campania, pasajero) in disponible|reservado|usado
create unique index cupon_usuario_campania_pasajero_live_uidx
  on public.cupon_usuario (campania_id, pasajero_id)
  where estado in ('disponible', 'reservado', 'usado');

alter table public.reserva
  add column if not exists cupon_usuario_id uuid null
    references public.cupon_usuario (id),
  add column if not exists descuento_monto numeric not null default 0
    check (descuento_monto >= 0);

create unique index reserva_cupon_usuario_uidx
  on public.reserva (cupon_usuario_id)
  where cupon_usuario_id is not null;

-- Feature flag (kill-switch)
insert into public.settings (clave, valor, tipo, descripcion)
values (
  'cupones.enabled',
  'true'::jsonb,
  'boolean',
  'Kill-switch de canje y aplicación de cupones'
)
on conflict (clave) do nothing;

alter table public.cupon_campania enable row level security;
alter table public.cupon_usuario enable row level security;

-- Campañas: lectura autenticada (código en UI); escritura operador vía RPC
create policy cupon_campania_select_authenticated
  on public.cupon_campania for select to authenticated
  using (true);

create policy cupon_usuario_select_own
  on public.cupon_usuario for select to authenticated
  using (
    pasajero_id = (select auth.uid())
    or (select public.is_operador())
  );

-- No direct insert/update/delete from clients; RPCs only
revoke all on table public.cupon_campania from public;
revoke all on table public.cupon_usuario from public;
grant select on table public.cupon_campania to authenticated;
grant select on table public.cupon_usuario to authenticated;

-- Helper: release coupon linked to a reservation (SECURITY DEFINER callers)
create or replace function public.cupon_liberar_si_reservado(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.cupon_usuario%rowtype;
begin
  select * into v_c
  from public.cupon_usuario
  where reserva_id = p_reserva_id
    and estado = 'reservado'
  for update;

  if not found then
    return;
  end if;

  if v_c.vence_en < now() then
    update public.cupon_usuario
    set estado = 'vencido', reserva_id = null, updated_at = now()
    where id = v_c.id;
  else
    update public.cupon_usuario
    set estado = 'disponible', reserva_id = null, updated_at = now()
    where id = v_c.id;
  end if;

  update public.reserva
  set cupon_usuario_id = null, descuento_monto = 0, updated_at = now()
  where id = p_reserva_id
    and cupon_usuario_id = v_c.id;
end;
$$;

create or replace function public.cupon_marcar_usado(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cupon_usuario
  set estado = 'usado', usado_en = now(), updated_at = now()
  where reserva_id = p_reserva_id
    and estado = 'reservado';
end;
$$;

create or replace function public.cupon_expire_disponibles(p_pasajero_id uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.cupon_usuario
  set estado = 'vencido', updated_at = now()
  where estado = 'disponible'
    and vence_en < now()
    and (p_pasajero_id is null or pasajero_id = p_pasajero_id);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Internal helpers only: no execute for authenticated/anon (see 0035).
revoke all on function public.cupon_liberar_si_reservado(uuid) from public;
revoke all on function public.cupon_liberar_si_reservado(uuid) from authenticated;
revoke all on function public.cupon_liberar_si_reservado(uuid) from anon;
revoke all on function public.cupon_marcar_usado(uuid) from public;
revoke all on function public.cupon_marcar_usado(uuid) from authenticated;
revoke all on function public.cupon_marcar_usado(uuid) from anon;
revoke all on function public.cupon_expire_disponibles(uuid) from public;
revoke all on function public.cupon_expire_disponibles(uuid) from authenticated;
revoke all on function public.cupon_expire_disponibles(uuid) from anon;

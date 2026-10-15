-- 0037_unified_identity_capabilities.sql
-- Unified identity: capability flags on profiles + legacy rol sync.

alter table public.profiles
  add column if not exists is_passenger boolean not null default true,
  add column if not exists is_driver boolean not null default false,
  add column if not exists is_operator boolean not null default false,
  add column if not exists driver_kyc_status text not null default 'unverified';

alter table public.profiles
  drop constraint if exists profiles_driver_kyc_status_check;

alter table public.profiles
  add constraint profiles_driver_kyc_status_check
  check (driver_kyc_status in (
    'unverified', 'pending_kyc', 'verified', 'rejected', 'suspended'
  ));

-- backfill from legacy rol
update public.profiles set
  is_passenger = true,
  is_driver = (rol = 'conductor'),
  is_operator = (rol = 'operador'),
  driver_kyc_status = case
    when rol = 'conductor' then 'unverified'
    else 'unverified'
  end;

-- keep rol in sync for legacy RLS (trigger)
create or replace function public.profiles_sync_legacy_rol()
returns trigger
language plpgsql
as $$
begin
  if new.is_operator then
    new.rol := 'operador';
  elsif new.is_driver then
    new.rol := 'conductor';
  else
    new.rol := 'pasajero';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_legacy_rol on public.profiles;
create trigger trg_profiles_sync_legacy_rol
  before insert or update of is_passenger, is_driver, is_operator
  on public.profiles
  for each row execute function public.profiles_sync_legacy_rol();

-- one-shot sync
update public.profiles set is_passenger = is_passenger;

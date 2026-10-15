-- Fix service_role detection for webhooks / KYC apply.
-- PostgREST no longer reliably sets request.jwt.claim.role GUC;
-- auth.jwt() ->> 'role' is the supported claim path (works with legacy
-- service_role JWT and secret keys that mint service_role claims).
-- Symptom: Didit Approved webhooks updated driver_kyc_sessions but
-- apply_driver_kyc_result raised NO_AUTORIZADO → profile stuck pending_kyc.

create or replace function public.is_service_role_request()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    or coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      ''
    ) = 'service_role'
    or coalesce(
      nullif(
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
        ''
      ),
      ''
    ) = 'service_role';
$$;

revoke all on function public.is_service_role_request() from public;
grant execute on function public.is_service_role_request() to authenticated;
grant execute on function public.is_service_role_request() to service_role;
grant execute on function public.is_service_role_request() to anon;

comment on function public.is_service_role_request() is
  'True when the caller is service_role (webhook/admin). Prefer auth.jwt() over legacy GUC.';

-- 1) Capability protect trigger
create or replace function public.profiles_protect_capabilities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allow text := coalesce(
    nullif(current_setting('tubi.allow_capability_write', true), ''),
    ''
  );
begin
  if public.is_service_role_request() or v_allow = '1' then
    return new;
  end if;

  if public.is_operador() then
    return new;
  end if;

  new.is_operator := old.is_operator;
  new.is_driver := old.is_driver;
  new.driver_kyc_status := old.driver_kyc_status;
  new.dni_verificado := old.dni_verificado;
  return new;
end;
$$;

-- 2) Apply KYC result (webhook + callback sync)
create or replace function public.apply_driver_kyc_result(
  p_user_id uuid,
  p_status text,
  p_dni_verificado boolean default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles%rowtype;
begin
  if not public.is_service_role_request() and not public.is_operador() then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if p_status not in ('verified', 'rejected', 'pending_kyc', 'unverified') then
    raise exception 'ESTADO_INVALIDO' using errcode = 'P0001';
  end if;

  perform set_config('tubi.allow_capability_write', '1', true);

  update public.profiles
  set
    is_driver = case when p_status = 'verified' then true else is_driver end,
    driver_kyc_status = p_status,
    dni_verificado = coalesce(p_dni_verificado, dni_verificado)
  where id = p_user_id
  returning * into v_row;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;
  return v_row;
end;
$$;

revoke all on function public.apply_driver_kyc_result(uuid, text, boolean) from public;
grant execute on function public.apply_driver_kyc_result(uuid, text, boolean) to authenticated;
grant execute on function public.apply_driver_kyc_result(uuid, text, boolean) to service_role;

-- 3) Notification enqueue (same broken GUC check)
create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_href text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if not public.is_service_role_request() then
    if v_uid is null then
      raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
    end if;
    if p_user_id is distinct from v_uid then
      raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
    end if;
  end if;

  insert into public.notification_outbox (user_id, title, body, href)
  values (p_user_id, p_title, p_body, p_href)
  returning id into v_id;
  return v_id;
end;
$$;

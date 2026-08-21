-- 0006_profiles_rls_fix.sql
-- Fix profiles RLS race/recursion on signup (INSERT … RETURNING) and
-- block self-assignment of rol = operador.
--
-- Root cause:
-- 1. SELECT/UPDATE policies called current_rol() which reads profiles.
--    On INSERT … RETURNING Postgres also evaluates SELECT policies; combining
--    self-read helpers on the same table is fragile and can fail or recurse.
-- 2. INSERT only checked id = auth.uid(), so a user could insert as operador.
-- 3. UPDATE with check allowed the owner to change rol freely (incl. operador).
--
-- Fix:
-- - Own-row policies use only (select auth.uid()) — no profiles self-read.
-- - Operador access is a separate permissive policy via is_operador().
-- - is_operador()/current_rol() stay SECURITY DEFINER (bypass RLS).
-- - INSERT/UPDATE reject self-service operador role.

create or replace function public.current_rol()
returns rol
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_operador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and rol = 'operador'
  );
$$;

revoke all on function public.current_rol() from public;
revoke all on function public.is_operador() from public;
grant execute on function public.current_rol() to authenticated;
grant execute on function public.is_operador() to authenticated;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_operador on public.profiles;
drop policy if exists profiles_update_operador on public.profiles;

-- Own row: no helper that reads profiles (safe for signup INSERT … RETURNING).
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_operador
  on public.profiles
  for select
  to authenticated
  using ((select public.is_operador()));

-- Self-signup may only create pasajero | conductor for the authenticated user.
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and rol in ('pasajero', 'conductor')
  );

-- Owner may update own row but cannot escalate to operador.
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and rol in ('pasajero', 'conductor')
  );

-- Operador may update any profile (incl. dni_verificado, rol).
create policy profiles_update_operador
  on public.profiles
  for update
  to authenticated
  using ((select public.is_operador()))
  with check ((select public.is_operador()));

grant select, insert, update on table public.profiles to authenticated;

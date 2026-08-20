-- 0005_profiles_auth.sql
-- Profiles RLS + current_rol() helper for role-aware policies.
-- No auto-profile trigger: app inserts profile after signup.

create or replace function public.current_rol()
returns rol
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.current_rol() = 'operador');

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.current_rol() = 'operador')
  with check (id = auth.uid() or public.current_rol() = 'operador');

grant select, insert, update on table public.profiles to authenticated;

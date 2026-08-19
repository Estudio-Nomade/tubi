-- 0003_settings_select_policy.sql
-- AD-5 / docs/04: settings SELECT for authenticated users.
-- Also allow anon SELECT so public business config is readable before login
-- (amounts/flags are not secrets; writes remain locked until operator policies).

create policy settings_select_authenticated
  on public.settings
  for select
  to authenticated
  using (true);

create policy settings_select_anon
  on public.settings
  for select
  to anon
  using (true);

-- 0017_slice10_settings_update.sql
-- FR-16: operador can UPDATE business settings (O2).
-- SELECT already granted (0003/0004). Writes were locked until this policy.

grant update on table public.settings to authenticated;

create policy settings_update_operador
  on public.settings
  for update
  to authenticated
  using ((select public.is_operador()))
  with check ((select public.is_operador()));

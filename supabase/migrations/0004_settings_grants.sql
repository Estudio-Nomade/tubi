-- 0004_settings_grants.sql
-- RLS policies alone are not enough: roles need table privileges.

grant select on table public.settings to anon, authenticated;

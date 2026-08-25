-- 0007_slice2_catalog_rls.sql
-- Slice 2A: authenticated SELECT on trip catalog + public conductor profiles.

grant select on table public.ruta to authenticated;
grant select on table public.parada to authenticated;
grant select on table public.viaje to authenticated;
grant select on table public.vehiculo to authenticated;

drop policy if exists ruta_select_auth on public.ruta;
create policy ruta_select_auth
  on public.ruta
  for select
  to authenticated
  using (true);

drop policy if exists parada_select_auth on public.parada;
create policy parada_select_auth
  on public.parada
  for select
  to authenticated
  using (true);

drop policy if exists viaje_select_auth on public.viaje;
create policy viaje_select_auth
  on public.viaje
  for select
  to authenticated
  using (true);

drop policy if exists vehiculo_select_auth on public.vehiculo;
create policy vehiculo_select_auth
  on public.vehiculo
  for select
  to authenticated
  using (true);

-- Conductors visible for trip detail joins (app must never select dni).
drop policy if exists profiles_select_conductores on public.profiles;
create policy profiles_select_conductores
  on public.profiles
  for select
  to authenticated
  using (rol = 'conductor');

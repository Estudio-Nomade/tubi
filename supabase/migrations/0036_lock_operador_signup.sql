-- 0036_lock_operador_signup.sql
-- Close public operator self-signup (login still allowed).
-- Demo trips are seeded out-of-band via service role (see scripts/seed-demo-trips.mjs).

insert into public.settings (clave, valor, tipo, descripcion)
values (
  'auth.allow_operador_signup',
  'false'::jsonb,
  'boolean',
  'Permite el alta self-service de cuentas de operador'
)
on conflict (clave) do update
set
  valor = 'false'::jsonb,
  updated_at = now();

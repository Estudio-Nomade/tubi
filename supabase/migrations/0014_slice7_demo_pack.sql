-- 0014_slice7_demo_pack.sql
-- Demo pack: passenger Ana + 2 companions, trip today 07:00 AR, 3 confirmed reservas + sena pagos.
-- Password for all demo users: demo-demo-1
-- Apply after 0008–0013 (conductor, operador, schema).
--
-- Fixed IDs
-- --------
-- Conductor (from 0008): aaaaaaaa-bbbb-cccc-dddd-000000000001  conductor.demo@tubi.local → Luis Demo
-- Operador  (from 0011): aaaaaaaa-bbbb-cccc-dddd-000000000099  operador.demo@tubi.local
-- Ruta      (from 0008): bbbbbbbb-bbbb-cccc-dddd-000000000001
-- Vehiculo  (from 0008): dddddddd-bbbb-cccc-dddd-000000000001
--
-- Ana pasajero:          aaaaaaaa-bbbb-cccc-dddd-000000000010  pasajero.demo@tubi.local
-- Pasajero B:            aaaaaaaa-bbbb-cccc-dddd-000000000011  pasajero.b@tubi.local
-- Pasajero C:            aaaaaaaa-bbbb-cccc-dddd-000000000012  pasajero.c@tubi.local
--
-- Viaje hoy 07:00 AR:    eeeeeeee-bbbb-cccc-dddd-000000000010
-- Reserva Ana:           ffffffff-bbbb-cccc-dddd-000000000010  qr_token opq_demo_ana_0001
-- Reserva B:             ffffffff-bbbb-cccc-dddd-000000000011  qr_token opq_demo_b_0002
-- Reserva C:             ffffffff-bbbb-cccc-dddd-000000000012  qr_token opq_demo_c_0003
-- Pago sena Ana:         11111111-bbbb-cccc-dddd-000000000010
-- Pago sena B:           11111111-bbbb-cccc-dddd-000000000011
-- Pago sena C:           11111111-bbbb-cccc-dddd-000000000012

-- ---------------------------------------------------------------------------
-- Conductor profile → Luis Demo
-- ---------------------------------------------------------------------------
update public.profiles
set
  nombre = 'Luis',
  apellido = 'Demo',
  updated_at = now()
where id = 'aaaaaaaa-bbbb-cccc-dddd-000000000001';

-- ---------------------------------------------------------------------------
-- Auth users: Ana + pasajero B + pasajero C
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-bbbb-cccc-dddd-000000000010',
    'authenticated',
    'authenticated',
    'pasajero.demo@tubi.local',
    crypt('demo-demo-1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-bbbb-cccc-dddd-000000000011',
    'authenticated',
    'authenticated',
    'pasajero.b@tubi.local',
    crypt('demo-demo-1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-bbbb-cccc-dddd-000000000012',
    'authenticated',
    'authenticated',
    'pasajero.c@tubi.local',
    crypt('demo-demo-1', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'aaaaaaaa-bbbb-cccc-dddd-000000000010',
    'aaaaaaaa-bbbb-cccc-dddd-000000000010',
    jsonb_build_object(
      'sub', 'aaaaaaaa-bbbb-cccc-dddd-000000000010',
      'email', 'pasajero.demo@tubi.local',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    'aaaaaaaa-bbbb-cccc-dddd-000000000010',
    now(),
    now(),
    now()
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-000000000011',
    'aaaaaaaa-bbbb-cccc-dddd-000000000011',
    jsonb_build_object(
      'sub', 'aaaaaaaa-bbbb-cccc-dddd-000000000011',
      'email', 'pasajero.b@tubi.local',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    'aaaaaaaa-bbbb-cccc-dddd-000000000011',
    now(),
    now(),
    now()
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-000000000012',
    'aaaaaaaa-bbbb-cccc-dddd-000000000012',
    jsonb_build_object(
      'sub', 'aaaaaaaa-bbbb-cccc-dddd-000000000012',
      'email', 'pasajero.c@tubi.local',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    'aaaaaaaa-bbbb-cccc-dddd-000000000012',
    now(),
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.profiles (id, rol, nombre, apellido, telefono, dni)
values
  (
    'aaaaaaaa-bbbb-cccc-dddd-000000000010',
    'pasajero',
    'Ana',
    'Demo',
    '+5492494000010',
    null
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-000000000011',
    'pasajero',
    'Bruno',
    'Demo',
    '+5492494000011',
    null
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-000000000012',
    'pasajero',
    'Carla',
    'Demo',
    '+5492494000012',
    null
  )
on conflict (id) do update
set
  rol = excluded.rol,
  nombre = excluded.nombre,
  apellido = excluded.apellido,
  telefono = excluded.telefono,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Trip today 07:00 America/Argentina/Buenos_Aires (programado, precio 25000)
-- ETA ~ +4.5h (same pattern as 0008 morning trip)
-- ---------------------------------------------------------------------------
insert into public.viaje (
  id,
  ruta_id,
  conductor_id,
  vehiculo_id,
  fecha_salida,
  eta_llegada,
  precio,
  estado
)
values (
  'eeeeeeee-bbbb-cccc-dddd-000000000010',
  'bbbbbbbb-bbbb-cccc-dddd-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'dddddddd-bbbb-cccc-dddd-000000000001',
  (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '7 hours'
  ) at time zone 'America/Argentina/Buenos_Aires',
  (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '11 hours 30 minutes'
  ) at time zone 'America/Argentina/Buenos_Aires',
  25000,
  'programado'
)
on conflict (id) do update
set
  ruta_id = excluded.ruta_id,
  conductor_id = excluded.conductor_id,
  vehiculo_id = excluded.vehiculo_id,
  fecha_salida = excluded.fecha_salida,
  eta_llegada = excluded.eta_llegada,
  precio = excluded.precio,
  estado = excluded.estado,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3 confirmed reservas + matching sena pagos (confirmado)
-- ---------------------------------------------------------------------------
insert into public.reserva (
  id,
  viaje_id,
  pasajero_id,
  asiento_num,
  estado,
  monto_sena,
  qr_token,
  politica_cancelacion
)
values
  (
    'ffffffff-bbbb-cccc-dddd-000000000010',
    'eeeeeeee-bbbb-cccc-dddd-000000000010',
    'aaaaaaaa-bbbb-cccc-dddd-000000000010',
    1,
    'confirmada',
    5000,
    'opq_demo_ana_0001',
    '{"devolucion_24h_pct":100,"devolucion_12_24h_pct":50,"devolucion_menos_12h_pct":0}'::jsonb
  ),
  (
    'ffffffff-bbbb-cccc-dddd-000000000011',
    'eeeeeeee-bbbb-cccc-dddd-000000000010',
    'aaaaaaaa-bbbb-cccc-dddd-000000000011',
    2,
    'confirmada',
    5000,
    'opq_demo_b_0002',
    '{"devolucion_24h_pct":100,"devolucion_12_24h_pct":50,"devolucion_menos_12h_pct":0}'::jsonb
  ),
  (
    'ffffffff-bbbb-cccc-dddd-000000000012',
    'eeeeeeee-bbbb-cccc-dddd-000000000010',
    'aaaaaaaa-bbbb-cccc-dddd-000000000012',
    3,
    'confirmada',
    5000,
    'opq_demo_c_0003',
    '{"devolucion_24h_pct":100,"devolucion_12_24h_pct":50,"devolucion_menos_12h_pct":0}'::jsonb
  )
on conflict (id) do update
set
  viaje_id = excluded.viaje_id,
  pasajero_id = excluded.pasajero_id,
  asiento_num = excluded.asiento_num,
  estado = excluded.estado,
  monto_sena = excluded.monto_sena,
  qr_token = excluded.qr_token,
  politica_cancelacion = excluded.politica_cancelacion,
  cancelada_en = null,
  updated_at = now();

insert into public.pago (
  id,
  reserva_id,
  tipo,
  monto,
  metodo,
  estado,
  comprobante,
  confirmado_por
)
values
  (
    '11111111-bbbb-cccc-dddd-000000000010',
    'ffffffff-bbbb-cccc-dddd-000000000010',
    'sena',
    5000,
    'transferencia',
    'confirmado',
    null,
    'aaaaaaaa-bbbb-cccc-dddd-000000000099'
  ),
  (
    '11111111-bbbb-cccc-dddd-000000000011',
    'ffffffff-bbbb-cccc-dddd-000000000011',
    'sena',
    5000,
    'transferencia',
    'confirmado',
    null,
    'aaaaaaaa-bbbb-cccc-dddd-000000000099'
  ),
  (
    '11111111-bbbb-cccc-dddd-000000000012',
    'ffffffff-bbbb-cccc-dddd-000000000012',
    'sena',
    5000,
    'transferencia',
    'confirmado',
    null,
    'aaaaaaaa-bbbb-cccc-dddd-000000000099'
  )
on conflict (id) do update
set
  reserva_id = excluded.reserva_id,
  tipo = excluded.tipo,
  monto = excluded.monto,
  metodo = excluded.metodo,
  estado = excluded.estado,
  confirmado_por = excluded.confirmado_por;

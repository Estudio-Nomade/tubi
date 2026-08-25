-- 0008_slice2_seed_demo.sql
-- Slice 2A: demo price, conductor, route, stops, vehicle, scheduled trips.
-- Local-only credentials: conductor.demo@tubi.local / demo-demo-1

insert into public.settings (clave, valor, tipo, descripcion)
values (
  'tarifa.precio_base_tandil_bsas',
  '25000'::jsonb,
  'number',
  'Precio base demo Tandil-BsAs'
)
on conflict (clave) do update
set
  valor = excluded.valor,
  updated_at = now();

-- Demo conductor auth user (Supabase local identity shape).
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
values (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'authenticated',
  'authenticated',
  'conductor.demo@tubi.local',
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
values (
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  jsonb_build_object(
    'sub', 'aaaaaaaa-bbbb-cccc-dddd-000000000001',
    'email', 'conductor.demo@tubi.local',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  now(),
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.profiles (id, rol, nombre, apellido, telefono, dni)
values (
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'conductor',
  'Ariel',
  'Demo',
  '+5492494123456',
  null
)
on conflict (id) do update
set
  rol = excluded.rol,
  nombre = excluded.nombre,
  apellido = excluded.apellido,
  telefono = excluded.telefono;

insert into public.ruta (id, nombre, origen, destino)
values (
  'bbbbbbbb-bbbb-cccc-dddd-000000000001',
  'Tandil ↔ Buenos Aires',
  'Tandil',
  'Buenos Aires'
)
on conflict (id) do nothing;

insert into public.parada (id, ruta_id, nombre, ciudad, lat, lng, orden, tipo)
values
  (
    'cccccccc-bbbb-cccc-dddd-000000000001',
    'bbbbbbbb-bbbb-cccc-dddd-000000000001',
    'Terminal Tandil',
    'Tandil',
    -37.3217,
    -59.1332,
    1,
    'origen'
  ),
  (
    'cccccccc-bbbb-cccc-dddd-000000000002',
    'bbbbbbbb-bbbb-cccc-dddd-000000000001',
    'Centro Rauch',
    'Rauch',
    -36.7745,
    -59.0833,
    2,
    'intermedio'
  ),
  (
    'cccccccc-bbbb-cccc-dddd-000000000003',
    'bbbbbbbb-bbbb-cccc-dddd-000000000001',
    'Las Flores',
    'Las Flores',
    -36.0147,
    -59.0994,
    3,
    'intermedio'
  ),
  (
    'cccccccc-bbbb-cccc-dddd-000000000004',
    'bbbbbbbb-bbbb-cccc-dddd-000000000001',
    'Retiro',
    'Buenos Aires',
    -34.5914,
    -58.3743,
    4,
    'destino'
  )
on conflict (id) do nothing;

insert into public.vehiculo (
  id,
  conductor_id,
  patente,
  marca,
  modelo,
  color,
  capacidad
)
values (
  'dddddddd-bbbb-cccc-dddd-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'AB123CD',
  'Toyota',
  'Corolla',
  'blanco',
  4
)
on conflict (id) do nothing;

-- Fixed demo trips (UTC = AR -03:00 → 07:30 AR = 10:30Z, 14:00 AR = 17:00Z)
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
values
  (
    'eeeeeeee-bbbb-cccc-dddd-000000000001',
    'bbbbbbbb-bbbb-cccc-dddd-000000000001',
    'aaaaaaaa-bbbb-cccc-dddd-000000000001',
    'dddddddd-bbbb-cccc-dddd-000000000001',
    (current_date + interval '1 day' + time '10:30') at time zone 'UTC',
    (current_date + interval '1 day' + time '15:00') at time zone 'UTC',
    25000,
    'programado'
  ),
  (
    'eeeeeeee-bbbb-cccc-dddd-000000000002',
    'bbbbbbbb-bbbb-cccc-dddd-000000000001',
    'aaaaaaaa-bbbb-cccc-dddd-000000000001',
    'dddddddd-bbbb-cccc-dddd-000000000001',
    (current_date + interval '1 day' + time '17:00') at time zone 'UTC',
    (current_date + interval '1 day' + time '21:30') at time zone 'UTC',
    25000,
    'programado'
  ),
  (
    'eeeeeeee-bbbb-cccc-dddd-000000000003',
    'bbbbbbbb-bbbb-cccc-dddd-000000000001',
    'aaaaaaaa-bbbb-cccc-dddd-000000000001',
    'dddddddd-bbbb-cccc-dddd-000000000001',
    (current_date + interval '2 day' + time '10:30') at time zone 'UTC',
    (current_date + interval '2 day' + time '15:00') at time zone 'UTC',
    25000,
    'programado'
  )
on conflict (id) do nothing;

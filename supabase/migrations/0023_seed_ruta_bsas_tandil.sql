-- 0023_seed_ruta_bsas_tandil.sql
-- Reverse corridor Buenos Aires → Tandil (pair of FR-10 operator catalog).

insert into public.ruta (id, nombre, origen, destino)
values (
  'bbbbbbbb-bbbb-cccc-dddd-000000000002',
  'Buenos Aires ↔ Tandil',
  'Buenos Aires',
  'Tandil'
)
on conflict (id) do nothing;

insert into public.parada (id, ruta_id, nombre, ciudad, lat, lng, orden, tipo)
values
  (
    'cccccccc-bbbb-cccc-dddd-000000000011',
    'bbbbbbbb-bbbb-cccc-dddd-000000000002',
    'Retiro',
    'Buenos Aires',
    -34.5914,
    -58.3743,
    1,
    'origen'
  ),
  (
    'cccccccc-bbbb-cccc-dddd-000000000012',
    'bbbbbbbb-bbbb-cccc-dddd-000000000002',
    'Las Flores',
    'Las Flores',
    -36.0147,
    -59.0994,
    2,
    'intermedio'
  ),
  (
    'cccccccc-bbbb-cccc-dddd-000000000013',
    'bbbbbbbb-bbbb-cccc-dddd-000000000002',
    'Centro Rauch',
    'Rauch',
    -36.7745,
    -59.0833,
    3,
    'intermedio'
  ),
  (
    'cccccccc-bbbb-cccc-dddd-000000000014',
    'bbbbbbbb-bbbb-cccc-dddd-000000000002',
    'Terminal Tandil',
    'Tandil',
    -37.3217,
    -59.1332,
    4,
    'destino'
  )
on conflict (id) do nothing;

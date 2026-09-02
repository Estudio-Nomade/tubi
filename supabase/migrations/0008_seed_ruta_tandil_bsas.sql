-- 0008_seed_ruta_tandil_bsas.sql
-- Corredor principal Tandil ↔ Buenos Aires (catálogo operador, FR-10).
-- Dato de producto real: ruta + paradas.

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

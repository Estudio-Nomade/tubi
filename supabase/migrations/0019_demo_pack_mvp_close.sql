-- 0019_demo_pack_mvp_close.sql
-- Refresh demo pack for MVP close walkthrough (after 0014 + slices 7–10).
-- Does NOT recreate auth users (0014). Idempotent upserts by fixed IDs.
-- Password remains demo-demo-1 for all demo accounts.
--
-- Fixed IDs (same namespace as 0014)
-- --------------------------------
-- Luis conductor: aaaaaaaa-bbbb-cccc-dddd-000000000001
-- Operador:       aaaaaaaa-bbbb-cccc-dddd-000000000099
-- Ana / Bruno / Carla: …010 / …011 / …012
-- Ruta / vehículo: bbbbbbbb…001 / dddddddd…001
--
-- Viaje A (recogida + QR demo): eeeeeeee-bbbb-cccc-dddd-000000000010
--   Reservas Ana/Bruno/Carla confirmada + QR (from 0014 IDs …010–012)
-- Viaje B (listo Finalizar):    eeeeeeee-bbbb-cccc-dddd-000000000020  en_curso
--   Reservas abordada/no_show (IDs …020–022)
-- Viaje C (cola operador):      eeeeeeee-bbbb-cccc-dddd-000000000030  programado mañana
--   Reserva Ana pendiente_sena + pago sena pendiente (IDs …030)

-- ---------------------------------------------------------------------------
-- A) Viaje hoy 07:00 AR — programado, 3 confirmadas con QR (walkthrough C5)
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

-- ---------------------------------------------------------------------------
-- B) Viaje hoy 14:00 AR — en_curso, listo para Finalizar
--    Bruno abordada, Carla no_show (Ana stays only on viaje A for home/QR)
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
  'eeeeeeee-bbbb-cccc-dddd-000000000020',
  'bbbbbbbb-bbbb-cccc-dddd-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'dddddddd-bbbb-cccc-dddd-000000000001',
  (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '14 hours'
  ) at time zone 'America/Argentina/Buenos_Aires',
  (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '18 hours 30 minutes'
  ) at time zone 'America/Argentina/Buenos_Aires',
  25000,
  'en_curso'
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
    'ffffffff-bbbb-cccc-dddd-000000000021',
    'eeeeeeee-bbbb-cccc-dddd-000000000020',
    'aaaaaaaa-bbbb-cccc-dddd-000000000011',
    1,
    'abordada',
    5000,
    'opq_demo_fin_b_0021',
    '{"devolucion_24h_pct":100,"devolucion_12_24h_pct":50,"devolucion_menos_12h_pct":0}'::jsonb
  ),
  (
    'ffffffff-bbbb-cccc-dddd-000000000022',
    'eeeeeeee-bbbb-cccc-dddd-000000000020',
    'aaaaaaaa-bbbb-cccc-dddd-000000000012',
    2,
    'no_show',
    5000,
    'opq_demo_fin_c_0022',
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
    '11111111-bbbb-cccc-dddd-000000000021',
    'ffffffff-bbbb-cccc-dddd-000000000021',
    'sena',
    5000,
    'transferencia',
    'confirmado',
    null,
    'aaaaaaaa-bbbb-cccc-dddd-000000000099'
  ),
  (
    '11111111-bbbb-cccc-dddd-000000000022',
    'ffffffff-bbbb-cccc-dddd-000000000022',
    'sena',
    5000,
    'transferencia',
    'confirmado',
    null,
    'aaaaaaaa-bbbb-cccc-dddd-000000000099'
  ),
  (
    '22222222-bbbb-cccc-dddd-000000000021',
    'ffffffff-bbbb-cccc-dddd-000000000021',
    'saldo',
    20000,
    'efectivo',
    'confirmado',
    null,
    'aaaaaaaa-bbbb-cccc-dddd-000000000001'
  )
on conflict (id) do update
set
  reserva_id = excluded.reserva_id,
  tipo = excluded.tipo,
  monto = excluded.monto,
  metodo = excluded.metodo,
  estado = excluded.estado,
  confirmado_por = excluded.confirmado_por;

-- ---------------------------------------------------------------------------
-- C) Viaje mañana 09:00 AR — programado + seña pendiente (cola operador)
--    Bruno: pendiente_sena (Ana keeps home/QR on viaje A confirmada)
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
  'eeeeeeee-bbbb-cccc-dddd-000000000030',
  'bbbbbbbb-bbbb-cccc-dddd-000000000001',
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'dddddddd-bbbb-cccc-dddd-000000000001',
  (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '1 day'
    + interval '9 hours'
  ) at time zone 'America/Argentina/Buenos_Aires',
  (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '1 day'
    + interval '13 hours 30 minutes'
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
values (
  'ffffffff-bbbb-cccc-dddd-000000000030',
  'eeeeeeee-bbbb-cccc-dddd-000000000030',
  'aaaaaaaa-bbbb-cccc-dddd-000000000011',
  1,
  'pendiente_sena',
  5000,
  'opq_demo_sena_pend_0030',
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
values (
  '11111111-bbbb-cccc-dddd-000000000030',
  'ffffffff-bbbb-cccc-dddd-000000000030',
  'sena',
  5000,
  'transferencia',
  'pendiente',
  null,
  null
)
on conflict (id) do update
set
  reserva_id = excluded.reserva_id,
  tipo = excluded.tipo,
  monto = excluded.monto,
  metodo = excluded.metodo,
  estado = excluded.estado,
  confirmado_por = excluded.confirmado_por;

-- ---------------------------------------------------------------------------
-- D) Refresh 0008 catalog trips to stay bookable (tomorrow / +2d)
-- ---------------------------------------------------------------------------
update public.viaje
set
  fecha_salida = (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '1 day'
    + interval '7 hours 30 minutes'
  ) at time zone 'America/Argentina/Buenos_Aires',
  eta_llegada = (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '1 day'
    + interval '12 hours'
  ) at time zone 'America/Argentina/Buenos_Aires',
  estado = 'programado',
  updated_at = now()
where id = 'eeeeeeee-bbbb-cccc-dddd-000000000001';

update public.viaje
set
  fecha_salida = (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '1 day'
    + interval '14 hours'
  ) at time zone 'America/Argentina/Buenos_Aires',
  eta_llegada = (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '1 day'
    + interval '18 hours 30 minutes'
  ) at time zone 'America/Argentina/Buenos_Aires',
  estado = 'programado',
  updated_at = now()
where id = 'eeeeeeee-bbbb-cccc-dddd-000000000002';

update public.viaje
set
  fecha_salida = (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '2 day'
    + interval '7 hours 30 minutes'
  ) at time zone 'America/Argentina/Buenos_Aires',
  eta_llegada = (
    date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
    + interval '2 day'
    + interval '12 hours'
  ) at time zone 'America/Argentina/Buenos_Aires',
  estado = 'programado',
  updated_at = now()
where id = 'eeeeeeee-bbbb-cccc-dddd-000000000003';

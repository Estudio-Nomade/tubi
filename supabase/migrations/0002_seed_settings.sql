insert into settings (clave, valor, tipo) values
  ('tarifa.precio_base_tandil_bsas', '0',                            'number'),
  ('tarifa.modelo',                   '"fijo_por_ruta"',             'text'),
  ('comision.plataforma_pct',         '15',                          'number'),
  ('reserva.sena_monto',              '5000',                        'number'),
  ('reserva.espera_max_min',          '5',                           'number'),
  ('reserva.devolucion_24h_pct',      '100',                         'number'),
  ('reserva.devolucion_12_24h_pct',   '50',                          'number'),
  ('reserva.devolucion_menos_12h_pct','0',                           'number'),
  ('pagos.metodos',                   '["efectivo","transferencia"]','json'),
  ('verificacion.dni_modo',           '"manual"',                    'text'),
  ('feature.ratings_habilitado',      'false',                       'boolean');

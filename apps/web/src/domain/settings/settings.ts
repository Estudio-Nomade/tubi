/**
 * Business setting keys (AD-5). Match supabase/migrations/0002_seed_settings.sql.
 * Never hardcode monetary/time values in feature code — read these keys from DB.
 */

export const SETTING_KEYS = {
  TARIFA_PRECIO_BASE_TANDIL_BSAS: "tarifa.precio_base_tandil_bsas",
  TARIFA_MODELO: "tarifa.modelo",
  COMISION_PLATAFORMA_PCT: "comision.plataforma_pct",
  RESERVA_SENA_MONTO: "reserva.sena_monto",
  RESERVA_ESPERA_MAX_MIN: "reserva.espera_max_min",
  RESERVA_DEVOLUCION_24H_PCT: "reserva.devolucion_24h_pct",
  RESERVA_DEVOLUCION_12_24H_PCT: "reserva.devolucion_12_24h_pct",
  RESERVA_DEVOLUCION_MENOS_12H_PCT: "reserva.devolucion_menos_12h_pct",
  PAGOS_METODOS: "pagos.metodos",
  VERIFICACION_DNI_MODO: "verificacion.dni_modo",
  FEATURE_RATINGS_HABILITADO: "feature.ratings_habilitado",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const SETTING_KEY_LIST: readonly SettingKey[] = Object.values(SETTING_KEYS);

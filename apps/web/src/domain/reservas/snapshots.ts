/**
 * Snapshot builders from settings map (AD-5).
 * Never hardcode sena / refund percentages — throw if key missing.
 */

import { SETTING_KEYS, type Setting } from "@/domain/settings";

export type PoliticaCancelacionSnapshot = {
  devolucion_24h_pct: number;
  devolucion_12_24h_pct: number;
  devolucion_menos_12h_pct: number;
};

function readNumberSetting(
  settings: ReadonlyMap<string, Setting>,
  clave: string,
): number {
  const row = settings.get(clave);
  if (!row) {
    throw new Error(`SETTING_MISSING:${clave}`);
  }
  const raw = row.valor;
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : Number.NaN;
  if (!Number.isFinite(n)) {
    throw new Error(`SETTING_INVALID:${clave}`);
  }
  return n;
}

export function readSenaMonto(
  settings: ReadonlyMap<string, Setting>,
): number {
  return readNumberSetting(settings, SETTING_KEYS.RESERVA_SENA_MONTO);
}

export function buildPoliticaCancelacion(
  settings: ReadonlyMap<string, Setting>,
): PoliticaCancelacionSnapshot {
  return {
    devolucion_24h_pct: readNumberSetting(
      settings,
      SETTING_KEYS.RESERVA_DEVOLUCION_24H_PCT,
    ),
    devolucion_12_24h_pct: readNumberSetting(
      settings,
      SETTING_KEYS.RESERVA_DEVOLUCION_12_24H_PCT,
    ),
    devolucion_menos_12h_pct: readNumberSetting(
      settings,
      SETTING_KEYS.RESERVA_DEVOLUCION_MENOS_12H_PCT,
    ),
  };
}

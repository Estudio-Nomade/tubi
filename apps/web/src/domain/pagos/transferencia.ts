import { SETTING_KEYS, type Setting } from "@/domain/settings";

import type { TransferenciaInstrucciones } from "./types";

function readTextSetting(
  settings: ReadonlyMap<string, Setting>,
  clave: string,
): string {
  const row = settings.get(clave);
  if (!row) {
    throw new Error(`SETTING_MISSING:${clave}`);
  }
  const raw = row.valor;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (raw != null && typeof raw !== "object") return String(raw);
  throw new Error(`SETTING_INVALID:${clave}`);
}

export function readTransferenciaInstrucciones(
  settings: ReadonlyMap<string, Setting>,
): TransferenciaInstrucciones {
  return {
    banco: readTextSetting(settings, SETTING_KEYS.PAGOS_TRANSFERENCIA_BANCO),
    alias: readTextSetting(settings, SETTING_KEYS.PAGOS_TRANSFERENCIA_ALIAS),
    cbu: readTextSetting(settings, SETTING_KEYS.PAGOS_TRANSFERENCIA_CBU),
    titular: readTextSetting(settings, SETTING_KEYS.PAGOS_TRANSFERENCIA_TITULAR),
  };
}

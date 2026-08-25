/**
 * Editable business settings (FR-16 / O2).
 * Only these keys may be written from the operator UI.
 */

import { z } from "zod";

import { SETTING_KEYS, type SettingKey } from "./settings";
import type { SettingTipo, SettingValue } from "./types";

export const EDITABLE_SETTING_KEYS = [
  SETTING_KEYS.TARIFA_PRECIO_BASE_TANDIL_BSAS,
  SETTING_KEYS.COMISION_PLATAFORMA_PCT,
  SETTING_KEYS.RESERVA_SENA_MONTO,
  SETTING_KEYS.RESERVA_ESPERA_MAX_MIN,
  SETTING_KEYS.RESERVA_DEVOLUCION_24H_PCT,
  SETTING_KEYS.RESERVA_DEVOLUCION_12_24H_PCT,
  SETTING_KEYS.RESERVA_DEVOLUCION_MENOS_12H_PCT,
  SETTING_KEYS.PAGOS_TRANSFERENCIA_BANCO,
  SETTING_KEYS.PAGOS_TRANSFERENCIA_ALIAS,
  SETTING_KEYS.PAGOS_TRANSFERENCIA_CBU,
  SETTING_KEYS.PAGOS_TRANSFERENCIA_TITULAR,
  SETTING_KEYS.FEATURE_RATINGS_HABILITADO,
] as const satisfies readonly SettingKey[];

export type EditableSettingKey = (typeof EDITABLE_SETTING_KEYS)[number];

const editableKeySet = new Set<string>(EDITABLE_SETTING_KEYS);

export function isEditableSettingKey(clave: string): clave is EditableSettingKey {
  return editableKeySet.has(clave);
}

export type EditableFieldMeta = {
  clave: EditableSettingKey;
  tipo: SettingTipo;
  label: string;
  caption?: string;
  group: "tarifa" | "reserva" | "pagos" | "flags";
  unit?: "ars" | "pct" | "min";
};

export const EDITABLE_FIELD_META: readonly EditableFieldMeta[] = [
  {
    clave: SETTING_KEYS.TARIFA_PRECIO_BASE_TANDIL_BSAS,
    tipo: "number",
    label: "Precio base",
    caption: "Tandil → Bs.As.",
    group: "tarifa",
    unit: "ars",
  },
  {
    clave: SETTING_KEYS.COMISION_PLATAFORMA_PCT,
    tipo: "number",
    label: "Comisión",
    caption: "Sobre el viaje (0–15%)",
    group: "tarifa",
    unit: "pct",
  },
  {
    clave: SETTING_KEYS.RESERVA_SENA_MONTO,
    tipo: "number",
    label: "Monto de seña",
    caption: "Al reservar",
    group: "reserva",
    unit: "ars",
  },
  {
    clave: SETTING_KEYS.RESERVA_ESPERA_MAX_MIN,
    tipo: "number",
    label: "Tiempo de espera",
    caption: "En cada recogida",
    group: "reserva",
    unit: "min",
  },
  {
    clave: SETTING_KEYS.RESERVA_DEVOLUCION_24H_PCT,
    tipo: "number",
    label: "Más de 24 h",
    caption: "Cancelación anticipada",
    group: "reserva",
    unit: "pct",
  },
  {
    clave: SETTING_KEYS.RESERVA_DEVOLUCION_12_24H_PCT,
    tipo: "number",
    label: "12–24 h",
    caption: "Cancelación intermedia",
    group: "reserva",
    unit: "pct",
  },
  {
    clave: SETTING_KEYS.RESERVA_DEVOLUCION_MENOS_12H_PCT,
    tipo: "number",
    label: "Menos de 12 h",
    caption: "Sin reembolso típico",
    group: "reserva",
    unit: "pct",
  },
  {
    clave: SETTING_KEYS.PAGOS_TRANSFERENCIA_BANCO,
    tipo: "text",
    label: "Banco",
    group: "pagos",
  },
  {
    clave: SETTING_KEYS.PAGOS_TRANSFERENCIA_ALIAS,
    tipo: "text",
    label: "Alias",
    group: "pagos",
  },
  {
    clave: SETTING_KEYS.PAGOS_TRANSFERENCIA_CBU,
    tipo: "text",
    label: "CBU / CVU",
    group: "pagos",
  },
  {
    clave: SETTING_KEYS.PAGOS_TRANSFERENCIA_TITULAR,
    tipo: "text",
    label: "Titular",
    group: "pagos",
  },
  {
    clave: SETTING_KEYS.FEATURE_RATINGS_HABILITADO,
    tipo: "boolean",
    label: "Ratings",
    caption: "Feature flag",
    group: "flags",
  },
] as const;

const nonNegNumber = z.coerce.number().finite().min(0);
const pct0to100 = z.coerce.number().finite().min(0).max(100);
const pct0to15 = z.coerce.number().finite().min(0).max(15);
const nonEmptyText = z.string().trim().min(1).max(200);
const boolSchema = z.union([
  z.boolean(),
  z.enum(["true", "false", "on", "1", "0"]).transform((v) => v === "true" || v === "on" || v === "1"),
]);

const schemas: Record<EditableSettingKey, z.ZodType<SettingValue>> = {
  [SETTING_KEYS.TARIFA_PRECIO_BASE_TANDIL_BSAS]: nonNegNumber,
  [SETTING_KEYS.COMISION_PLATAFORMA_PCT]: pct0to15,
  [SETTING_KEYS.RESERVA_SENA_MONTO]: nonNegNumber,
  [SETTING_KEYS.RESERVA_ESPERA_MAX_MIN]: nonNegNumber.max(180),
  [SETTING_KEYS.RESERVA_DEVOLUCION_24H_PCT]: pct0to100,
  [SETTING_KEYS.RESERVA_DEVOLUCION_12_24H_PCT]: pct0to100,
  [SETTING_KEYS.RESERVA_DEVOLUCION_MENOS_12H_PCT]: pct0to100,
  [SETTING_KEYS.PAGOS_TRANSFERENCIA_BANCO]: nonEmptyText,
  [SETTING_KEYS.PAGOS_TRANSFERENCIA_ALIAS]: nonEmptyText,
  [SETTING_KEYS.PAGOS_TRANSFERENCIA_CBU]: nonEmptyText,
  [SETTING_KEYS.PAGOS_TRANSFERENCIA_TITULAR]: nonEmptyText,
  [SETTING_KEYS.FEATURE_RATINGS_HABILITADO]: boolSchema,
};

export type SettingUpdateInput = {
  clave: string;
  valor: unknown;
};

export type ValidatedSettingUpdate = {
  clave: EditableSettingKey;
  valor: SettingValue;
};

export function validateSettingUpdate(
  input: SettingUpdateInput,
):
  | { ok: true; value: ValidatedSettingUpdate }
  | { ok: false; error: string } {
  if (!isEditableSettingKey(input.clave)) {
    return { ok: false, error: "Clave no editable." };
  }
  const parsed = schemas[input.clave].safeParse(input.valor);
  if (!parsed.success) {
    return { ok: false, error: fieldErrorMessage(input.clave) };
  }
  return { ok: true, value: { clave: input.clave, valor: parsed.data } };
}

export function validateSettingUpdates(
  inputs: SettingUpdateInput[],
):
  | { ok: true; values: ValidatedSettingUpdate[] }
  | { ok: false; error: string; clave?: string } {
  const values: ValidatedSettingUpdate[] = [];
  for (const input of inputs) {
    const result = validateSettingUpdate(input);
    if (!result.ok) {
      return { ok: false, error: result.error, clave: input.clave };
    }
    values.push(result.value);
  }
  return { ok: true, values };
}

function fieldErrorMessage(clave: EditableSettingKey): string {
  switch (clave) {
    case SETTING_KEYS.COMISION_PLATAFORMA_PCT:
      return "La comisión debe estar entre 0 y 15%.";
    case SETTING_KEYS.RESERVA_DEVOLUCION_24H_PCT:
    case SETTING_KEYS.RESERVA_DEVOLUCION_12_24H_PCT:
    case SETTING_KEYS.RESERVA_DEVOLUCION_MENOS_12H_PCT:
      return "El porcentaje de devolución debe estar entre 0 y 100.";
    case SETTING_KEYS.RESERVA_ESPERA_MAX_MIN:
      return "El tiempo de espera debe ser un número entre 0 y 180 minutos.";
    case SETTING_KEYS.TARIFA_PRECIO_BASE_TANDIL_BSAS:
    case SETTING_KEYS.RESERVA_SENA_MONTO:
      return "Ingresá un monto válido (0 o más).";
    case SETTING_KEYS.FEATURE_RATINGS_HABILITADO:
      return "Valor de flag inválido.";
    default:
      return "Completá el campo con un texto válido.";
  }
}

export function settingValueToFormString(valor: SettingValue, tipo: SettingTipo): string {
  if (tipo === "boolean") {
    return valor === true || valor === "true" ? "true" : "false";
  }
  if (valor == null) return "";
  if (typeof valor === "string") return valor;
  if (typeof valor === "number" || typeof valor === "boolean") return String(valor);
  return JSON.stringify(valor);
}

/**
 * Settings domain types. No framework or Supabase imports.
 */

export type SettingTipo = "number" | "text" | "boolean" | "json";

export type SettingValue = string | number | boolean | unknown;

export type Setting = {
  clave: string;
  valor: SettingValue;
  tipo: SettingTipo;
  descripcion: string | null;
  updatedAt: string;
};

export type SettingsMap = Readonly<Record<string, Setting>>;

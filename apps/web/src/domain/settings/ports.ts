/**
 * Settings port (repository interface). Implemented by adapters only.
 */

import type { Setting, SettingValue } from "./types";
import type { SettingKey } from "./settings";

export type SettingUpdate = {
  clave: string;
  valor: SettingValue;
  updatedBy?: string | null;
};

export interface SettingsRepository {
  findAll(): Promise<Setting[]>;
  findByKey(clave: SettingKey | string): Promise<Setting | null>;
  update(input: SettingUpdate): Promise<Setting>;
  updateMany(inputs: SettingUpdate[]): Promise<Setting[]>;
}

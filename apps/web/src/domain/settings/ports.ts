/**
 * Settings port (repository interface). Implemented by adapters only.
 */

import type { Setting } from "./types";
import type { SettingKey } from "./settings";

export interface SettingsRepository {
  findAll(): Promise<Setting[]>;
  findByKey(clave: SettingKey | string): Promise<Setting | null>;
}

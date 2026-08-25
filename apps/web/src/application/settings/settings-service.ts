/**
 * Settings use cases (AD-5). Orchestrates the repository port only.
 * Caching lives in the composition root (React.cache / unstable_cache).
 */

import type {
  Setting,
  SettingKey,
  SettingsRepository,
  SettingUpdate,
  SettingUpdateInput,
  ValidatedSettingUpdate,
} from "@/domain/settings";
import { validateSettingUpdates } from "@/domain/settings";

export function createSettingsService(repo: SettingsRepository) {
  return {
    async getSettings(): Promise<Setting[]> {
      return repo.findAll();
    },

    async getSetting(clave: SettingKey | string): Promise<Setting | null> {
      return repo.findByKey(clave);
    },

    async getSettingsMap(): Promise<ReadonlyMap<string, Setting>> {
      const all = await repo.findAll();
      return new Map(all.map((item) => [item.clave, item]));
    },

    async updateSetting(
      input: SettingUpdateInput,
      updatedBy?: string | null,
    ): Promise<Setting> {
      const validated = validateSettingUpdates([input]);
      if (!validated.ok) {
        throw new Error(`SETTING_INVALID:${validated.clave ?? ""}:${validated.error}`);
      }
      return repo.update(toRepoUpdate(validated.values[0], updatedBy));
    },

    async updateMany(
      inputs: SettingUpdateInput[],
      updatedBy?: string | null,
    ): Promise<Setting[]> {
      const validated = validateSettingUpdates(inputs);
      if (!validated.ok) {
        throw new Error(`SETTING_INVALID:${validated.clave ?? ""}:${validated.error}`);
      }
      return repo.updateMany(
        validated.values.map((item) => toRepoUpdate(item, updatedBy)),
      );
    },
  };
}

function toRepoUpdate(
  item: ValidatedSettingUpdate,
  updatedBy?: string | null,
): SettingUpdate {
  return {
    clave: item.clave,
    valor: item.valor,
    updatedBy,
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;

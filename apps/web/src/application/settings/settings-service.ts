/**
 * Settings use cases (AD-5). Orchestrates the repository port only.
 * Caching lives in the composition root (React.cache / unstable_cache).
 */

import type { Setting, SettingKey, SettingsRepository } from "@/domain/settings";

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
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;

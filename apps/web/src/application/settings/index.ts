/**
 * Composition root for settings use cases.
 * Wires server Supabase client → adapter → service.
 * React.cache dedupes within a single request (safe with cookie-bound clients).
 */

import { cache } from "react";

import { createSupabaseSettingsRepository } from "@/adapters/supabase/settings-repository";
import { createClient } from "@/lib/supabase/server";

import { createSettingsService } from "./settings-service";

export { createSettingsService } from "./settings-service";
export type { SettingsService } from "./settings-service";

/** Per-request settings service (injects server createClient). */
export const getSettingsService = cache(async () => {
  const supabase = await createClient();
  return createSettingsService(createSupabaseSettingsRepository(supabase));
});

/** Per-request list of settings. */
export const getSettings = cache(async () => {
  const service = await getSettingsService();
  return service.getSettings();
});

/** Per-request single setting. */
export const getSetting = cache(async (clave: string) => {
  const service = await getSettingsService();
  return service.getSetting(clave);
});

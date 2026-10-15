/**
 * Service-role Supabase client (bypasses RLS).
 * Server-only: webhooks, admin jobs. Never import from client components.
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";
import { getSupabaseEnv } from "./env";

export function createServiceClient() {
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

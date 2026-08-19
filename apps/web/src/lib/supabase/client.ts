/**
 * Browser Supabase client.
 * Use only in Client Components ("use client") and browser event handlers.
 * Do not import this from Server Components, Server Actions, or Route Handlers.
 */

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}

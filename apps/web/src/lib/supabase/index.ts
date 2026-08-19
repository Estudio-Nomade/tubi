/**
 * Public barrel for Supabase helpers.
 * Prefer deep imports (./client, ./server, ./middleware) when tree-shaking or
 * avoiding accidental browser/server mix-ups in the same module.
 */

export type { Database, Json, Rol } from "./types";
export { createClient as createBrowserClient } from "./client";
export { createClient as createServerClient } from "./server";
export { updateSession } from "./middleware";
export type { SessionResult } from "./middleware";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Enqueue in-app notification (outbox). Push delivery is Fase 7 worker.
 * Uses security-definer RPC so callers can notify other users under RLS.
 */
export async function enqueueNotification(
  client: SupabaseClient<Database>,
  input: {
    userId: string;
    title: string;
    body: string;
    href?: string;
  },
): Promise<void> {
  const { error } = await client.rpc("enqueue_notification", {
    p_user_id: input.userId,
    p_title: input.title,
    p_body: input.body,
    p_href: input.href ?? null,
  });
  if (error) {
    console.error("enqueueNotification failed", error.message);
  }
}

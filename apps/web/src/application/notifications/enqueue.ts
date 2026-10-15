import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Enqueue in-app notification (outbox). Push delivery is Fase 7 worker.
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
  const { error } = await client.from("notification_outbox").insert({
    user_id: input.userId,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
  });
  if (error) {
    // Non-fatal for callers — log-shaped throw for server logs
    console.error("enqueueNotification failed", error.message);
  }
}

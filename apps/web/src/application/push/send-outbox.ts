/**
 * Drain notification_outbox → Web Push (when VAPID configured).
 * Safe no-op if keys missing or no subscriptions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  isWebPushConfigured,
} from "@/lib/push/vapid";

type OutboxRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  href: string | null;
};

type SubRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushDrainResult = {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
};

export async function drainNotificationOutbox(
  client: SupabaseClient<Database>,
  limit = 50,
): Promise<PushDrainResult> {
  const result: PushDrainResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  const { data: rows, error } = await client
    .from("notification_outbox")
    .select("id, user_id, title, body, href")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !rows?.length) {
    return result;
  }

  const configured = isWebPushConfigured();
  let webpush: typeof import("web-push") | null = null;
  if (configured) {
    try {
      webpush = await import("web-push");
      webpush.setVapidDetails(
        getVapidSubject(),
        getVapidPublicKey()!,
        getVapidPrivateKey()!,
      );
    } catch {
      webpush = null;
    }
  }

  for (const row of rows as OutboxRow[]) {
    result.processed += 1;

    const { data: subs } = await client
      .from("push_subscription")
      .select("endpoint, p256dh, auth")
      .eq("user_id", row.user_id);

    const list = (subs ?? []) as SubRow[];

    if (!webpush || !list.length) {
      // Mark sent so outbox does not stall (in-app still readable)
      await client
        .from("notification_outbox")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", row.id);
      result.skipped += 1;
      continue;
    }

    const payload = JSON.stringify({
      title: row.title,
      body: row.body,
      href: row.href,
    });

    let anyOk = false;
    for (const sub of list) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        anyOk = true;
      } catch (err) {
        result.errors += 1;
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await client
            .from("push_subscription")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    await client
      .from("notification_outbox")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", row.id);

    if (anyOk) result.sent += 1;
    else result.skipped += 1;
  }

  return result;
}

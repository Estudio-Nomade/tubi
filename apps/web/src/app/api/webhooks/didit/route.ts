import { NextResponse } from "next/server";

import { verifyDiditWebhook } from "@/adapters/identity/didit-webhook-signature";
import {
  mapProviderStatus,
  toDriverKycStatus,
} from "@/domain/identity";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Didit webhook (v3 destination).
 * URL: https://www.tubi.autos/api/webhooks/didit
 * Events: status.updated, data.updated
 * Verify X-Signature-V2; freshness from signed body.timestamp; dedupe event_id.
 */
export async function POST(req: Request) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "webhook not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const ok = verifyDiditWebhook(
    body,
    {
      signatureV2: req.headers.get("x-signature-v2"),
      signatureSimple: req.headers.get("x-signature-simple"),
    },
    secret,
  );

  if (!ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = body as {
    webhook_type?: string;
    session_id?: string;
    status?: string;
    vendor_data?: string;
    event_id?: string;
  };

  if (
    event.webhook_type !== "status.updated" &&
    event.webhook_type !== "data.updated"
  ) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const sessionId = event.session_id;
  const rawStatus = event.status ?? "";
  if (!sessionId) {
    return NextResponse.json({ error: "missing session_id" }, { status: 400 });
  }

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "service role not configured" },
      { status: 503 },
    );
  }

  // Idempotency: unique event_id (Didit retries)
  if (event.event_id) {
    const { error: dedupeErr } = await admin
      .from("didit_webhook_events")
      .insert({
        event_id: event.event_id,
        session_id: sessionId,
        status: rawStatus,
      });
    if (dedupeErr) {
      // unique violation → already processed
      if (
        dedupeErr.code === "23505" ||
        dedupeErr.message.toLowerCase().includes("duplicate")
      ) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      // table missing or other: log and continue (better than drop events)
      console.error("didit event_id insert", dedupeErr.message);
    }
  }

  const domainStatus = mapProviderStatus(rawStatus);
  const kycStatus = toDriverKycStatus(domainStatus);

  const { data: sessionRow } = await admin
    .from("driver_kyc_sessions")
    .select("id, user_id")
    .eq("external_session_id", sessionId)
    .maybeSingle();

  let userId = sessionRow?.user_id ?? null;
  if (!userId && event.vendor_data) {
    userId = event.vendor_data;
  }
  if (!userId) {
    return NextResponse.json({ ok: true, unmatched: true });
  }

  await admin.from("driver_kyc_sessions").upsert(
    {
      user_id: userId,
      external_session_id: sessionId,
      provider: "didit",
      status: domainStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "external_session_id" },
  );

  if (kycStatus) {
    const { error: applyErr } = await admin.rpc("apply_driver_kyc_result", {
      p_user_id: userId,
      p_status: kycStatus,
      p_dni_verificado: kycStatus === "verified" ? true : null,
    });
    if (applyErr) {
      console.error("didit apply_driver_kyc_result", applyErr.message);
      return NextResponse.json(
        { error: "apply_kyc_failed", detail: applyErr.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";

import { verifyDiditWebhook } from "@/adapters/identity/didit-webhook-signature";
import { createSupabaseProfilesRepository } from "@/adapters/supabase/profiles-repository";
import {
  mapProviderStatus,
  toDriverKycStatus,
} from "@/domain/identity";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Didit webhook: status.updated → update driver_kyc_sessions + profiles.
 * Configure destination URL to https://<host>/api/webhooks/didit
 * Env: DIDIT_WEBHOOK_SECRET (secret_shared_key from Didit destination)
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
      timestamp: req.headers.get("x-timestamp"),
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

  const domainStatus = mapProviderStatus(rawStatus);
  const kycStatus = toDriverKycStatus(domainStatus);

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "service role not configured" },
      { status: 503 },
    );
  }

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

  await admin
    .from("driver_kyc_sessions")
    .upsert(
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
    const profiles = createSupabaseProfilesRepository(admin);
    await profiles.updateDriverKyc(userId, {
      isDriver: kycStatus === "verified" ? true : undefined,
      driverKycStatus: kycStatus,
      dniVerificado: kycStatus === "verified" ? true : undefined,
    });
  }

  return NextResponse.json({ ok: true });
}

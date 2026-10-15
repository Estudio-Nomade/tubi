"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createIdentityVerifier,
  isDiditConfigured,
} from "@/adapters/identity/create-identity-verifier";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function appOriginFromHeaders(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

function allowManualKyc(): boolean {
  if (process.env.ALLOW_MANUAL_KYC === "true") return true;
  if (process.env.NODE_ENV === "production") return false;
  return !isDiditConfigured();
}

/**
 * Start KYC: create provider session, persist row, redirect to hosted URL.
 */
export async function startDriverKycAction(
  _formData?: FormData,
): Promise<void> {
  const profile = await requireProfile({ allowKycOnboarding: true });
  const h = await headers();
  const origin = appOriginFromHeaders(h);
  const callbackUrl = `${origin}/conductor/kyc/callback`;

  const verifier = createIdentityVerifier({ appOrigin: origin });

  let session;
  try {
    session = await verifier.startSession({
      userId: profile.id,
      callbackUrl,
      metadata: { source: "tubi_conductor_kyc" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo iniciar KYC";
    redirect(`/conductor/kyc?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  // Capability write only via security-definer RPC
  const { error: kycErr } = await supabase.rpc("set_driver_kyc_pending");
  if (kycErr) {
    redirect(
      `/conductor/kyc?error=${encodeURIComponent(kycErr.message)}`,
    );
  }

  const { error: insertErr } = await supabase.from("driver_kyc_sessions").insert({
    user_id: profile.id,
    external_session_id: session.externalSessionId,
    provider: isDiditConfigured() ? "didit" : "manual",
    status: session.status,
  });

  if (insertErr) {
    await supabase
      .from("driver_kyc_sessions")
      .update({
        status: session.status,
        updated_at: new Date().toISOString(),
      })
      .eq("external_session_id", session.externalSessionId);
  }

  revalidatePath("/conductor/kyc");
  redirect(session.url);
}

/**
 * Dev-only: approve KYC without Didit.
 * Blocked in production unless ALLOW_MANUAL_KYC=true.
 */
export async function completeManualKycAction(userId: string): Promise<void> {
  if (!allowManualKyc()) {
    redirect("/conductor/kyc?error=KYC+manual+deshabilitado");
  }

  const profile = await requireProfile({ allowKycOnboarding: true });
  if (profile.id !== userId) {
    redirect("/conductor/kyc?error=No+autorizado");
  }

  let client;
  try {
    client = createServiceClient();
  } catch {
    redirect(
      "/conductor/kyc?error=Service+role+requerido+para+KYC+manual",
    );
  }

  const { error } = await client.rpc("apply_driver_kyc_result", {
    p_user_id: userId,
    p_status: "verified",
    p_dni_verificado: true,
  });
  if (error) {
    redirect(`/conductor/kyc?error=${encodeURIComponent(error.message)}`);
  }

  await client
    .from("driver_kyc_sessions")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "manual");

  revalidatePath("/conductor");
  revalidatePath("/conductor/kyc");
  redirect("/conductor");
}

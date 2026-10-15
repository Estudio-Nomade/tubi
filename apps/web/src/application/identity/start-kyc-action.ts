"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createIdentityVerifier } from "@/adapters/identity/create-identity-verifier";
import { createSupabaseProfilesRepository } from "@/adapters/supabase/profiles-repository";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function appOriginFromHeaders(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

/**
 * Start KYC: create provider session, persist row, redirect to hosted URL.
 * On error redirects back to /conductor/kyc?error=…
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
  const profiles = createSupabaseProfilesRepository(supabase);

  // Mark pending + ensure driver flag aspirational
  await profiles.updateDriverKyc(profile.id, {
    isDriver: true,
    driverKycStatus: "pending_kyc",
  });

  const { error: insertErr } = await supabase.from("driver_kyc_sessions").insert({
    user_id: profile.id,
    external_session_id: session.externalSessionId,
    provider: process.env.DIDIT_API_KEY ? "didit" : "manual",
    status: session.status,
  });

  if (insertErr) {
    // unique conflict: update existing
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
 * Dev-only: approve KYC without Didit (manual verifier complete page).
 */
export async function completeManualKycAction(userId: string): Promise<void> {
  const profile = await requireProfile({ allowKycOnboarding: true });
  if (profile.id !== userId) {
    redirect("/conductor/kyc?error=No+autorizado");
  }

  // Prefer service client if available for webhook-like update
  let client;
  try {
    client = createServiceClient();
  } catch {
    client = await createClient();
  }

  const profiles = createSupabaseProfilesRepository(client);
  await profiles.updateDriverKyc(userId, {
    isDriver: true,
    driverKycStatus: "verified",
    dniVerificado: true,
  });

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

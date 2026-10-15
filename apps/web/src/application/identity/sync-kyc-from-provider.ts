import {
  createIdentityVerifier,
  isDiditConfigured,
} from "@/adapters/identity/create-identity-verifier";
import { toDriverKycStatus } from "@/domain/identity";
import type { DriverKycStatus } from "@/domain/auth";
import { createServiceClient } from "@/lib/supabase/service";

export type SyncKycResult = {
  driverKycStatus: DriverKycStatus | null;
  applied: boolean;
};

/**
 * Pull latest Didit decision for the user's most recent session and apply
 * it to the profile (same path as the webhook). Best-effort: failures are
 * swallowed so the callback page still renders.
 */
export async function syncDriverKycFromProvider(opts: {
  userId: string;
  appOrigin: string;
}): Promise<SyncKycResult> {
  if (!isDiditConfigured()) {
    return { driverKycStatus: null, applied: false };
  }

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return { driverKycStatus: null, applied: false };
  }

  const { data: sessionRow } = await admin
    .from("driver_kyc_sessions")
    .select("external_session_id")
    .eq("user_id", opts.userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const externalSessionId = sessionRow?.external_session_id;
  if (!externalSessionId) {
    return { driverKycStatus: null, applied: false };
  }

  const verifier = createIdentityVerifier({ appOrigin: opts.appOrigin });
  if (!verifier.getDecision) {
    return { driverKycStatus: null, applied: false };
  }

  let decision;
  try {
    decision = await verifier.getDecision(externalSessionId);
  } catch {
    return { driverKycStatus: null, applied: false };
  }

  const kycStatus = toDriverKycStatus(decision.status);
  if (!kycStatus) {
    return { driverKycStatus: null, applied: false };
  }

  await admin.from("driver_kyc_sessions").upsert(
    {
      user_id: opts.userId,
      external_session_id: decision.externalSessionId,
      provider: "didit",
      status: decision.status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "external_session_id" },
  );

  const { error } = await admin.rpc("apply_driver_kyc_result", {
    p_user_id: opts.userId,
    p_status: kycStatus,
    p_dni_verificado: kycStatus === "verified" ? true : null,
  });

  if (error) {
    console.error("syncDriverKycFromProvider apply", error.message);
    return { driverKycStatus: null, applied: false };
  }

  return { driverKycStatus: kycStatus, applied: true };
}

import type { DriverKycStatus } from "@/domain/auth";

import type { VerificationSessionStatus } from "./types";

/** Map Didit/session status strings to domain status. */
export function mapProviderStatus(raw: string): VerificationSessionStatus {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "_");
  switch (s) {
    case "not_started":
    case "notstarted":
      return "not_started";
    case "in_progress":
    case "inprogress":
    case "pending":
      return "in_progress";
    case "approved":
      return "approved";
    case "declined":
    case "rejected":
      return "declined";
    case "in_review":
    case "inreview":
    case "review":
      return "in_review";
    case "expired":
      return "expired";
    default:
      return "unknown";
  }
}

/** Map verification outcome to profiles.driver_kyc_status. */
export function toDriverKycStatus(
  status: VerificationSessionStatus,
): DriverKycStatus | null {
  switch (status) {
    case "approved":
      return "verified";
    case "declined":
      return "rejected";
    case "in_progress":
    case "not_started":
    case "in_review":
      return "pending_kyc";
    case "expired":
      return "unverified";
    default:
      return null;
  }
}

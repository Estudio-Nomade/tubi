import type { DriverKycStatus } from "@/domain/auth";

import type { VerificationSessionStatus } from "./types";

/**
 * Map Didit session status strings to domain status.
 * Prefer exact case-sensitive Didit literals (docs + integration prompt).
 */
export function mapProviderStatus(raw: string): VerificationSessionStatus {
  // Exact Didit API literals (case-sensitive)
  switch (raw) {
    case "Not Started":
      return "not_started";
    case "In Progress":
    case "Awaiting User":
    case "Resubmitted":
      return "in_progress";
    case "In Review":
      return "in_review";
    case "Approved":
      return "approved";
    case "Declined":
      return "declined";
    case "Abandoned":
    case "Expired":
    case "Kyc Expired":
      return "expired";
    default:
      break;
  }

  // Defensive normalize for unexpected variants
  const s = raw.trim().toLowerCase().replace(/\s+/g, "_");
  switch (s) {
    case "not_started":
    case "notstarted":
      return "not_started";
    case "in_progress":
    case "inprogress":
    case "pending":
    case "awaiting_user":
    case "resubmitted":
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
    case "abandoned":
    case "kyc_expired":
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
      // Session expired or Kyc Expired → not verified
      return "unverified";
    default:
      return null;
  }
}

/**
 * Identity verification domain types. No framework imports.
 */

export type VerificationSessionStatus =
  | "not_started"
  | "in_progress"
  | "approved"
  | "declined"
  | "in_review"
  | "expired"
  | "unknown";

export type StartVerificationInput = {
  /** Tubi user id — sent as Didit vendor_data */
  userId: string;
  /** Absolute callback URL after hosted flow */
  callbackUrl: string;
  /** Optional metadata JSON-serializable */
  metadata?: Record<string, string>;
};

export type StartVerificationResult = {
  externalSessionId: string;
  url: string;
  status: VerificationSessionStatus;
};

export type VerificationDecision = {
  externalSessionId: string;
  status: VerificationSessionStatus;
  vendorData: string | null;
  rawStatus: string;
};

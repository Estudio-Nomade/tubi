import type {
  StartVerificationInput,
  StartVerificationResult,
  VerificationDecision,
} from "./types";

/**
 * Port for KYC/identity providers (Didit, manual, etc.).
 * Domain never imports provider SDKs.
 */
export interface IdentityVerifier {
  startSession(input: StartVerificationInput): Promise<StartVerificationResult>;
  /**
   * Optional poll of provider decision (Didit GET /session/:id/decision/).
   * Stub may throw "not supported".
   */
  getDecision?(externalSessionId: string): Promise<VerificationDecision>;
}

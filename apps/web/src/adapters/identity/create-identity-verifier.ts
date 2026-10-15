import type { IdentityVerifier } from "@/domain/identity";

import { createDiditIdentityVerifier } from "./didit-identity-verifier";
import { createManualIdentityVerifier } from "./manual-identity-verifier";

/**
 * Factory: Didit when keys present, else manual stub for local/dev.
 */
export function createIdentityVerifier(opts: {
  appOrigin: string;
}): IdentityVerifier {
  const apiKey = process.env.DIDIT_API_KEY?.trim();
  const workflowId = process.env.DIDIT_WORKFLOW_ID?.trim();

  if (apiKey && workflowId) {
    return createDiditIdentityVerifier({ apiKey, workflowId });
  }

  return createManualIdentityVerifier({ appOrigin: opts.appOrigin });
}

export function isDiditConfigured(): boolean {
  return Boolean(
    process.env.DIDIT_API_KEY?.trim() && process.env.DIDIT_WORKFLOW_ID?.trim(),
  );
}

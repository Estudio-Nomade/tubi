import type {
  IdentityVerifier,
  StartVerificationInput,
  StartVerificationResult,
} from "@/domain/identity";

/**
 * Dev/stub verifier: returns a local URL that completes via tubi action.
 * Used when DIDIT_API_KEY is missing so local UX still works.
 */
export function createManualIdentityVerifier(opts: {
  appOrigin: string;
}): IdentityVerifier {
  return {
    async startSession(
      input: StartVerificationInput,
    ): Promise<StartVerificationResult> {
      const token = `manual_${input.userId}_${Date.now()}`;
      const url = new URL("/conductor/kyc/manual-complete", opts.appOrigin);
      url.searchParams.set("token", token);
      url.searchParams.set("uid", input.userId);
      return {
        externalSessionId: token,
        url: url.toString(),
        status: "in_progress",
      };
    },
  };
}

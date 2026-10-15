import type {
  IdentityVerifier,
  StartVerificationInput,
  StartVerificationResult,
  VerificationDecision,
} from "@/domain/identity";
import { mapProviderStatus } from "@/domain/identity";

const DIDIT_BASE =
  process.env.DIDIT_API_BASE_URL?.replace(/\/$/, "") ??
  "https://verification.didit.me";

export type DiditConfig = {
  apiKey: string;
  workflowId: string;
};

/**
 * Didit v3 session adapter.
 * Docs: POST /v3/session/ with x-api-key, workflow_id, callback, vendor_data.
 * Secrets only from env — never hardcode.
 */
export function createDiditIdentityVerifier(
  config: DiditConfig,
): IdentityVerifier {
  return {
    async startSession(
      input: StartVerificationInput,
    ): Promise<StartVerificationResult> {
      const res = await fetch(`${DIDIT_BASE}/v3/session/`, {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflow_id: config.workflowId,
          callback: input.callbackUrl,
          callback_method: "both",
          vendor_data: input.userId,
          metadata: input.metadata ?? {},
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Didit session create failed: ${res.status} ${text.slice(0, 200)}`,
        );
      }

      const data = (await res.json()) as {
        session_id?: string;
        url?: string;
        status?: string;
      };

      if (!data.session_id || !data.url) {
        throw new Error("Didit session response missing session_id or url");
      }

      return {
        externalSessionId: data.session_id,
        url: data.url,
        status: mapProviderStatus(data.status ?? "In Progress"),
      };
    },

    async getDecision(
      externalSessionId: string,
    ): Promise<VerificationDecision> {
      const res = await fetch(
        `${DIDIT_BASE}/v3/session/${encodeURIComponent(externalSessionId)}/decision/`,
        {
          headers: { "x-api-key": config.apiKey },
        },
      );
      if (!res.ok) {
        throw new Error(`Didit decision failed: ${res.status}`);
      }
      const data = (await res.json()) as {
        session_id?: string;
        status?: string;
        vendor_data?: string;
      };
      const raw = data.status ?? "unknown";
      return {
        externalSessionId: data.session_id ?? externalSessionId,
        status: mapProviderStatus(raw),
        vendorData: data.vendor_data ?? null,
        rawStatus: raw,
      };
    },
  };
}

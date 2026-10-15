import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Didit webhook signature helpers (docs.didit.me integration/webhooks).
 * Prefer X-Signature-V2 + canonical JSON; fallback X-Signature-Simple.
 */

function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [
        k,
        shortenFloats(v),
      ]),
    );
  }
  if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data);
  }
  return data;
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function verifyDiditSignatureV2(
  jsonBody: unknown,
  signatureHeader: string,
  timestampHeader: string,
  secret: string,
): boolean {
  const ts = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

  const canonical = JSON.stringify(sortKeys(shortenFloats(jsonBody)));
  const expected = createHmac("sha256", secret)
    .update(canonical, "utf8")
    .digest("hex");
  return safeEqualHex(expected, signatureHeader);
}

export function verifyDiditSignatureSimple(
  jsonBody: Record<string, unknown>,
  signatureHeader: string,
  timestampHeader: string,
  secret: string,
): boolean {
  const ts = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

  const canonical = [
    jsonBody.timestamp ?? "",
    jsonBody.session_id ?? "",
    jsonBody.status ?? "",
    jsonBody.webhook_type ?? "",
  ].join(":");
  const expected = createHmac("sha256", secret).update(canonical).digest("hex");
  return safeEqualHex(expected, signatureHeader);
}

export function verifyDiditWebhook(
  body: unknown,
  headers: {
    signatureV2: string | null;
    signatureSimple: string | null;
    timestamp: string | null;
  },
  secret: string,
): boolean {
  if (!headers.timestamp || !secret) return false;
  if (
    headers.signatureV2 &&
    verifyDiditSignatureV2(body, headers.signatureV2, headers.timestamp, secret)
  ) {
    return true;
  }
  if (
    headers.signatureSimple &&
    body &&
    typeof body === "object" &&
    verifyDiditSignatureSimple(
      body as Record<string, unknown>,
      headers.signatureSimple,
      headers.timestamp,
      secret,
    )
  ) {
    return true;
  }
  return false;
}

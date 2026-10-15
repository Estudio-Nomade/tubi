import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Didit webhook signature (docs.didit.me + official integration prompt).
 * X-Signature-V2 over canonical JSON; freshness from SIGNED body.timestamp
 * (never the unsigned X-Timestamp header).
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

/** Canonical JSON matching Didit server signing. */
export function diditCanonicalJson(jsonBody: unknown): string {
  return JSON.stringify(sortKeys(shortenFloats(jsonBody)));
}

export function isDiditTimestampFresh(
  bodyTimestamp: unknown,
  nowSec = Math.floor(Date.now() / 1000),
  maxSkewSec = 300,
): boolean {
  const ts = typeof bodyTimestamp === "number"
    ? bodyTimestamp
    : typeof bodyTimestamp === "string"
      ? Number.parseInt(bodyTimestamp, 10)
      : Number.NaN;
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return Math.abs(nowSec - ts) <= maxSkewSec;
}

/**
 * Verify X-Signature-V2. Freshness must use body.timestamp (signed), not headers.
 */
export function verifyDiditSignatureV2(
  jsonBody: unknown,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  if (
    !jsonBody ||
    typeof jsonBody !== "object" ||
    !isDiditTimestampFresh((jsonBody as Record<string, unknown>).timestamp)
  ) {
    return false;
  }

  const canonical = diditCanonicalJson(jsonBody);
  const expected = createHmac("sha256", secret)
    .update(canonical, "utf8")
    .digest("hex");
  return safeEqualHex(expected, signatureHeader);
}

/**
 * Fallback X-Signature-Simple (envelope only — decision not authenticated).
 * Still requires fresh body.timestamp.
 */
export function verifyDiditSignatureSimple(
  jsonBody: Record<string, unknown>,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  if (!isDiditTimestampFresh(jsonBody.timestamp)) return false;

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
  },
  secret: string,
): boolean {
  if (!secret || !body || typeof body !== "object") return false;

  if (
    headers.signatureV2 &&
    verifyDiditSignatureV2(body, headers.signatureV2, secret)
  ) {
    return true;
  }

  if (
    headers.signatureSimple &&
    verifyDiditSignatureSimple(
      body as Record<string, unknown>,
      headers.signatureSimple,
      secret,
    )
  ) {
    return true;
  }

  return false;
}

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import {
  diditCanonicalJson,
  isDiditTimestampFresh,
  verifyDiditSignatureSimple,
  verifyDiditSignatureV2,
  verifyDiditWebhook,
} from "./didit-webhook-signature";

const SECRET = "test-secret";

describe("isDiditTimestampFresh", () => {
  it("accepts body timestamp within 300s", () => {
    const ts = Math.floor(Date.now() / 1000);
    assert.equal(isDiditTimestampFresh(ts), true);
  });

  it("rejects stale body timestamp", () => {
    const ts = Math.floor(Date.now() / 1000) - 400;
    assert.equal(isDiditTimestampFresh(ts), false);
  });
});

describe("verifyDiditSignatureSimple", () => {
  it("accepts valid simple signature using body.timestamp", () => {
    const ts = Math.floor(Date.now() / 1000);
    const body = {
      timestamp: ts,
      session_id: "sess-1",
      status: "Approved",
      webhook_type: "status.updated",
    };
    const canonical = [ts, "sess-1", "Approved", "status.updated"].join(":");
    const sig = createHmac("sha256", SECRET).update(canonical).digest("hex");
    assert.equal(verifyDiditSignatureSimple(body, sig, SECRET), true);
  });

  it("rejects bad signature", () => {
    const ts = Math.floor(Date.now() / 1000);
    assert.equal(
      verifyDiditSignatureSimple(
        {
          timestamp: ts,
          session_id: "x",
          status: "Approved",
          webhook_type: "status.updated",
        },
        "deadbeef",
        SECRET,
      ),
      false,
    );
  });
});

describe("verifyDiditSignatureV2", () => {
  it("accepts canonical body signature with fresh timestamp", () => {
    const ts = Math.floor(Date.now() / 1000);
    const body = { status: "Approved", session_id: "abc", timestamp: ts };
    const canonical = diditCanonicalJson(body);
    const sig = createHmac("sha256", SECRET)
      .update(canonical, "utf8")
      .digest("hex");
    assert.equal(verifyDiditSignatureV2(body, sig, SECRET), true);
  });

  it("rejects valid signature with stale body.timestamp", () => {
    const ts = Math.floor(Date.now() / 1000) - 400;
    const body = { status: "Approved", session_id: "abc", timestamp: ts };
    const canonical = diditCanonicalJson(body);
    const sig = createHmac("sha256", SECRET)
      .update(canonical, "utf8")
      .digest("hex");
    assert.equal(verifyDiditSignatureV2(body, sig, SECRET), false);
  });
});

describe("verifyDiditWebhook", () => {
  it("prefers V2 over Simple", () => {
    const ts = Math.floor(Date.now() / 1000);
    const body = {
      timestamp: ts,
      session_id: "s1",
      status: "Approved",
      webhook_type: "status.updated",
    };
    const sig = createHmac("sha256", SECRET)
      .update(diditCanonicalJson(body), "utf8")
      .digest("hex");
    assert.equal(
      verifyDiditWebhook(body, { signatureV2: sig, signatureSimple: null }, SECRET),
      true,
    );
  });
});

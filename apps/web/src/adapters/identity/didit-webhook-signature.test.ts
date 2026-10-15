import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import {
  verifyDiditSignatureSimple,
  verifyDiditSignatureV2,
} from "./didit-webhook-signature";

const SECRET = "test-secret";

describe("verifyDiditSignatureSimple", () => {
  it("accepts valid simple signature", () => {
    const ts = Math.floor(Date.now() / 1000);
    const body = {
      timestamp: ts,
      session_id: "sess-1",
      status: "Approved",
      webhook_type: "status.updated",
    };
    const canonical = [ts, "sess-1", "Approved", "status.updated"].join(":");
    const sig = createHmac("sha256", SECRET).update(canonical).digest("hex");
    assert.equal(
      verifyDiditSignatureSimple(body, sig, String(ts), SECRET),
      true,
    );
  });

  it("rejects bad signature", () => {
    const ts = Math.floor(Date.now() / 1000);
    assert.equal(
      verifyDiditSignatureSimple(
        { session_id: "x", status: "Approved", webhook_type: "status.updated" },
        "deadbeef",
        String(ts),
        SECRET,
      ),
      false,
    );
  });
});

describe("verifyDiditSignatureV2", () => {
  it("accepts canonical body signature", () => {
    const ts = Math.floor(Date.now() / 1000);
    const body = { status: "Approved", session_id: "abc" };
    // sortKeys: session_id then status
    const canonical = JSON.stringify({ session_id: "abc", status: "Approved" });
    const sig = createHmac("sha256", SECRET)
      .update(canonical, "utf8")
      .digest("hex");
    assert.equal(verifyDiditSignatureV2(body, sig, String(ts), SECRET), true);
  });
});

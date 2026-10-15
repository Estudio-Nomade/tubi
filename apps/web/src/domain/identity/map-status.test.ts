import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapProviderStatus, toDriverKycStatus } from "./map-status";

describe("mapProviderStatus", () => {
  it("maps exact Didit literals case-sensitively", () => {
    assert.equal(mapProviderStatus("Approved"), "approved");
    assert.equal(mapProviderStatus("Declined"), "declined");
    assert.equal(mapProviderStatus("In Review"), "in_review");
    assert.equal(mapProviderStatus("In Progress"), "in_progress");
    assert.equal(mapProviderStatus("Not Started"), "not_started");
    assert.equal(mapProviderStatus("Awaiting User"), "in_progress");
    assert.equal(mapProviderStatus("Resubmitted"), "in_progress");
    assert.equal(mapProviderStatus("Abandoned"), "expired");
    assert.equal(mapProviderStatus("Expired"), "expired");
    assert.equal(mapProviderStatus("Kyc Expired"), "expired");
  });

  it("does not treat lowercase approved as exact literal but still maps via fallback", () => {
    assert.equal(mapProviderStatus("approved"), "approved");
  });
});

describe("toDriverKycStatus", () => {
  it("maps domain to profile kyc", () => {
    assert.equal(toDriverKycStatus("approved"), "verified");
    assert.equal(toDriverKycStatus("declined"), "rejected");
    assert.equal(toDriverKycStatus("in_review"), "pending_kyc");
    assert.equal(toDriverKycStatus("expired"), "unverified");
  });
});

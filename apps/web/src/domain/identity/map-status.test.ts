import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapProviderStatus, toDriverKycStatus } from "./map-status";

describe("mapProviderStatus", () => {
  it("maps Approved", () => {
    assert.equal(mapProviderStatus("Approved"), "approved");
  });
  it("maps Declined", () => {
    assert.equal(mapProviderStatus("Declined"), "declined");
  });
  it("maps In Review", () => {
    assert.equal(mapProviderStatus("In Review"), "in_review");
  });
});

describe("toDriverKycStatus", () => {
  it("approved → verified", () => {
    assert.equal(toDriverKycStatus("approved"), "verified");
  });
  it("declined → rejected", () => {
    assert.equal(toDriverKycStatus("declined"), "rejected");
  });
  it("in_progress → pending_kyc", () => {
    assert.equal(toDriverKycStatus("in_progress"), "pending_kyc");
  });
});

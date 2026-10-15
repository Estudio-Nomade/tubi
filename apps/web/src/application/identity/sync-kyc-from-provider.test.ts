import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toDriverKycStatus } from "@/domain/identity";

/**
 * Unit coverage for the mapping path used by sync + webhook.
 * Full sync needs Supabase/Didit and is covered by integration when available.
 */
describe("sync KYC decision mapping", () => {
  it("Approved from Didit becomes verified without manual step", () => {
    assert.equal(toDriverKycStatus("approved"), "verified");
  });

  it("Declined becomes rejected", () => {
    assert.equal(toDriverKycStatus("declined"), "rejected");
  });

  it("in-flight Didit states stay pending_kyc until Approved", () => {
    assert.equal(toDriverKycStatus("in_progress"), "pending_kyc");
    assert.equal(toDriverKycStatus("in_review"), "pending_kyc");
    assert.equal(toDriverKycStatus("not_started"), "pending_kyc");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computePeerWaterfall } from "./commission-waterfall";

describe("computePeerWaterfall", () => {
  it("S < C → driver pays difference", () => {
    // P=10000, s=20% → S=2000, c=15% → C=1500 → settlement = 1500-2000 = -500 (credit)
    const r = computePeerWaterfall({
      price: 10_000,
      depositPct: 0.2,
      commissionPct: 0.15,
    });
    assert.equal(r.seña, 2000);
    assert.equal(r.commission, 1500);
    assert.equal(r.driverNet, 8500);
    assert.equal(r.settlementDriverToTubi, -500);
  });

  it("S > C still credits driver", () => {
    const r = computePeerWaterfall({
      price: 10_000,
      depositPct: 0.3,
      commissionPct: 0.15,
    });
    assert.equal(r.seña, 3000);
    assert.equal(r.commission, 1500);
    assert.equal(r.settlementDriverToTubi, -1500);
  });

  it("high commission may require driver transfer", () => {
    const r = computePeerWaterfall({
      price: 10_000,
      depositPct: 0.1,
      commissionPct: 0.15,
    });
    assert.equal(r.seña, 1000);
    assert.equal(r.commission, 1500);
    assert.equal(r.settlementDriverToTubi, 500);
  });
});

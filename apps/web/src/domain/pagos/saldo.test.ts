import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeSaldo } from "./saldo";

describe("computeSaldo", () => {
  it("precio - sena without discount", () => {
    assert.equal(computeSaldo(25000, 5000), 20000);
  });

  it("subtracts descuento and floors at 0", () => {
    assert.equal(computeSaldo(25000, 5000, 5000), 15000);
    assert.equal(computeSaldo(25000, 5000, 30000), 0);
  });

  it("treats missing descuento as 0", () => {
    assert.equal(computeSaldo(25000, 5000, undefined), 20000);
  });
});

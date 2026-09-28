import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeCuponCodigo } from "./code";

describe("normalizeCuponCodigo", () => {
  it("trims, uppercases and strips inner whitespace", () => {
    assert.equal(normalizeCuponCodigo(" tubi1 "), "TUBI1");
    assert.equal(normalizeCuponCodigo("tu bi 1"), "TUBI1");
  });
});

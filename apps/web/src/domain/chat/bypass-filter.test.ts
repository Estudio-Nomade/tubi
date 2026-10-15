import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { flagsBypassAttempt } from "./bypass-filter";

describe("flagsBypassAttempt", () => {
  it("flags whatsapp mention", () => {
    assert.equal(flagsBypassAttempt("mandame al whatsapp"), true);
  });
  it("flags phone-like sequence", () => {
    assert.equal(flagsBypassAttempt("llame al 11 2345 6789"), true);
  });
  it("allows normal logistics", () => {
    assert.equal(
      flagsBypassAttempt("Te espero en la esquina de la plaza a las 8"),
      false,
    );
  });
});

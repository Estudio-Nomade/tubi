import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cuponErrorUserMessage, mapCuponErrorMessage } from "./errors";

describe("cuponErrorUserMessage", () => {
  it("CUPON_SIN_CUPOS mentions agotaron", () => {
    assert.match(cuponErrorUserMessage("CUPON_SIN_CUPOS"), /agotaron/i);
  });
});

describe("mapCuponErrorMessage", () => {
  it("maps known codes from messages", () => {
    assert.equal(mapCuponErrorMessage("CUPON_NO_ENCONTRADO"), "CUPON_NO_ENCONTRADO");
  });

  it("defaults unknown to CUPON_NO_DISPONIBLE", () => {
    assert.equal(mapCuponErrorMessage("something else"), "CUPON_NO_DISPONIBLE");
  });
});

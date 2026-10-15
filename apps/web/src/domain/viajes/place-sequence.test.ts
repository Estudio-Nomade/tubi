import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { matchesPlaceSequence } from "./place-sequence";

const tandilBsas = [
  { ciudad: "Tandil", orden: 1 },
  { ciudad: "Azul", orden: 2 },
  { ciudad: "Buenos Aires", orden: 3 },
];

describe("matchesPlaceSequence", () => {
  it("matches full corridor", () => {
    assert.equal(matchesPlaceSequence(tandilBsas, "Tandil", "Buenos Aires"), true);
  });

  it("matches intermediate leg", () => {
    assert.equal(matchesPlaceSequence(tandilBsas, "Tandil", "Azul"), true);
    assert.equal(matchesPlaceSequence(tandilBsas, "Azul", "Buenos Aires"), true);
  });

  it("rejects reverse order", () => {
    assert.equal(matchesPlaceSequence(tandilBsas, "Buenos Aires", "Tandil"), false);
    assert.equal(matchesPlaceSequence(tandilBsas, "Azul", "Tandil"), false);
  });

  it("rejects same city", () => {
    assert.equal(matchesPlaceSequence(tandilBsas, "Tandil", "Tandil"), false);
  });

  it("is case-insensitive and trims", () => {
    assert.equal(
      matchesPlaceSequence(tandilBsas, "  tandil ", "BUENOS AIRES"),
      true,
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONDUCTOR_VEHICULO_ONBOARDING_PATH,
  conductorLandingPath,
} from "./landing-path";

describe("conductorLandingPath", () => {
  it("sin vehículo → onboarding", () => {
    assert.equal(conductorLandingPath(false), CONDUCTOR_VEHICULO_ONBOARDING_PATH);
  });

  it("con vehículo → home", () => {
    assert.equal(conductorLandingPath(true), "/conductor");
  });
});

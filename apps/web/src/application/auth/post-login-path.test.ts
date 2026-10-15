import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CONDUCTOR_VEHICULO_ONBOARDING_PATH } from "@/application/conductor/landing-path";
import { legacyRolFromCapabilities } from "@/domain/auth";
import type { Profile } from "@/domain/auth";

import {
  parseUiModeCookie,
  resolvePostLoginPath,
  UI_MODE_COOKIE,
} from "./post-login-path";

function profile(overrides: Partial<Profile> = {}): Profile {
  const isPassenger = overrides.isPassenger ?? true;
  const isDriver = overrides.isDriver ?? false;
  const isOperator = overrides.isOperator ?? false;
  const driverKycStatus = overrides.driverKycStatus ?? "unverified";
  return {
    id: overrides.id ?? "u1",
    nombre: overrides.nombre ?? "Ada",
    apellido: overrides.apellido ?? "Lovelace",
    telefono: overrides.telefono ?? "1100000000",
    dni: overrides.dni ?? "30111222",
    dniVerificado: overrides.dniVerificado ?? false,
    isPassenger,
    isDriver,
    isOperator,
    driverKycStatus,
    rol: legacyRolFromCapabilities({ isPassenger, isDriver, isOperator }),
  };
}

describe("UI_MODE_COOKIE", () => {
  it("is tubi_ui_mode", () => {
    assert.equal(UI_MODE_COOKIE, "tubi_ui_mode");
  });
});

describe("parseUiModeCookie", () => {
  it("defaults to travel when missing", () => {
    assert.equal(parseUiModeCookie(undefined), "travel");
    assert.equal(parseUiModeCookie(null), "travel");
    assert.equal(parseUiModeCookie(""), "travel");
  });

  it("accepts drive", () => {
    assert.equal(parseUiModeCookie("drive"), "drive");
  });

  it("accepts travel", () => {
    assert.equal(parseUiModeCookie("travel"), "travel");
  });

  it("falls back to travel on unknown values", () => {
    assert.equal(parseUiModeCookie("admin"), "travel");
    assert.equal(parseUiModeCookie("DRIVE"), "travel");
  });
});

describe("resolvePostLoginPath", () => {
  it("sends passenger to /pasajero in travel mode", () => {
    assert.equal(
      resolvePostLoginPath(profile({ isPassenger: true }), "travel"),
      "/pasajero",
    );
  });

  it("sends verified driver in drive mode to /conductor when has vehicle", () => {
    const p = profile({
      isPassenger: true,
      isDriver: true,
      driverKycStatus: "verified",
    });
    assert.equal(resolvePostLoginPath(p, "drive", { hasVehiculo: true }), "/conductor");
  });

  it("sends verified driver in drive mode to vehicle onboarding without vehicle", () => {
    const p = profile({
      isPassenger: true,
      isDriver: true,
      driverKycStatus: "verified",
    });
    assert.equal(
      resolvePostLoginPath(p, "drive", { hasVehiculo: false }),
      CONDUCTOR_VEHICULO_ONBOARDING_PATH,
    );
  });

  it("keeps unverified driver on passenger home even in drive mode", () => {
    const p = profile({
      isPassenger: true,
      isDriver: true,
      driverKycStatus: "unverified",
    });
    assert.equal(resolvePostLoginPath(p, "drive"), "/pasajero");
  });

  it("sends operator staff-only to /operador", () => {
    const p = profile({
      isPassenger: false,
      isDriver: false,
      isOperator: true,
    });
    assert.equal(resolvePostLoginPath(p, "travel"), "/operador");
  });

  it("defaults verified driver in travel mode to /pasajero", () => {
    const p = profile({
      isPassenger: true,
      isDriver: true,
      driverKycStatus: "verified",
    });
    assert.equal(resolvePostLoginPath(p, "travel"), "/pasajero");
  });
});

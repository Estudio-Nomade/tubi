import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertDriverKycStatus,
  canDrive,
  canOperate,
  canTravel,
  driverKycStatusLabel,
  legacyRolFromCapabilities,
  primaryHomePath,
} from "./capabilities";
import type { Profile } from "./types";

function base(overrides: Partial<Profile> = {}): Profile {
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

describe("canTravel", () => {
  it("is true when isPassenger", () => {
    assert.equal(canTravel(base({ isPassenger: true })), true);
  });

  it("is false when not passenger", () => {
    assert.equal(canTravel(base({ isPassenger: false })), false);
  });
});

describe("canDrive", () => {
  it("requires isDriver and verified KYC", () => {
    assert.equal(
      canDrive(base({ isDriver: true, driverKycStatus: "verified" })),
      true,
    );
  });

  it("blocks driver with unverified KYC", () => {
    assert.equal(
      canDrive(base({ isDriver: true, driverKycStatus: "unverified" })),
      false,
    );
  });

  it("blocks driver with pending_kyc", () => {
    assert.equal(
      canDrive(base({ isDriver: true, driverKycStatus: "pending_kyc" })),
      false,
    );
  });

  it("blocks non-driver even if verified", () => {
    assert.equal(
      canDrive(base({ isDriver: false, driverKycStatus: "verified" })),
      false,
    );
  });
});

describe("canOperate", () => {
  it("is true when isOperator", () => {
    assert.equal(canOperate(base({ isOperator: true })), true);
  });

  it("is false when not operator", () => {
    assert.equal(canOperate(base({ isOperator: false })), false);
  });
});

describe("legacyRolFromCapabilities", () => {
  it("prefers operator over driver and passenger", () => {
    assert.equal(
      legacyRolFromCapabilities({
        isPassenger: true,
        isDriver: true,
        isOperator: true,
      }),
      "operador",
    );
  });

  it("prefers driver over passenger", () => {
    assert.equal(
      legacyRolFromCapabilities({
        isPassenger: true,
        isDriver: true,
        isOperator: false,
      }),
      "conductor",
    );
  });

  it("falls back to pasajero", () => {
    assert.equal(
      legacyRolFromCapabilities({
        isPassenger: true,
        isDriver: false,
        isOperator: false,
      }),
      "pasajero",
    );
  });

  it("returns pasajero when no capabilities", () => {
    assert.equal(
      legacyRolFromCapabilities({
        isPassenger: false,
        isDriver: false,
        isOperator: false,
      }),
      "pasajero",
    );
  });
});

describe("primaryHomePath", () => {
  it("returns /conductor when mode is drive and canDrive", () => {
    const p = base({ isDriver: true, driverKycStatus: "verified" });
    assert.equal(primaryHomePath(p, "drive"), "/conductor");
  });

  it("falls back from drive mode when KYC not verified", () => {
    const p = base({
      isPassenger: true,
      isDriver: true,
      driverKycStatus: "pending_kyc",
    });
    assert.equal(primaryHomePath(p, "drive"), "/pasajero");
  });

  it("returns /pasajero when canTravel in travel mode", () => {
    assert.equal(primaryHomePath(base({ isPassenger: true }), "travel"), "/pasajero");
  });

  it("returns /operador for operator staff-only", () => {
    const p = base({
      isPassenger: false,
      isDriver: false,
      isOperator: true,
    });
    assert.equal(primaryHomePath(p, "travel"), "/operador");
  });

  it("defaults to /pasajero when no capabilities", () => {
    const p = base({
      isPassenger: false,
      isDriver: false,
      isOperator: false,
    });
    assert.equal(primaryHomePath(p, "travel"), "/pasajero");
  });
});

describe("assertDriverKycStatus", () => {
  it("accepts known statuses", () => {
    for (const s of [
      "unverified",
      "pending_kyc",
      "verified",
      "rejected",
      "suspended",
    ] as const) {
      assert.equal(assertDriverKycStatus(s), s);
    }
  });

  it("throws on unknown status", () => {
    assert.throws(() => assertDriverKycStatus("nope"), /driverKycStatus/i);
  });
});

describe("driverKycStatusLabel", () => {
  it("returns Spanish labels, never raw enum keys", () => {
    assert.equal(driverKycStatusLabel("unverified"), "Sin verificar");
    assert.equal(driverKycStatusLabel("pending_kyc"), "En revisión");
    assert.equal(driverKycStatusLabel("verified"), "Verificado");
    assert.equal(driverKycStatusLabel("rejected"), "Rechazado");
    assert.equal(driverKycStatusLabel("suspended"), "Suspendido");
  });
});

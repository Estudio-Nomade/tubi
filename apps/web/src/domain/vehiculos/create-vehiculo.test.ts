import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createVehiculoErrorUserMessage,
  mapCreateVehiculoErrorMessage,
  parseCrearVehiculoForm,
  parseCrearVehiculoPropioForm,
} from "./create-vehiculo";

const COND = "ae9f204f-ab02-41cc-949e-d4949a78ce0d";

describe("mapCreateVehiculoErrorMessage", () => {
  it("maps known RPC codes", () => {
    assert.equal(
      mapCreateVehiculoErrorMessage("PATENTE_DUPLICADA"),
      "PATENTE_DUPLICADA",
    );
    assert.equal(
      mapCreateVehiculoErrorMessage("PATENTE_INVALIDA"),
      "PATENTE_INVALIDA",
    );
    assert.equal(
      mapCreateVehiculoErrorMessage("CAPACIDAD_INVALIDA"),
      "CAPACIDAD_INVALIDA",
    );
    assert.equal(
      mapCreateVehiculoErrorMessage("DATOS_INVALIDOS"),
      "DATOS_INVALIDOS",
    );
    assert.equal(
      mapCreateVehiculoErrorMessage("CONDUCTOR_INVALIDO"),
      "CONDUCTOR_INVALIDO",
    );
    assert.equal(mapCreateVehiculoErrorMessage("NO_AUTORIZADO"), "NO_AUTORIZADO");
    assert.equal(
      mapCreateVehiculoErrorMessage("NO_AUTENTICADO"),
      "NO_AUTENTICADO",
    );
  });

  it("falls back to UNKNOWN", () => {
    assert.equal(mapCreateVehiculoErrorMessage("boom"), "UNKNOWN");
  });
});

describe("createVehiculoErrorUserMessage", () => {
  it("returns clear ES copy", () => {
    assert.match(createVehiculoErrorUserMessage("PATENTE_DUPLICADA"), /patente/i);
    assert.match(createVehiculoErrorUserMessage("CAPACIDAD_INVALIDA"), /mayor a 0/i);
    assert.match(createVehiculoErrorUserMessage("CONDUCTOR_INVALIDO"), /conductor/i);
    assert.match(createVehiculoErrorUserMessage("NO_AUTENTICADO"), /sesión/i);
  });
});

describe("parseCrearVehiculoForm", () => {
  it("happy path", () => {
    const res = parseCrearVehiculoForm({
      conductorId: COND,
      patente: " AB 123 CD ",
      marca: "Toyota",
      modelo: "Corolla",
      color: "Blanco",
      capacidad: "4",
    });
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.capacidad, 4);
      assert.equal(res.patente, "AB 123 CD");
    }
  });

  it("rejects capacidad 0", () => {
    const res = parseCrearVehiculoForm({
      conductorId: COND,
      patente: "AB123CD",
      marca: "Toyota",
      modelo: "Corolla",
      color: "Blanco",
      capacidad: "0",
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.ok(res.fieldErrors?.capacidad);
  });

  it("rejects empty required fields", () => {
    const res = parseCrearVehiculoForm({
      conductorId: "",
      patente: "",
      marca: "",
      modelo: "",
      color: "",
      capacidad: "",
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.ok(res.fieldErrors?.conductorId);
      assert.ok(res.fieldErrors?.patente);
      assert.ok(res.fieldErrors?.marca);
      assert.ok(res.fieldErrors?.capacidad);
    }
  });
});

describe("parseCrearVehiculoPropioForm", () => {
  it("happy path without conductorId", () => {
    const res = parseCrearVehiculoPropioForm({
      patente: "AB 123 CD",
      marca: "Toyota",
      modelo: "Corolla",
      color: "Blanco",
      capacidad: "4",
    });
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.capacidad, 4);
  });

  it("rejects capacidad 0", () => {
    const res = parseCrearVehiculoPropioForm({
      patente: "AB123CD",
      marca: "Toyota",
      modelo: "Corolla",
      color: "Blanco",
      capacidad: "0",
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.ok(res.fieldErrors?.capacidad);
  });

  it("rejects empty fields", () => {
    const res = parseCrearVehiculoPropioForm({
      patente: "",
      marca: "",
      modelo: "",
      color: "",
      capacidad: "",
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.ok(res.fieldErrors?.patente);
      assert.ok(res.fieldErrors?.marca);
    }
  });
});

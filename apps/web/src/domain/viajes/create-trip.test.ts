import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createTripErrorUserMessage,
  fechaHoraLocalToIso,
  mapCreateTripErrorMessage,
  parseCrearViajeForm,
} from "./create-trip";

const RUTA = "bbbbbbbb-bbbb-cccc-dddd-000000000001";
const COND = "aaaaaaaa-bbbb-cccc-dddd-000000000001";
const VEH = "dddddddd-bbbb-cccc-dddd-000000000001";

describe("mapCreateTripErrorMessage", () => {
  it("maps vehicle mismatch before generic vehicle invalid", () => {
    assert.equal(
      mapCreateTripErrorMessage("VEHICULO_NO_DEL_CONDUCTOR"),
      "VEHICULO_NO_DEL_CONDUCTOR",
    );
  });

  it("maps known RPC codes", () => {
    assert.equal(mapCreateTripErrorMessage("FECHA_INVALIDA"), "FECHA_INVALIDA");
    assert.equal(mapCreateTripErrorMessage("PRECIO_INVALIDO"), "PRECIO_INVALIDO");
    assert.equal(mapCreateTripErrorMessage("NO_AUTORIZADO"), "NO_AUTORIZADO");
    assert.equal(mapCreateTripErrorMessage("NO_AUTENTICADO"), "NO_AUTENTICADO");
    assert.equal(mapCreateTripErrorMessage("RUTA_NO_ENCONTRADA"), "RUTA_NO_ENCONTRADA");
  });
});

describe("createTripErrorUserMessage", () => {
  it("returns clear ES copy for mismatch and precio", () => {
    assert.match(
      createTripErrorUserMessage("VEHICULO_NO_DEL_CONDUCTOR"),
      /vehículo/i,
    );
    assert.match(createTripErrorUserMessage("PRECIO_INVALIDO"), /precio|tarifa/i);
    assert.match(createTripErrorUserMessage("NO_AUTENTICADO"), /sesión/i);
  });
});

describe("fechaHoraLocalToIso", () => {
  it("builds ISO for local calendar fecha+hora", () => {
    const iso = fechaHoraLocalToIso("2030-06-15", "10:00");
    assert.ok(iso);
    const d = new Date(iso!);
    assert.equal(d.getFullYear(), 2030);
    assert.equal(d.getMonth(), 5);
    assert.equal(d.getDate(), 15);
    assert.equal(d.getHours(), 10);
    assert.equal(d.getMinutes(), 0);
  });

  it("accepts HH:mm:ss from browsers", () => {
    const iso = fechaHoraLocalToIso("2030-06-15", "10:30:00");
    assert.ok(iso);
    const d = new Date(iso!);
    assert.equal(d.getHours(), 10);
    assert.equal(d.getMinutes(), 30);
  });

  it("rejects bad shapes and rolled calendar dates", () => {
    assert.equal(fechaHoraLocalToIso("15-06-2030", "10:00"), null);
    assert.equal(fechaHoraLocalToIso("2030-06-15", "10"), null);
    assert.equal(fechaHoraLocalToIso("2030-02-31", "10:00"), null);
  });
});

describe("parseCrearViajeForm", () => {
  it("happy path with explicit precio", () => {
    const res = parseCrearViajeForm({
      rutaId: RUTA,
      conductorId: COND,
      vehiculoId: VEH,
      fecha: "2030-06-15",
      hora: "10:00",
      precio: "25000",
    });
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.precio, 25000);
      assert.ok(res.fechaSalidaIso.includes("2030"));
    }
  });

  it("allows empty precio (RPC uses setting)", () => {
    const res = parseCrearViajeForm({
      rutaId: RUTA,
      conductorId: COND,
      vehiculoId: VEH,
      fecha: "2030-06-15",
      hora: "10:00",
      precio: "",
    });
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.precio, null);
  });

  it("rejects precio <= 0", () => {
    const res = parseCrearViajeForm({
      rutaId: RUTA,
      conductorId: COND,
      vehiculoId: VEH,
      fecha: "2030-06-15",
      hora: "10:00",
      precio: "0",
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.ok(res.fieldErrors?.precio);
  });

  it("requires ruta conductor vehiculo fecha hora", () => {
    const res = parseCrearViajeForm({
      rutaId: "",
      conductorId: "",
      vehiculoId: "",
      fecha: "",
      hora: "",
      precio: "",
    });
    assert.equal(res.ok, false);
  });
});

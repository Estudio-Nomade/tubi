import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rolForPath } from "./rol-for-path";

describe("rolForPath", () => {
  it("mapea /operador a operador", () => {
    assert.equal(rolForPath("/operador"), "operador");
  });

  it("mapea subrutas de operador", () => {
    assert.equal(rolForPath("/operador/viajes/123"), "operador");
  });

  it("mapea /conductor a conductor", () => {
    assert.equal(rolForPath("/conductor"), "conductor");
    assert.equal(rolForPath("/conductor/vehiculo"), "conductor");
  });

  it("mapea /pasajero a pasajero", () => {
    assert.equal(rolForPath("/pasajero"), "pasajero");
    assert.equal(rolForPath("/pasajero/reservas"), "pasajero");
  });

  it("no confunde prefijos parciales", () => {
    assert.equal(rolForPath("/operadorx"), null);
    assert.equal(rolForPath("/conductorx"), null);
    assert.equal(rolForPath("/pasajerox"), null);
  });

  it("devuelve null para rutas sin rol", () => {
    assert.equal(rolForPath("/login"), null);
    assert.equal(rolForPath("/registro"), null);
    assert.equal(rolForPath("/cuenta"), null);
    assert.equal(rolForPath("/"), null);
  });
});

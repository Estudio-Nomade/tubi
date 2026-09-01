import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapParadasErrorMessage,
  moveParada,
  parseParadaForm,
} from "./paradas";

describe("mapParadasErrorMessage", () => {
  it("maps known RPC codes", () => {
    assert.equal(mapParadasErrorMessage("PARADA_NO_ELIMINABLE"), "PARADA_NO_ELIMINABLE");
    assert.equal(mapParadasErrorMessage("ORDEN_INVALIDO"), "ORDEN_INVALIDO");
    assert.equal(mapParadasErrorMessage("COORDS_INVALIDAS"), "COORDS_INVALIDAS");
    assert.equal(mapParadasErrorMessage("raro"), "UNKNOWN");
  });
});

describe("parseParadaForm", () => {
  it("acepta coordenadas válidas con coma decimal", () => {
    const res = parseParadaForm({
      nombre: "Centro",
      ciudad: "Rauch",
      lat: "-36,7745",
      lng: "-59,0833",
    });
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.lat, -36.7745);
      assert.equal(res.lng, -59.0833);
    }
  });

  it("rechaza nombre/ciudad vacíos y coords fuera de rango", () => {
    const res = parseParadaForm({
      nombre: "",
      ciudad: "",
      lat: "91",
      lng: "200",
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.ok(res.fieldErrors?.nombre);
      assert.ok(res.fieldErrors?.ciudad);
      assert.ok(res.fieldErrors?.lat);
      assert.ok(res.fieldErrors?.lng);
    }
  });
});

describe("moveParada", () => {
  it("mueve un elemento hacia arriba sin mutar el original", () => {
    const list = ["a", "b", "c"];
    const moved = moveParada(list, 2, -1);
    assert.deepEqual(moved, ["a", "c", "b"]);
    assert.deepEqual(list, ["a", "b", "c"]);
  });

  it("no se mueve fuera de rango", () => {
    assert.deepEqual(moveParada(["a", "b"], 0, -1), ["a", "b"]);
    assert.deepEqual(moveParada(["a", "b"], 1, 1), ["a", "b"]);
  });
});

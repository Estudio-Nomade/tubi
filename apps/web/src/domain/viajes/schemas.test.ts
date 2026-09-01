import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { searchViajesSchema } from "./schemas";

describe("searchViajesSchema", () => {
  it("acepta origen y destino sin fecha", () => {
    const res = searchViajesSchema.safeParse({
      origen: "Tandil",
      destino: "Buenos Aires",
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.fecha, undefined);
    }
  });

  it("acepta fecha válida opcional", () => {
    const res = searchViajesSchema.safeParse({
      origen: "Tandil",
      destino: "Buenos Aires",
      fecha: "2026-09-02",
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.fecha, "2026-09-02");
    }
  });

  it("acepta fecha vacía", () => {
    const res = searchViajesSchema.safeParse({
      origen: "Tandil",
      destino: "Buenos Aires",
      fecha: "",
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.fecha, "");
    }
  });

  it("rechaza fecha con formato inválido", () => {
    const res = searchViajesSchema.safeParse({
      origen: "Tandil",
      destino: "Buenos Aires",
      fecha: "02-09-2026",
    });
    assert.equal(res.success, false);
  });

  it("rechaza origen vacío", () => {
    const res = searchViajesSchema.safeParse({
      origen: "",
      destino: "Buenos Aires",
    });
    assert.equal(res.success, false);
  });

  it("trimea origen y destino", () => {
    const res = searchViajesSchema.safeParse({
      origen: " Tandil ",
      destino: " Buenos Aires ",
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.origen, "Tandil");
      assert.equal(res.data.destino, "Buenos Aires");
    }
  });
});

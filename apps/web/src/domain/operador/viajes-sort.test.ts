import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sortViajesActivos } from "./viajes-sort";
import type { ViajeOperadorRow } from "./viajes-types";

function row(
  partial: Partial<ViajeOperadorRow> & { id: string },
): ViajeOperadorRow {
  return {
    origen: "Tandil",
    destino: "Buenos Aires",
    fechaSalida: "2026-09-02T10:00:00+00:00",
    estado: "programado",
    precio: 25000,
    conductorNombre: "Juan Perez",
    patente: "ABC123",
    ocupacion: 0,
    capacidad: 4,
    ...partial,
  };
}

describe("sortViajesActivos", () => {
  it("orders en_curso before recogida before programado regardless of fecha", () => {
    const rows = [
      row({
        id: "p",
        estado: "programado",
        fechaSalida: "2026-09-01T10:00:00+00:00",
      }),
      row({
        id: "r",
        estado: "recogida",
        fechaSalida: "2026-12-01T10:00:00+00:00",
      }),
      row({
        id: "e",
        estado: "en_curso",
        fechaSalida: "2026-12-31T10:00:00+00:00",
      }),
    ];
    assert.deepEqual(
      sortViajesActivos(rows).map((r) => r.id),
      ["e", "r", "p"],
    );
  });

  it("sorts same estado by fechaSalida ASC", () => {
    const rows = [
      row({
        id: "later",
        estado: "programado",
        fechaSalida: "2026-09-03T10:00:00+00:00",
      }),
      row({
        id: "sooner",
        estado: "programado",
        fechaSalida: "2026-09-01T10:00:00+00:00",
      }),
    ];
    assert.deepEqual(
      sortViajesActivos(rows).map((r) => r.id),
      ["sooner", "later"],
    );
  });

  it("breaks ties by id", () => {
    const rows = [
      row({
        id: "b",
        estado: "programado",
        fechaSalida: "2026-09-01T10:00:00+00:00",
      }),
      row({
        id: "a",
        estado: "programado",
        fechaSalida: "2026-09-01T10:00:00+00:00",
      }),
    ];
    assert.deepEqual(
      sortViajesActivos(rows).map((r) => r.id),
      ["a", "b"],
    );
  });

  it("does not mutate the input", () => {
    const rows = [
      row({ id: "b", estado: "programado" }),
      row({ id: "a", estado: "en_curso" }),
    ];
    const snapshot = rows.map((r) => r.id);
    sortViajesActivos(rows);
    assert.deepEqual(
      rows.map((r) => r.id),
      snapshot,
    );
  });
});

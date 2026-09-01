import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { addDaysLocal, formatFechaTituloAr, toIsoDateLocal } from "@/lib/format";

import { groupViajesByFechaLocal } from "./group-by-day";
import type { ViajeListItem } from "./types";

function item(id: string, fechaSalida: string): ViajeListItem {
  return {
    id,
    origen: "Tandil",
    destino: "Buenos Aires",
    fechaSalida,
    precio: 25000,
    estado: "programado",
    asientosLibres: 2,
    vehiculo: {
      patente: "ABC123",
      marca: "Ford",
      modelo: "Transit",
      color: "Blanco",
    },
  };
}

function isoOn(date: Date, hour: number): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    0,
  ).toISOString();
}

describe("groupViajesByFechaLocal", () => {
  it("agrupa varios viajes del mismo día y ordena por fecha", () => {
    const today = new Date();
    const mañana = isoOn(addDaysLocal(today, 1), 8);
    const hoyTemprano = isoOn(today, 10);
    const hoyTarde = isoOn(today, 15);

    const grupos = groupViajesByFechaLocal([
      item("a", mañana),
      item("b", hoyTemprano),
      item("c", hoyTarde),
    ]);

    assert.equal(grupos.length, 2);
    assert.equal(grupos[0].label, "Hoy");
    assert.equal(grupos[0].items.length, 2);
    assert.equal(grupos[1].label, "Mañana");
    assert.equal(grupos[1].items.length, 1);
  });

  it("etiqueta Hoy y Mañana correctamente", () => {
    const today = new Date();
    const keyHoy = toIsoDateLocal(today);
    const keyMañana = toIsoDateLocal(addDaysLocal(today, 1));

    const grupos = groupViajesByFechaLocal([
      item("a", isoOn(today, 10)),
      item("b", isoOn(addDaysLocal(today, 1), 10)),
    ]);

    assert.deepEqual(
      grupos.map((g) => g.fechaKey),
      [keyHoy, keyMañana],
    );
    assert.equal(grupos[0].label, "Hoy");
    assert.equal(grupos[1].label, "Mañana");
  });

  it("usa formatFechaTituloAr para días que no son hoy ni mañana", () => {
    const future = addDaysLocal(new Date(), 5);
    const key = toIsoDateLocal(future);

    const grupos = groupViajesByFechaLocal([item("a", isoOn(future, 10))]);

    assert.equal(grupos.length, 1);
    assert.equal(grupos[0].fechaKey, key);
    assert.equal(grupos[0].label, formatFechaTituloAr(key));
    assert.notEqual(grupos[0].label, "Hoy");
    assert.notEqual(grupos[0].label, "Mañana");
  });

  it("no muta el array de entrada", () => {
    const today = new Date();
    const rows = [item("a", isoOn(today, 10))];
    groupViajesByFechaLocal(rows);
    assert.equal(rows.length, 1);
  });
});

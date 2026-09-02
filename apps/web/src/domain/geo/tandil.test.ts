import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isWithinBbox,
  isValidManualAddress,
  mapsLink,
  pickupModeForOrigen,
  TANDIL_BBOX,
} from "./index";

describe("pickupModeForOrigen", () => {
  it("es libre en Tandil (case/trim insensitive)", () => {
    assert.equal(pickupModeForOrigen("Tandil"), "libre_tandil");
    assert.equal(pickupModeForOrigen("  tandil "), "libre_tandil");
    assert.equal(pickupModeForOrigen("TANDIL"), "libre_tandil");
  });

  it("es fijo_ruta fuera de Tandil (CABA y otros)", () => {
    assert.equal(pickupModeForOrigen("Buenos Aires"), "fijo_ruta");
    assert.equal(pickupModeForOrigen(""), "fijo_ruta");
    assert.equal(pickupModeForOrigen(null), "fijo_ruta");
    assert.equal(pickupModeForOrigen("Rauch"), "fijo_ruta");
  });
});

describe("isWithinBbox", () => {
  it("Terminal Tandil está adentro", () => {
    assert.equal(isWithinBbox(-37.3217, -59.1332), true);
  });

  it("La Plata está afuera", () => {
    assert.equal(isWithinBbox(-34.9215, -57.9545), false);
  });

  it("respeta los bordes del partido", () => {
    assert.equal(isWithinBbox(TANDIL_BBOX.minLat, TANDIL_BBOX.minLng), true);
    assert.equal(isWithinBbox(TANDIL_BBOX.minLat - 0.1, TANDIL_BBOX.minLng), false);
  });
});

describe("mapsLink", () => {
  it("apunta a Google Maps con las coords", () => {
    const link = mapsLink(-37.3217, -59.1332);
    assert.match(link, /google\.com\/maps/);
    assert.match(link, /-37\.3217/);
    assert.match(link, /-59\.1332/);
  });
});

describe("isValidManualAddress", () => {
  it("acepta calle y altura", () => {
    assert.equal(isValidManualAddress("San Martín 454"), true);
    assert.equal(isValidManualAddress("Av. Colón 1100"), true);
  });

  it("rechaza sin altura (solo letras)", () => {
    assert.equal(isValidManualAddress("San Martín"), false);
  });

  it("rechaza texto muy corto", () => {
    assert.equal(isValidManualAddress("S 4"), false);
  });

  it("rechaza solo números", () => {
    assert.equal(isValidManualAddress("12345"), false);
  });

  it("rechaza espacios y vacío", () => {
    assert.equal(isValidManualAddress("   "), false);
    assert.equal(isValidManualAddress(""), false);
  });
});

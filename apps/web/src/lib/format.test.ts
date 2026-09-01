import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatPersonaNombre, normalizarNombrePila } from "./format";

describe("formatPersonaNombre", () => {
  it("nombre + apellido → un solo espacio", () => {
    assert.equal(formatPersonaNombre("Martina", "Yaquinta"), "Martina Yaquinta");
  });

  it("apellido ya duplicado en nombre → no triplica", () => {
    assert.equal(
      formatPersonaNombre("Martina Yaquinta", "Yaquinta"),
      "Martina Yaquinta",
    );
  });

  it("apellido vacío → solo nombre", () => {
    assert.equal(formatPersonaNombre("Ana", ""), "Ana");
  });

  it("nombre compuesto OK", () => {
    assert.equal(formatPersonaNombre("Juan Carlos", "Pérez"), "Juan Carlos Pérez");
  });

  it("case-insensitive del sufijo", () => {
    assert.equal(
      formatPersonaNombre("Martina Yaquinta", "yaquinta"),
      "Martina Yaquinta",
    );
  });
});

describe("normalizarNombrePila", () => {
  it("sin apellido al final → intacto", () => {
    assert.equal(normalizarNombrePila("Martina", "Yaquinta"), "Martina");
  });

  it("apellido duplicado al final → lo recorta", () => {
    assert.equal(normalizarNombrePila("Martina Yaquinta", "Yaquinta"), "Martina");
  });

  it("nombre === apellido → no vacía el nombre", () => {
    assert.equal(normalizarNombrePila("Yaquinta", "Yaquinta"), "Yaquinta");
  });

  it("nombre compuesto sin duplicado → intacto", () => {
    assert.equal(normalizarNombrePila("Juan Carlos", "Pérez"), "Juan Carlos");
  });
});

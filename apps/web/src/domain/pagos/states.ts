import type { EstadoPago, TipoPago } from "./types";

export function assertCanResolveSena(input: {
  tipo: TipoPago;
  estado: EstadoPago;
}): void {
  if (input.tipo !== "sena") {
    throw new Error("TRANSICION_INVALIDA");
  }
  if (input.estado !== "pendiente") {
    throw new Error("PAGO_NO_PENDIENTE");
  }
}

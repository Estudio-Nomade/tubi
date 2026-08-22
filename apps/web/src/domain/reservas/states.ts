import type { EstadoReserva } from "./types";

const TRANSITIONS: Record<EstadoReserva, readonly EstadoReserva[]> = {
  pendiente_sena: ["confirmada", "cancelada"],
  confirmada: ["verificada", "no_show", "cancelada"],
  verificada: ["abordada", "no_show"],
  abordada: [],
  cancelada: [],
  no_show: [],
};

export function canTransitionReserva(
  from: EstadoReserva,
  to: EstadoReserva,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransitionReserva(
  from: EstadoReserva,
  to: EstadoReserva,
): void {
  if (!canTransitionReserva(from, to)) {
    throw new Error("TRANSICION_INVALIDA");
  }
}

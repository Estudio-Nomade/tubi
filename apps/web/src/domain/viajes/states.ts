import type { EstadoViaje } from "./types";

export const VIAJE_TRANSITIONS: Record<EstadoViaje, readonly EstadoViaje[]> = {
  programado: ["recogida", "cancelado"],
  recogida: ["en_curso", "cancelado"],
  en_curso: ["completado", "cancelado"],
  completado: [],
  cancelado: [],
};

export function canTransitionViaje(from: EstadoViaje, to: EstadoViaje): boolean {
  return (VIAJE_TRANSITIONS[from] as readonly string[]).includes(to);
}

export function canCompleteViaje(estado: EstadoViaje): boolean {
  return estado === "en_curso";
}

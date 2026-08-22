/**
 * RN-CAPACIDAD — pure seat occupancy rules (docs/06).
 */

export const RESERVA_ESTADOS_OCUPAN = [
  "pendiente_sena",
  "confirmada",
  "verificada",
  "abordada",
] as const;

export type ReservaEstadoOcupa = (typeof RESERVA_ESTADOS_OCUPAN)[number];

export function asientosLibres(capacidad: number, ocupados: number): number {
  return Math.max(0, capacidad - ocupados);
}

export function assertHayCapacidad(capacidad: number, ocupados: number): void {
  if (ocupados >= capacidad) {
    throw new Error("RESERVA_SIN_ASIENTOS");
  }
}

export function isEstadoQueOcupaAsiento(
  estado: string,
): estado is ReservaEstadoOcupa {
  return (RESERVA_ESTADOS_OCUPAN as readonly string[]).includes(estado);
}

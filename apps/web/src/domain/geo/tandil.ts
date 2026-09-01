import type { PickupMode } from "./types";

/**
 * Zona de recogida libre en Tandil.
 * Mantener en sync con supabase/migrations/0028_reserva_recogida.sql.
 */
export const TANDIL_CENTER = { lat: -37.3217, lng: -59.1332 } as const;

export const TANDIL_BBOX = {
  minLat: -37.7,
  maxLat: -36.9,
  minLng: -59.8,
  maxLng: -58.8,
} as const;

export type Bbox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export function isWithinBbox(
  lat: number,
  lng: number,
  bbox: Bbox = TANDIL_BBOX,
): boolean {
  return (
    lat >= bbox.minLat &&
    lat <= bbox.maxLat &&
    lng >= bbox.minLng &&
    lng <= bbox.maxLng
  );
}

/**
 * Regla de recogida cerrada por origen de ruta:
 *  - Tandil       -> libre (door-to-door dentro del partido)
 *  - Buenos Aires -> punto fijo (parada tipo 'origen' de la ruta)
 */
export function pickupModeForOrigen(origen: string | null | undefined): PickupMode {
  return String(origen ?? "").trim().toLowerCase() === "tandil"
    ? "libre_tandil"
    : "fijo_ruta";
}

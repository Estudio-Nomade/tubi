/**
 * A→B match on ordered stops (no maps).
 * Origin stop must appear before destination on the same route.
 */

export type StopCity = {
  ciudad: string;
  orden: number;
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * True if some stop city matches `origen` and a later stop matches `destino`.
 */
export function matchesPlaceSequence(
  stops: readonly StopCity[],
  origen: string,
  destino: string,
): boolean {
  const o = norm(origen);
  const d = norm(destino);
  if (!o || !d || o === d) return false;

  const ordered = [...stops].sort((a, b) => a.orden - b.orden);
  let originOrden: number | null = null;

  for (const s of ordered) {
    const c = norm(s.ciudad);
    if (originOrden === null && c === o) {
      originOrden = s.orden;
      continue;
    }
    if (originOrden !== null && c === d && s.orden > originOrden) {
      return true;
    }
  }
  return false;
}

/** Filter trip ids whose stop list matches A→B. */
export function filterTripsByPlaceSequence<T extends { stops: readonly StopCity[] }>(
  trips: readonly T[],
  origen: string,
  destino: string,
): T[] {
  return trips.filter((t) => matchesPlaceSequence(t.stops, origen, destino));
}

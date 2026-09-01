import type { ViajeOperadorRow } from "./viajes-types";

const ACTIVO_RANK: Record<string, number> = {
  en_curso: 0,
  recogida: 1,
  programado: 2,
};

export function sortViajesActivos(
  rows: ViajeOperadorRow[],
): ViajeOperadorRow[] {
  return [...rows].sort((a, b) => {
    const ra = ACTIVO_RANK[a.estado] ?? 99;
    const rb = ACTIVO_RANK[b.estado] ?? 99;
    if (ra !== rb) return ra - rb;
    const fa = a.fechaSalida.localeCompare(b.fechaSalida);
    if (fa !== 0) return fa;
    return a.id.localeCompare(b.id);
  });
}

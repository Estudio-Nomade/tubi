import {
  addDaysLocal,
  formatFechaTituloAr,
  toIsoDateLocal,
} from "@/lib/format";

import type { ViajeListItem } from "./types";

export type ViajeGrupo = {
  /** YYYY-MM-DD en zona local (misma base que toIsoDateLocal). */
  fechaKey: string;
  /** Hoy / Mañana / "Martes 25 ago". */
  label: string;
  items: ViajeListItem[];
};

function labelFor(fechaKey: string, today: Date): string {
  if (fechaKey === toIsoDateLocal(today)) return "Hoy";
  if (fechaKey === toIsoDateLocal(addDaysLocal(today, 1))) return "Mañana";
  return formatFechaTituloAr(fechaKey);
}

export function groupViajesByFechaLocal(
  viajes: ViajeListItem[],
): ViajeGrupo[] {
  const today = new Date();
  const groups = new Map<string, ViajeGrupo>();

  for (const viaje of viajes) {
    const fechaKey = toIsoDateLocal(new Date(viaje.fechaSalida));
    const existing = groups.get(fechaKey);
    if (existing) {
      existing.items.push(viaje);
    } else {
      groups.set(fechaKey, {
        fechaKey,
        label: labelFor(fechaKey, today),
        items: [viaje],
      });
    }
  }

  return [...groups.values()].sort((a, b) =>
    a.fechaKey.localeCompare(b.fechaKey),
  );
}

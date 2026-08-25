import type { PoliticaCancelacionSnapshot } from "./snapshots";
import type { EstadoReserva } from "./types";

const HOURS_24_MS = 24 * 60 * 60 * 1000;
const HOURS_12_MS = 12 * 60 * 60 * 1000;

const CANCELABLE: ReadonlySet<EstadoReserva> = new Set([
  "pendiente_sena",
  "confirmada",
]);

export function canCancelReserva(estado: EstadoReserva): boolean {
  return CANCELABLE.has(estado);
}

export function assertCanCancelReserva(estado: EstadoReserva): void {
  if (!canCancelReserva(estado)) {
    throw new Error("TRANSICION_INVALIDA");
  }
}

/**
 * RN-03: refund % from antelación (fecha_salida − now) and snapshot policy.
 * pendiente_sena is handled separately (always 0).
 */
export function computeRefundPct(
  now: Date,
  fechaSalida: Date,
  politica: PoliticaCancelacionSnapshot,
): number {
  const antelacionMs = fechaSalida.getTime() - now.getTime();
  if (antelacionMs > HOURS_24_MS) {
    return politica.devolucion_24h_pct;
  }
  if (antelacionMs >= HOURS_12_MS) {
    return politica.devolucion_12_24h_pct;
  }
  return politica.devolucion_menos_12h_pct;
}

export function computeRefundAmount(montoSena: number, pct: number): number {
  if (!Number.isFinite(montoSena) || !Number.isFinite(pct)) {
    return 0;
  }
  if (montoSena <= 0 || pct <= 0) {
    return 0;
  }
  return Math.round((montoSena * pct) / 100);
}

export type RefundPreview = {
  pct: number;
  monto: number;
};

/** Preview for UI: pendiente_sena → 0; confirmada → RN-03. */
export function previewRefund(input: {
  estado: EstadoReserva;
  now: Date;
  fechaSalida: Date;
  montoSena: number;
  politica: PoliticaCancelacionSnapshot;
}): RefundPreview {
  if (input.estado === "pendiente_sena") {
    return { pct: 0, monto: 0 };
  }
  if (input.estado !== "confirmada") {
    return { pct: 0, monto: 0 };
  }
  const pct = computeRefundPct(
    input.now,
    input.fechaSalida,
    input.politica,
  );
  return {
    pct,
    monto: computeRefundAmount(input.montoSena, pct),
  };
}

export function formatRefundHint(preview: RefundPreview): string {
  if (preview.pct <= 0 || preview.monto <= 0) {
    return "Si cancelás ahora, la seña no se devuelve.";
  }
  return `Si cancelás ahora, te devolvemos el ${preview.pct}% de la seña ($${preview.monto.toLocaleString("es-AR")}).`;
}

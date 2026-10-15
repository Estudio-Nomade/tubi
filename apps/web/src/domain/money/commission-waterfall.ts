/**
 * Peer commission waterfall (spec §6).
 * S = seña (anticipo a Tubi), C = commission, P = tramo price.
 * Tubi ends with C; driver with P-C.
 */

export type WaterfallInput = {
  price: number;
  depositPct: number;
  commissionPct: number;
};

export type WaterfallResult = {
  price: number;
  seña: number;
  balanceDue: number;
  commission: number;
  driverNet: number;
  /** Positive = driver pays Tubi; negative = Tubi credits driver */
  settlementDriverToTubi: number;
};

export function computePeerWaterfall(input: WaterfallInput): WaterfallResult {
  const price = input.price;
  const seña = round2(price * clamp01(input.depositPct));
  const commission = round2(price * clamp01(input.commissionPct));
  const balanceDue = round2(price - seña);
  const driverNet = round2(price - commission);
  const settlementDriverToTubi = round2(commission - seña);
  return {
    price,
    seña,
    balanceDue,
    commission,
    driverNet,
    settlementDriverToTubi,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Display helpers (UI only — no business constants). */

export function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFechaHoraAr(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatHoraAr(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatFechaLargaAr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Pencil P4 title style: "Martes 25 ago" */
export function formatFechaTituloAr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const raw = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/\.$/, "");
}

export function formatHoraLlegadaAr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return `lleg. ~${formatHoraAr(iso)}`;
}

/** Local calendar YYYY-MM-DD (browser / server local TZ). */
export function toIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

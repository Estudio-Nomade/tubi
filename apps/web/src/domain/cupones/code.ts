export function normalizeCuponCodigo(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

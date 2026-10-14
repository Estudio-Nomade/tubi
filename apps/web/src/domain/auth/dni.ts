/** Argentine DNI helpers: digits only for storage, dotted groups while typing. */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Format as 12.345.678 (groups of 3 from the right). */
export function formatDniInput(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 8);
  if (digits.length <= 3) return digits;
  const parts: string[] = [];
  let rest = digits;
  while (rest.length > 3) {
    parts.unshift(rest.slice(-3));
    rest = rest.slice(0, -3);
  }
  if (rest) parts.unshift(rest);
  return parts.join(".");
}

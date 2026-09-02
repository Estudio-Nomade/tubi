/**
 * Map Supabase Auth / undici network failures to actionable Spanish copy.
 * Business Auth errors (email taken, weak password, etc.) pass through.
 */

const NETWORK_PATTERNS = [
  /fetch failed/i,
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /enotfound/i,
  /econnrefused/i,
  /econnreset/i,
  /etimedout/i,
  /eai_again/i,
  /socket hang up/i,
  /getaddrinfo/i,
  /undici/i,
  /aborted/i,
  /timeout/i,
] as const;

const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor de autenticación. En local: `supabase start` y `apps/web/.env.local` con URL/anon de `supabase status -o env` (preferí ANON_KEY JWT eyJ…). Reiniciá el dev server tras cambiar el env.";

const CREDENTIALS_PATTERNS = [
  /invalid login credentials/i,
  /invalid_credentials/i,
] as const;

const CREDENTIALS_MESSAGE =
  "Email o contraseña incorrectos.";

export function isAuthNetworkError(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  return NETWORK_PATTERNS.some((re) => re.test(m));
}

/** Prefer mapped network copy; otherwise keep the original Auth message. */
export function mapAuthError(message: string | null | undefined, fallback: string): string {
  const raw = (message ?? "").trim();
  if (!raw) return fallback;
  if (isAuthNetworkError(raw)) return NETWORK_MESSAGE;
  if (CREDENTIALS_PATTERNS.some((re) => re.test(raw))) return CREDENTIALS_MESSAGE;
  return raw;
}

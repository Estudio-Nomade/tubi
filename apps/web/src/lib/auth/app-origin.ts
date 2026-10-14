/**
 * Public app origin for auth email redirects (confirm signup, recovery).
 * Prefer NEXT_PUBLIC_APP_URL in prod; fall back to Vercel URL; then localhost.
 */
export function getAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "http://127.0.0.1:3000";
}

/** Absolute URL for Supabase auth callback (PKCE / email confirm). */
export function getAuthCallbackUrl(nextPath = "/"): string {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  const url = new URL("/auth/callback", getAppOrigin());
  url.searchParams.set("next", next);
  return url.toString();
}

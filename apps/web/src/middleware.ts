/**
 * Auth edge entry (apps/web/src/middleware.ts).
 *
 * Next.js 16 renames this convention to proxy.ts internally; we keep middleware.ts
 * as the project entry name. Export must stay `middleware` for the framework.
 *
 * Strategy (Slice 0.5 — will grow):
 * 1. Refresh the Supabase auth session on every matched request (cookie rotation).
 * 2. Public routes stay open (home, offline fallback).
 * 3. Role areas /conductor/* and /operador/* require a session; otherwise → /
 *    (temporary until /login exists).
 * 4. Role checks (profiles.rol + RLS) come later.
 *
 * Without Supabase env vars we pass through so local UI work still works.
 */

import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Path prefixes that require an authenticated user. */
const PROTECTED_PREFIXES = ["/conductor", "/operador"] as const;

/** Paths always reachable without a session (besides static assets excluded by matcher). */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/~offline" || pathname.startsWith("/~offline/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let user = null;
  let response: NextResponse;

  try {
    const session = await updateSession(request);
    user = session.user;
    response = session.response;
  } catch {
    // Missing NEXT_PUBLIC_SUPABASE_* — skip session refresh until env is configured.
    response = NextResponse.next({ request });
  }

  if (isProtectedPath(pathname) && !user && !isPublicPath(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on app routes only. Skip:
     * - Next internals (_next/static, _next/image)
     * - Common static assets and the Serwist service worker
     * - favicon / icons
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js.map)$).*)",
  ],
};

import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseProfilesRepository } from "@/adapters/supabase/profiles-repository";
import { createAuthService, homePathForRol } from "@/application/auth/auth-service";
import type { Rol } from "@/domain/auth";
import { createClient } from "@/lib/supabase/server";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function metaString(meta: Record<string, unknown>, key: string): string {
  const v = meta[key];
  return typeof v === "string" ? v.trim() : "";
}

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/**
 * Completes email confirmation.
 * Supports:
 * - PKCE: ?code=...
 * - Email OTP (cross-device): ?token_hash=...&type=signup|email
 * GET /auth/callback?...
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const typeRaw = url.searchParams.get("type");
  const next = safeNext(url.searchParams.get("next"));
  const origin = url.origin;

  const supabase = await createClient();
  let authError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) authError = error.message;
  } else if (tokenHash && typeRaw && OTP_TYPES.has(typeRaw)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeRaw as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) authError = error.message;
  } else {
    // Implicit flow may land with hash tokens only — hand off to client page.
    if (url.hash || url.searchParams.has("access_token")) {
      return NextResponse.redirect(
        new URL(`/auth/confirm${url.search}${url.hash}`, origin),
      );
    }
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback`, origin),
    );
  }

  if (authError) {
    console.error("[auth/callback]", authError);
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback`, origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const service = createAuthService(createSupabaseProfilesRepository(supabase));
  let profile = await service.getProfileById(user.id);

  if (!profile) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const rolRaw = metaString(meta, "rol");
    const rol: Rol =
      rolRaw === "conductor" || rolRaw === "pasajero" ? rolRaw : "pasajero";
    const nombre = metaString(meta, "nombre") || "Usuario";
    const apellido = metaString(meta, "apellido");
    const telefono = metaString(meta, "telefono") || "0000000000";
    const dni = metaString(meta, "dni") || null;

    try {
      profile = await service.createProfile({
        id: user.id,
        rol,
        nombre,
        apellido: rol === "pasajero" ? "" : apellido || "",
        telefono,
        dni: rol === "pasajero" ? dni : null,
      });
    } catch {
      profile = await service.getProfileById(user.id);
    }
  }

  const dest = profile ? homePathForRol(profile.rol) : next;
  return NextResponse.redirect(new URL(dest, origin));
}

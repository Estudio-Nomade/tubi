import { NextResponse } from "next/server";

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

/**
 * Completes email confirmation / OAuth PKCE.
 * GET /auth/callback?code=...&next=/pasajero
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback`, origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
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
      // Profile may already exist from a parallel request; re-read.
      profile = await service.getProfileById(user.id);
    }
  }

  const dest = profile ? homePathForRol(profile.rol) : next;
  return NextResponse.redirect(new URL(dest, origin));
}

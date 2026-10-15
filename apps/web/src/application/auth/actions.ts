"use server";

/**
 * Auth Server Actions: sign-in, sign-up (pasajero/conductor), sign-out, current profile.
 *
 * Local note: with Supabase email confirmation OFF, signUp returns a session.
 * If confirmation is ON, signUp may return a user without session — we then
 * attempt signInWithPassword after inserting the profile.
 */

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import { createSupabaseProfilesRepository } from "@/adapters/supabase/profiles-repository";
import { createConductorService } from "@/application/conductor";
import { conductorLandingPath } from "@/application/conductor/landing-path";
import {
  canDrive,
  loginSchema,
  registerConductorSchema,
  registerPasajeroSchema,
} from "@/domain/auth";
import type { Profile } from "@/domain/auth";
import { getAuthCallbackUrl } from "@/lib/auth/app-origin";
import { normalizarNombrePila } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { createAuthService } from "./auth-service";
import { mapAuthError } from "./map-auth-error";
import {
  parseUiModeCookie,
  resolvePostLoginPath,
  UI_MODE_COOKIE,
} from "./post-login-path";

export type AuthActionResult = {
  error?: string;
  /** Email confirmation required — show message, do not redirect yet. */
  needsEmailConfirmation?: boolean;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function firstZodError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Datos inválidos";
}

async function getAuthService() {
  const supabase = await createClient();
  return {
    supabase,
    service: createAuthService(createSupabaseProfilesRepository(supabase)),
  };
}

export async function signInAction(
  formData: FormData,
): Promise<AuthActionResult | void> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const { supabase, service } = await getAuthService();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      error: mapAuthError(error?.message, "No se pudo iniciar sesión"),
    };
  }

  let profile: Profile | null;
  try {
    profile = await service.getProfileById(data.user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return { error: mapAuthError(message, "No se pudo cargar tu perfil") };
  }

  if (!profile) {
    // Sesión ya quedó seteada pero no hay fila en profiles: no la dejamos
    // a medias (evita loop /login ↔ /pasajero). SignOut best-effort.
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar: el error de perfil es lo que hay que mostrar.
    }
    return {
      error:
        "No encontramos un perfil para esta cuenta. Registrate o contactá soporte.",
    };
  }

  revalidatePath("/", "layout");

  const cookieStore = await cookies();
  const mode = parseUiModeCookie(cookieStore.get(UI_MODE_COOKIE)?.value);

  let hasVehiculo: boolean | undefined;
  if (canDrive(profile) && mode === "drive") {
    const conductorService = createConductorService(
      createSupabaseConductorRepository(supabase),
    );
    try {
      const vehiculos = await conductorService.listMisVehiculos(profile.id);
      hasVehiculo = vehiculos.length > 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      return { error: mapAuthError(message, "No se pudo cargar tu información") };
    }
  }

  redirect(resolvePostLoginPath(profile, mode, { hasVehiculo }));
}

export async function signUpPasajeroAction(
  formData: FormData,
): Promise<AuthActionResult | void> {
  const parsed = registerPasajeroSchema.safeParse({
    nombre: formString(formData, "nombre"),
    dni: formString(formData, "dni"),
    telefono: formString(formData, "telefono"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const { nombre, dni, telefono, email, password } = parsed.data;
  const { supabase, service } = await getAuthService();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/pasajero"),
      data: {
        rol: "pasajero",
        nombre,
        telefono,
        dni,
      },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message, "No se pudo crear la cuenta") };
  }

  const userId = data.user?.id ?? null;
  if (!userId) {
    return { error: "No se pudo crear la cuenta" };
  }

  // Email confirmation ON → no session until the user clicks the mail link.
  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  try {
    // profiles.apellido is NOT NULL; pasajeros have no apellido field — empty string.
    await service.createProfile({
      id: userId,
      nombre,
      apellido: "",
      telefono,
      dni,
      isPassenger: true,
      isDriver: false,
      isOperator: false,
      driverKycStatus: "unverified",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear perfil";
    return { error: mapAuthError(message, "Error al crear perfil") };
  }

  revalidatePath("/", "layout");
  redirect("/pasajero");
}

export async function signUpConductorAction(
  formData: FormData,
): Promise<AuthActionResult | void> {
  const parsed = registerConductorSchema.safeParse({
    nombre: formString(formData, "nombre"),
    apellido: formString(formData, "apellido"),
    telefono: formString(formData, "telefono"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const { nombre, apellido, telefono, email, password } = parsed.data;
  const nombreNormalizado = normalizarNombrePila(nombre, apellido);
  const { supabase, service } = await getAuthService();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/conductor"),
      data: {
        rol: "conductor",
        nombre: nombreNormalizado,
        apellido,
        telefono,
      },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message, "No se pudo crear la cuenta") };
  }

  const userId = data.user?.id ?? null;
  if (!userId) {
    return { error: "No se pudo crear la cuenta" };
  }

  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  try {
    await service.createProfile({
      id: userId,
      nombre: nombreNormalizado,
      apellido,
      telefono,
      dni: null,
      isPassenger: true,
      isDriver: true,
      isOperator: false,
      driverKycStatus: "unverified",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear perfil";
    return { error: mapAuthError(message, "Error al crear perfil") };
  }

  revalidatePath("/", "layout");
  // Self-serve conductor has no vehicle yet — force FR-09 onboarding.
  redirect(conductorLandingPath(false));
}

export async function signUpOperadorAction(
  _formData: FormData,
): Promise<AuthActionResult | void> {
  // Public operator self-signup is closed (login-only).
  // Setting auth.allow_operador_signup + RPC remain as secondary gates.
  return { error: "El registro de operador no está disponible." };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/** Current authenticated profile, or null if anonymous / missing row. */
export async function getCurrentProfile() {
  const { supabase, service } = await getAuthService();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return service.getProfileById(user.id);
}

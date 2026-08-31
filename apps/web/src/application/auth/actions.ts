"use server";

/**
 * Auth Server Actions: sign-in, sign-up (pasajero/conductor), sign-out, current profile.
 *
 * Local note: with Supabase email confirmation OFF, signUp returns a session.
 * If confirmation is ON, signUp may return a user without session — we then
 * attempt signInWithPassword after inserting the profile.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseProfilesRepository } from "@/adapters/supabase/profiles-repository";
import {
  loginSchema,
  registerConductorSchema,
  registerPasajeroSchema,
} from "@/domain/auth";
import { createClient } from "@/lib/supabase/server";

import { createAuthService, homePathForRol } from "./auth-service";
import { mapAuthError } from "./map-auth-error";

export type AuthActionResult = { error: string };

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

  const profile = await service.getProfileById(data.user.id);
  if (!profile) {
    return { error: "Perfil no encontrado" };
  }

  revalidatePath("/", "layout");
  redirect(homePathForRol(profile.rol));
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

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: mapAuthError(error.message, "No se pudo crear la cuenta") };
  }

  let userId = data.user?.id ?? null;

  // No session after signUp (email confirm ON) — sign in so RLS insert works.
  if (!data.session) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error || !signIn.data.user) {
      return {
        error: mapAuthError(
          signIn.error?.message,
          "Cuenta creada. Confirmá el email antes de continuar.",
        ),
      };
    }
    userId = signIn.data.user.id;
  }

  if (!userId) {
    return { error: "No se pudo crear la cuenta" };
  }

  try {
    // profiles.apellido is NOT NULL; pasajeros have no apellido field — empty string.
    await service.createProfile({
      id: userId,
      rol: "pasajero",
      nombre,
      apellido: "",
      telefono,
      dni,
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
  const { supabase, service } = await getAuthService();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: mapAuthError(error.message, "No se pudo crear la cuenta") };
  }

  let userId = data.user?.id ?? null;

  if (!data.session) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error || !signIn.data.user) {
      return {
        error: mapAuthError(
          signIn.error?.message,
          "Cuenta creada. Confirmá el email antes de continuar.",
        ),
      };
    }
    userId = signIn.data.user.id;
  }

  if (!userId) {
    return { error: "No se pudo crear la cuenta" };
  }

  try {
    await service.createProfile({
      id: userId,
      rol: "conductor",
      nombre,
      apellido,
      telefono,
      dni: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear perfil";
    return { error: mapAuthError(message, "Error al crear perfil") };
  }

  revalidatePath("/", "layout");
  redirect("/conductor");
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

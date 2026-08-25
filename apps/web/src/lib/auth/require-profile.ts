import { redirect } from "next/navigation";

import { getCurrentProfile, homePathForRol } from "@/application/auth";
import type { Rol } from "@/domain/auth";

/**
 * Server-side role guard for area layouts.
 * Middleware only checks session; this loads the profile and enforces rol.
 */
export async function requireProfile(allowed?: Rol[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (allowed && !allowed.includes(profile.rol)) {
    redirect(homePathForRol(profile.rol));
  }
  return profile;
}

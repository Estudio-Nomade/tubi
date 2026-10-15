import { redirect } from "next/navigation";

import { getCurrentProfile, homePathForRol } from "@/application/auth";
import {
  canDrive,
  canOperate,
  canTravel,
  primaryHomePath,
} from "@/domain/auth";
import type { Profile, Rol } from "@/domain/auth";

export type RequireProfileOptions = {
  /**
   * Area the layout protects. Capability-based (not single rol).
   * - travel: passenger area
   * - drive: conductor ops (requires canDrive) unless allowKycOnboarding
   * - operate: operator panel
   * - any: session only
   */
  area?: "travel" | "drive" | "operate" | "any";
  /** Allow /conductor/kyc without verified KYC */
  allowKycOnboarding?: boolean;
};

function isRolArray(
  value: RequireProfileOptions | Rol[] | undefined,
): value is Rol[] {
  return Array.isArray(value);
}

/**
 * Server-side guard for area layouts and server actions.
 *
 * Overloads:
 * - `requireProfile()` — session only
 * - `requireProfile({ area: "travel" })` — capabilities (preferred)
 * - `requireProfile(["pasajero"])` — legacy rol list (maps to capabilities)
 *
 * Middleware only checks session; this loads the profile and enforces access.
 */
export async function requireProfile(
  options?: RequireProfileOptions | Rol[],
): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (isRolArray(options)) {
    return enforceLegacyRols(profile, options);
  }

  const { area = "any", allowKycOnboarding = false } = options ?? {};

  if (area === "travel") {
    if (!canTravel(profile) && canOperate(profile)) {
      redirect("/operador");
    }
    if (!canTravel(profile)) {
      redirect(primaryHomePath(profile, "travel"));
    }
    return profile;
  }

  if (area === "drive") {
    if (allowKycOnboarding) return profile;
    if (!canDrive(profile)) {
      if (profile.isDriver || profile.isPassenger) {
        redirect("/conductor/kyc");
      }
      redirect(primaryHomePath(profile, "travel"));
    }
    return profile;
  }

  if (area === "operate") {
    if (!canOperate(profile)) {
      redirect(homePathForRol(profile.rol));
    }
    return profile;
  }

  return profile;
}

function enforceLegacyRols(profile: Profile, allowed: Rol[]): Profile {
  if (allowed.length === 0) return profile;

  const ok = allowed.some((rol) => {
    if (rol === "pasajero") return canTravel(profile);
    if (rol === "conductor") return canDrive(profile) || profile.isDriver;
    if (rol === "operador") return canOperate(profile);
    return false;
  });

  if (!ok) {
    // Conductor pages with legacy ["conductor"] before KYC → kyc funnel
    if (allowed.includes("conductor") && !canDrive(profile)) {
      redirect("/conductor/kyc");
    }
    redirect(homePathForRol(profile.rol));
  }
  return profile;
}

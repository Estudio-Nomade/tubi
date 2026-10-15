import { conductorLandingPath } from "@/application/conductor/landing-path";
import { primaryHomePath } from "@/domain/auth";
import type { Profile, UiMode } from "@/domain/auth";

export const UI_MODE_COOKIE = "tubi_ui_mode" as const;

export function parseUiModeCookie(
  value: string | null | undefined,
): UiMode {
  if (value === "drive" || value === "travel") return value;
  return "travel";
}

/**
 * Post-login destination from capabilities + UI mode.
 * When home is conductor, applies vehicle onboarding landing.
 */
export function resolvePostLoginPath(
  profile: Pick<
    Profile,
    "isPassenger" | "isDriver" | "isOperator" | "driverKycStatus"
  >,
  mode: UiMode,
  options?: { hasVehiculo?: boolean },
): string {
  const home = primaryHomePath(profile, mode);
  if (home === "/conductor") {
    return conductorLandingPath(options?.hasVehiculo ?? false);
  }
  return home;
}

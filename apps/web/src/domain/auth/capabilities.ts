import type { DriverKycStatus, Profile, Rol, UiMode } from "./types";

const DRIVER_KYC_STATUSES: readonly DriverKycStatus[] = [
  "unverified",
  "pending_kyc",
  "verified",
  "rejected",
  "suspended",
] as const;

export function canTravel(p: Pick<Profile, "isPassenger">): boolean {
  return p.isPassenger;
}

export function canDrive(
  p: Pick<Profile, "isDriver" | "driverKycStatus">,
): boolean {
  return p.isDriver && p.driverKycStatus === "verified";
}

export function canOperate(p: Pick<Profile, "isOperator">): boolean {
  return p.isOperator;
}

export function legacyRolFromCapabilities(caps: {
  isPassenger: boolean;
  isDriver: boolean;
  isOperator: boolean;
}): Rol {
  if (caps.isOperator) return "operador";
  if (caps.isDriver) return "conductor";
  return "pasajero";
}

export function primaryHomePath(
  p: Pick<
    Profile,
    "isPassenger" | "isDriver" | "isOperator" | "driverKycStatus"
  >,
  mode: UiMode,
): string {
  if (mode === "drive" && canDrive(p)) return "/conductor";
  if (canTravel(p)) return "/pasajero";
  if (canOperate(p)) return "/operador";
  return "/pasajero";
}

export function assertDriverKycStatus(s: string): DriverKycStatus {
  if ((DRIVER_KYC_STATUSES as readonly string[]).includes(s)) {
    return s as DriverKycStatus;
  }
  throw new Error(`Invalid driverKycStatus: ${s}`);
}

/** User-facing Spanish label for driver KYC status (never raw enum). */
export function driverKycStatusLabel(status: DriverKycStatus): string {
  switch (status) {
    case "unverified":
      return "Sin verificar";
    case "pending_kyc":
      return "En revisión";
    case "verified":
      return "Verificado";
    case "rejected":
      return "Rechazado";
    case "suspended":
      return "Suspendido";
  }
}

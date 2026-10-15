/**
 * Auth / profile domain types. No framework or Supabase imports.
 */

export type DriverKycStatus =
  | "unverified"
  | "pending_kyc"
  | "verified"
  | "rejected"
  | "suspended";

/** @deprecated transition only — prefer capabilities */
export type Rol = "pasajero" | "conductor" | "operador";

export type UiMode = "travel" | "drive";

export type Profile = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string | null;
  dniVerificado: boolean;
  isPassenger: boolean;
  isDriver: boolean;
  isOperator: boolean;
  driverKycStatus: DriverKycStatus;
  /** derived for legacy callers during migration */
  rol: Rol;
};

/** Fields required to insert a new profile after sign-up. */
export type ProfileInsert = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string | null;
  isPassenger?: boolean;
  isDriver?: boolean;
  isOperator?: boolean;
  driverKycStatus?: DriverKycStatus;
};

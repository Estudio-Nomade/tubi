/**
 * Auth / profiles port. Implemented by adapters only.
 */

import type { DriverKycStatus, Profile, ProfileInsert } from "./types";

export type DriverKycUpdate = {
  isDriver?: boolean;
  driverKycStatus: DriverKycStatus;
  /** When approved, mark passenger DNI verified too if we trust provider */
  dniVerificado?: boolean;
};

export interface ProfilesRepository {
  findById(id: string): Promise<Profile | null>;
  insert(profile: ProfileInsert): Promise<Profile>;
  updateDriverKyc(userId: string, update: DriverKycUpdate): Promise<Profile>;
}

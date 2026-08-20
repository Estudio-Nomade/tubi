/**
 * Auth profile use cases. Orchestrates ProfilesRepository only.
 * Sign-in / sign-up live in Server Actions (Supabase Auth client).
 */

import type { Profile, ProfileInsert, ProfilesRepository } from "@/domain/auth";

export function createAuthService(repo: ProfilesRepository) {
  return {
    async getProfileById(id: string): Promise<Profile | null> {
      return repo.findById(id);
    },

    async createProfile(input: ProfileInsert): Promise<Profile> {
      return repo.insert(input);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;

/** Home path per role after successful auth. */
export function homePathForRol(rol: Profile["rol"]): string {
  switch (rol) {
    case "pasajero":
      return "/pasajero";
    case "conductor":
      return "/conductor";
    case "operador":
      return "/operador";
  }
}

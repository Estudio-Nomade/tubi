/**
 * Auth / profiles port. Implemented by adapters only.
 */

import type { Profile, ProfileInsert } from "./types";

export interface ProfilesRepository {
  findById(id: string): Promise<Profile | null>;
  insert(profile: ProfileInsert): Promise<Profile>;
}

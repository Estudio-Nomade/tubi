/**
 * Supabase adapter for the ProfilesRepository port.
 * Receives an already-created Supabase client — does not own env/clients.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Profile, ProfileInsert, ProfilesRepository } from "@/domain/auth";
import type { Database } from "@/lib/supabase/types";

const rolSchema = z.enum(["pasajero", "conductor", "operador"]);

const profileRowSchema = z.object({
  id: z.string().min(1),
  rol: rolSchema,
  nombre: z.string(),
  apellido: z.string(),
  telefono: z.string(),
  dni: z.string().nullable(),
  dni_verificado: z.boolean(),
});

function toProfile(row: z.infer<typeof profileRowSchema>): Profile {
  return {
    id: row.id,
    rol: row.rol,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono,
    dni: row.dni,
    dniVerificado: row.dni_verificado,
  };
}

export type TubiSupabaseClient = SupabaseClient<Database>;

const PROFILE_COLUMNS =
  "id, rol, nombre, apellido, telefono, dni, dni_verificado" as const;

export function createSupabaseProfilesRepository(
  client: TubiSupabaseClient,
): ProfilesRepository {
  return {
    async findById(id) {
      const { data, error } = await client
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(`profiles.findById(${id}) failed: ${error.message}`);
      }

      if (!data) return null;
      return toProfile(profileRowSchema.parse(data));
    },

    async insert(profile: ProfileInsert) {
      const { data, error } = await client
        .from("profiles")
        .insert({
          id: profile.id,
          rol: profile.rol,
          nombre: profile.nombre,
          apellido: profile.apellido,
          telefono: profile.telefono,
          dni: profile.dni,
        })
        .select(PROFILE_COLUMNS)
        .single();

      if (error) {
        throw new Error(`profiles.insert failed: ${error.message}`);
      }

      return toProfile(profileRowSchema.parse(data));
    },
  };
}

/**
 * Supabase adapter for the ProfilesRepository port.
 * Receives an already-created Supabase client — does not own env/clients.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  legacyRolFromCapabilities,
  type DriverKycUpdate,
  type Profile,
  type ProfileInsert,
  type ProfilesRepository,
} from "@/domain/auth";
import type { Database } from "@/lib/supabase/types";

const rolSchema = z.enum(["pasajero", "conductor", "operador"]);

const driverKycStatusSchema = z.enum([
  "unverified",
  "pending_kyc",
  "verified",
  "rejected",
  "suspended",
]);

const profileRowSchema = z.object({
  id: z.string().min(1),
  rol: rolSchema,
  nombre: z.string(),
  apellido: z.string(),
  telefono: z.string(),
  dni: z.string().nullable(),
  dni_verificado: z.boolean(),
  is_passenger: z.boolean(),
  is_driver: z.boolean(),
  is_operator: z.boolean(),
  driver_kyc_status: driverKycStatusSchema,
});

function toProfile(row: z.infer<typeof profileRowSchema>): Profile {
  const isPassenger = row.is_passenger;
  const isDriver = row.is_driver;
  const isOperator = row.is_operator;
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono,
    dni: row.dni,
    dniVerificado: row.dni_verificado,
    isPassenger,
    isDriver,
    isOperator,
    driverKycStatus: row.driver_kyc_status,
    rol: legacyRolFromCapabilities({ isPassenger, isDriver, isOperator }),
  };
}

export type TubiSupabaseClient = SupabaseClient<Database>;

const PROFILE_COLUMNS =
  "id, rol, nombre, apellido, telefono, dni, dni_verificado, is_passenger, is_driver, is_operator, driver_kyc_status" as const;

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
      const isPassenger = profile.isPassenger ?? true;
      const isDriver = profile.isDriver ?? false;
      const isOperator = profile.isOperator ?? false;
      const driverKycStatus = profile.driverKycStatus ?? "unverified";

      const { data, error } = await client
        .from("profiles")
        .insert({
          id: profile.id,
          nombre: profile.nombre,
          apellido: profile.apellido,
          telefono: profile.telefono,
          dni: profile.dni,
          is_passenger: isPassenger,
          is_driver: isDriver,
          is_operator: isOperator,
          driver_kyc_status: driverKycStatus,
        })
        .select(PROFILE_COLUMNS)
        .single();

      if (error) {
        throw new Error(`profiles.insert failed: ${error.message}`);
      }

      return toProfile(profileRowSchema.parse(data));
    },

    async updateDriverKyc(userId: string, update: DriverKycUpdate) {
      const patch: {
        driver_kyc_status: typeof update.driverKycStatus;
        is_driver?: boolean;
        dni_verificado?: boolean;
      } = {
        driver_kyc_status: update.driverKycStatus,
      };
      if (update.isDriver !== undefined) patch.is_driver = update.isDriver;
      if (update.dniVerificado !== undefined) {
        patch.dni_verificado = update.dniVerificado;
      }

      const { data, error } = await client
        .from("profiles")
        .update(patch)
        .eq("id", userId)
        .select(PROFILE_COLUMNS)
        .single();

      if (error) {
        throw new Error(
          `profiles.updateDriverKyc(${userId}) failed: ${error.message}`,
        );
      }

      return toProfile(profileRowSchema.parse(data));
    },
  };
}

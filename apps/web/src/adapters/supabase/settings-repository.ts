/**
 * Supabase adapter for the SettingsRepository port.
 * Receives an already-created Supabase client (server createClient) — does not own env/clients.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Setting, SettingsRepository } from "@/domain/settings";
import type { Database } from "@/lib/supabase/types";

const settingTipoSchema = z.enum(["number", "text", "boolean", "json"]);

const settingRowSchema = z.object({
  clave: z.string().min(1),
  valor: z.unknown(),
  tipo: settingTipoSchema,
  descripcion: z.string().nullable().optional(),
  updated_at: z.string(),
});

function toSetting(row: z.infer<typeof settingRowSchema>): Setting {
  return {
    clave: row.clave,
    valor: row.valor as Setting["valor"],
    tipo: row.tipo,
    descripcion: row.descripcion ?? null,
    updatedAt: row.updated_at,
  };
}

export type TubiSupabaseClient = SupabaseClient<Database>;

export function createSupabaseSettingsRepository(
  client: TubiSupabaseClient,
): SettingsRepository {
  return {
    async findAll() {
      const { data, error } = await client
        .from("settings")
        .select("clave, valor, tipo, descripcion, updated_at")
        .order("clave", { ascending: true });

      if (error) {
        throw new Error(`settings.findAll failed: ${error.message}`);
      }

      return (data ?? []).map((row) => toSetting(settingRowSchema.parse(row)));
    },

    async findByKey(clave) {
      const { data, error } = await client
        .from("settings")
        .select("clave, valor, tipo, descripcion, updated_at")
        .eq("clave", clave)
        .maybeSingle();

      if (error) {
        throw new Error(`settings.findByKey(${clave}) failed: ${error.message}`);
      }

      if (!data) return null;
      return toSetting(settingRowSchema.parse(data));
    },

    async update(input) {
      const patch: Database["public"]["Tables"]["settings"]["Update"] = {
        valor: input.valor as Database["public"]["Tables"]["settings"]["Update"]["valor"],
        updated_at: new Date().toISOString(),
      };
      if (input.updatedBy !== undefined) {
        patch.actualizado_por = input.updatedBy;
      }

      const { data, error } = await client
        .from("settings")
        .update(patch)
        .eq("clave", input.clave)
        .select("clave, valor, tipo, descripcion, updated_at")
        .maybeSingle();

      if (error) {
        throw new Error(`settings.update(${input.clave}) failed: ${error.message}`);
      }
      if (!data) {
        throw new Error(`settings.update(${input.clave}) failed: not found`);
      }
      return toSetting(settingRowSchema.parse(data));
    },

    async updateMany(inputs) {
      const results = [];
      for (const input of inputs) {
        results.push(await this.update(input));
      }
      return results;
    },
  };
}

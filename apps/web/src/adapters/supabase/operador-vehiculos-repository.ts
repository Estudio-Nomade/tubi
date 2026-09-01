import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CrearVehiculoInput,
  CrearVehiculoResult,
  OperadorVehiculosRepository,
} from "@/domain/operador";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export function createOperadorVehiculosRepository(
  client: Client,
): OperadorVehiculosRepository {
  return {
    async crearVehiculo(
      input: CrearVehiculoInput,
    ): Promise<CrearVehiculoResult> {
      const { data, error } = await client.rpc("crear_vehiculo", {
        p_conductor_id: input.conductorId,
        p_patente: input.patente,
        p_marca: input.marca,
        p_modelo: input.modelo,
        p_color: input.color,
        p_capacidad: input.capacidad,
      });
      if (error) throw new Error(error.message);
      if (data == null || typeof data !== "object") {
        throw new Error("UNKNOWN");
      }
      const obj = data as {
        ok?: boolean;
        vehiculo_id?: string;
        conductor_id?: string;
        patente?: string;
        capacidad?: number | string;
      };
      const vehiculoId = obj.vehiculo_id ? String(obj.vehiculo_id) : "";
      if (!vehiculoId || obj.ok === false) {
        throw new Error("UNKNOWN");
      }
      return {
        ok: true,
        vehiculoId,
        conductorId: String(obj.conductor_id ?? input.conductorId),
        patente: String(obj.patente ?? input.patente),
        capacidad: Number(obj.capacidad ?? input.capacidad),
      };
    },
  };
}

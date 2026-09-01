import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActualizarParadaInput,
  CrearParadaIntermediaInput,
  OperadorParadasRepository,
  ParadaMutationResult,
  ParadaRow,
  RutaParadasInfo,
} from "@/domain/operador";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export function createOperadorParadasRepository(
  client: Client,
): OperadorParadasRepository {
  return {
    async getRuta(rutaId: string): Promise<RutaParadasInfo | null> {
      const { data, error } = await client
        .from("ruta")
        .select("id, nombre, origen, destino")
        .eq("id", rutaId)
        .maybeSingle();

      if (error) {
        throw new Error(`operador.getRuta failed: ${error.message}`);
      }
      if (!data) return null;
      return {
        id: data.id,
        nombre: data.nombre,
        origen: data.origen,
        destino: data.destino,
      };
    },

    async listParadas(rutaId: string): Promise<ParadaRow[]> {
      const { data, error } = await client
        .from("parada")
        .select("id, ruta_id, nombre, ciudad, lat, lng, orden, tipo")
        .eq("ruta_id", rutaId)
        .order("orden", { ascending: true });

      if (error) {
        throw new Error(`operador.listParadas failed: ${error.message}`);
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        rutaId: row.ruta_id,
        nombre: row.nombre,
        ciudad: row.ciudad,
        lat: Number(row.lat),
        lng: Number(row.lng),
        orden: row.orden,
        tipo: row.tipo,
      }));
    },

    async actualizarParada(
      input: ActualizarParadaInput,
    ): Promise<ParadaMutationResult> {
      const { data, error } = await client.rpc("actualizar_parada", {
        p_parada_id: input.paradaId,
        p_nombre: input.nombre,
        p_ciudad: input.ciudad,
        p_lat: input.lat,
        p_lng: input.lng,
      });
      if (error) throw new Error(error.message);
      const rutaId = readRutaId(data);
      return { ok: true, paradaId: input.paradaId, rutaId };
    },

    async crearParadaIntermedia(
      input: CrearParadaIntermediaInput,
    ): Promise<ParadaMutationResult> {
      const { data, error } = await client.rpc("crear_parada_intermedia", {
        p_ruta_id: input.rutaId,
        p_nombre: input.nombre,
        p_ciudad: input.ciudad,
        p_lat: input.lat,
        p_lng: input.lng,
        p_orden: input.orden ?? null,
      });
      if (error) throw new Error(error.message);
      return {
        ok: true,
        paradaId: readParadaId(data),
        rutaId: input.rutaId,
      };
    },

    async eliminarParadaIntermedia(
      paradaId: string,
    ): Promise<ParadaMutationResult> {
      const { data, error } = await client.rpc("eliminar_parada_intermedia", {
        p_parada_id: paradaId,
      });
      if (error) throw new Error(error.message);
      return {
        ok: true,
        paradaId,
        rutaId: readRutaId(data),
      };
    },

    async reordenarParadas(
      rutaId: string,
      ids: string[],
    ): Promise<ParadaMutationResult> {
      const { data, error } = await client.rpc("reordenar_paradas_ruta", {
        p_ruta_id: rutaId,
        p_ids: ids,
      });
      if (error) throw new Error(error.message);
      return {
        ok: true,
        paradaId: "",
        rutaId: readRutaId(data),
      };
    },
  };
}

function readParadaId(data: unknown): string {
  if (data && typeof data === "object") {
    return String((data as { parada_id?: unknown }).parada_id ?? "");
  }
  return "";
}

function readRutaId(data: unknown): string {
  if (data && typeof data === "object") {
    return String((data as { ruta_id?: unknown }).ruta_id ?? "");
  }
  return "";
}

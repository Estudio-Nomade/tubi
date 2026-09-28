/**
 * Supabase adapter for CuponesRepository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CuponCampania,
  CuponesRepository,
  CuponUsuario,
  EstadoCuponUsuario,
} from "@/domain/cupones";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

type CampaniaJoin = {
  codigo: string;
  ruta_id: string | null;
};

type CuponUsuarioRow = {
  id: string;
  campania_id: string;
  estado: EstadoCuponUsuario;
  monto_descuento: number;
  vence_en: string;
  reserva_id: string | null;
  canjeado_en: string;
  campania: CampaniaJoin | CampaniaJoin[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapCuponUsuario(row: CuponUsuarioRow): CuponUsuario | null {
  const campania = one(row.campania);
  if (!campania) return null;
  return {
    id: row.id,
    campaniaId: row.campania_id,
    codigoCampania: campania.codigo,
    estado: row.estado,
    montoDescuento: Number(row.monto_descuento),
    venceEn: row.vence_en,
    reservaId: row.reserva_id ?? null,
    canjeadoEn: row.canjeado_en,
  };
}

function mapCampania(
  row: Database["public"]["Tables"]["cupon_campania"]["Row"],
): CuponCampania {
  return {
    id: row.id,
    codigo: row.codigo,
    montoDescuento: Number(row.monto_descuento),
    cuposTotales: row.cupos_totales,
    cuposUsados: Number(row.cupos_usados),
    vigenciaDesde: row.vigencia_desde,
    vigenciaHasta: row.vigencia_hasta,
    validoDiasPostCanje: Number(row.valido_dias_post_canje),
    maxPorUsuario: Number(row.max_por_usuario),
    rutaId: row.ruta_id ?? null,
    activa: row.activa,
  };
}

function mapRpcError(message: string): Error {
  const known = [
    "CUPON_NO_ENCONTRADO",
    "CUPON_INACTIVO",
    "CUPON_VENCIDO_CAMPANIA",
    "CUPON_SIN_CUPOS",
    "CUPON_YA_CANJEADO",
    "CUPON_NO_DISPONIBLE",
    "CUPON_RUTA_INVALIDA",
    "CUPONES_DESHABILITADOS",
    "NO_AUTENTICADO",
    "NO_AUTORIZADO",
  ] as const;
  for (const code of known) {
    if (message.includes(code)) return new Error(code);
  }
  return new Error(message);
}

const CUPON_USUARIO_SELECT = `
  id,
  campania_id,
  estado,
  monto_descuento,
  vence_en,
  reserva_id,
  canjeado_en,
  campania:cupon_campania!inner ( codigo, ruta_id )
`;

export function createSupabaseCuponesRepository(
  client: Client,
): CuponesRepository {
  return {
    async canjear(codigo: string): Promise<CuponUsuario> {
      const { data, error } = await client.rpc("canjear_cupon", {
        p_codigo: codigo,
      });

      if (error) throw mapRpcError(error.message);

      const json = data as {
        ok?: boolean;
        cupon_usuario_id?: string;
        monto_descuento?: number;
        vence_en?: string;
        codigo?: string;
      } | null;

      const cuponId = json?.cupon_usuario_id ? String(json.cupon_usuario_id) : "";
      if (!cuponId || json?.ok === false) {
        throw new Error("CUPON_NO_DISPONIBLE");
      }

      const { data: row, error: fetchErr } = await client
        .from("cupon_usuario")
        .select(CUPON_USUARIO_SELECT)
        .eq("id", cuponId)
        .maybeSingle();

      if (fetchErr) {
        throw new Error(`cupones.canjear fetch failed: ${fetchErr.message}`);
      }
      if (row) {
        const mapped = mapCuponUsuario(row as unknown as CuponUsuarioRow);
        if (mapped) return mapped;
      }

      return {
        id: cuponId,
        campaniaId: "",
        codigoCampania: String(json?.codigo ?? codigo),
        estado: "disponible",
        montoDescuento: Number(json?.monto_descuento ?? 0),
        venceEn: String(json?.vence_en ?? ""),
        reservaId: null,
        canjeadoEn: new Date().toISOString(),
      };
    },

    async listMine(pasajeroId: string): Promise<CuponUsuario[]> {
      const { data, error } = await client
        .from("cupon_usuario")
        .select(CUPON_USUARIO_SELECT)
        .eq("pasajero_id", pasajeroId)
        .order("canjeado_en", { ascending: false });

      if (error) {
        throw new Error(`cupones.listMine failed: ${error.message}`);
      }

      return (data ?? [])
        .map((row) => mapCuponUsuario(row as unknown as CuponUsuarioRow))
        .filter((x): x is CuponUsuario => x != null);
    },

    async listDisponiblesForRuta(
      pasajeroId: string,
      rutaId: string | null,
    ): Promise<CuponUsuario[]> {
      const now = new Date().toISOString();
      const { data, error } = await client
        .from("cupon_usuario")
        .select(CUPON_USUARIO_SELECT)
        .eq("pasajero_id", pasajeroId)
        .eq("estado", "disponible")
        .gte("vence_en", now)
        .order("canjeado_en", { ascending: false });

      if (error) {
        throw new Error(
          `cupones.listDisponiblesForRuta failed: ${error.message}`,
        );
      }

      return (data ?? [])
        .map((row) => {
          const raw = row as unknown as CuponUsuarioRow;
          const campania = one(raw.campania);
          if (!campania) return null;
          if (
            campania.ruta_id != null &&
            rutaId != null &&
            campania.ruta_id !== rutaId
          ) {
            return null;
          }
          if (campania.ruta_id != null && rutaId == null) {
            return null;
          }
          return mapCuponUsuario(raw);
        })
        .filter((x): x is CuponUsuario => x != null);
    },

    async listCampanias(): Promise<CuponCampania[]> {
      const { data, error } = await client
        .from("cupon_campania")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`cupones.listCampanias failed: ${error.message}`);
      }

      return (data ?? []).map(mapCampania);
    },

    async crearCampania(input: {
      codigo: string;
      montoDescuento: number;
      cuposTotales: number | null;
      vigenciaDesde: string;
      vigenciaHasta: string;
      validoDiasPostCanje: number;
      maxPorUsuario: number;
      rutaId: string | null;
    }): Promise<{ id: string; codigo: string }> {
      const { data, error } = await client.rpc("crear_cupon_campania", {
        p_codigo: input.codigo,
        p_monto_descuento: input.montoDescuento,
        p_cupos_totales: input.cuposTotales,
        p_vigencia_desde: input.vigenciaDesde,
        p_vigencia_hasta: input.vigenciaHasta,
        p_valido_dias_post_canje: input.validoDiasPostCanje,
        p_max_por_usuario: input.maxPorUsuario,
        p_ruta_id: input.rutaId,
      });

      if (error) throw mapRpcError(error.message);

      const json = data as {
        ok?: boolean;
        id?: string;
        codigo?: string;
      } | null;

      const id = json?.id ? String(json.id) : "";
      if (!id || json?.ok === false) {
        throw new Error("CUPON_NO_DISPONIBLE");
      }

      return {
        id,
        codigo: String(json?.codigo ?? input.codigo),
      };
    },

    async setCampaniaActiva(id: string, activa: boolean): Promise<void> {
      const { error } = await client.rpc("set_cupon_campania_activa", {
        p_campania_id: id,
        p_activa: activa,
      });

      if (error) throw mapRpcError(error.message);
    },
  };
}

export type SupabaseCuponesRepository = ReturnType<
  typeof createSupabaseCuponesRepository
>;

/**
 * Supabase adapter for ViajesRepository.
 * Receives an already-created client — does not own env/clients.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  SearchViajesQuery,
  ViajeDetail,
  ViajeListItem,
  ViajesRepository,
} from "@/domain/viajes";
import type { Database, EstadoViaje, TipoParada } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

type RutaEmbed = { origen: string; destino: string };
type VehiculoEmbed = {
  patente: string;
  marca: string;
  modelo: string;
  color: string;
  capacidad: number;
};
type ConductorEmbed = {
  id: string;
  nombre: string;
  apellido: string;
};
type ParadaEmbed = {
  id: string;
  nombre: string;
  ciudad: string;
  orden: number;
  tipo: TipoParada;
};

function dayBoundsIso(fecha: string, horaDesde?: string): {
  startIso: string;
  endIso: string;
} {
  const startLocal = horaDesde
    ? new Date(`${fecha}T${horaDesde}:00`)
    : new Date(`${fecha}T00:00:00`);
  const endLocal = new Date(`${fecha}T23:59:59.999`);
  return {
    startIso: startLocal.toISOString(),
    endIso: endLocal.toISOString(),
  };
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toListItem(
  row: {
    id: string;
    fecha_salida: string;
    precio: number;
    estado: EstadoViaje;
    ruta: RutaEmbed | RutaEmbed[] | null;
    vehiculo: VehiculoEmbed | VehiculoEmbed[] | null;
  },
  asientosLibres: number,
): ViajeListItem {
  const ruta = one(row.ruta);
  const vehiculo = one(row.vehiculo);
  if (!ruta || !vehiculo) {
    throw new Error("viaje row missing ruta or vehiculo embed");
  }
  return {
    id: row.id,
    origen: ruta.origen,
    destino: ruta.destino,
    fechaSalida: row.fecha_salida,
    precio: Number(row.precio),
    estado: row.estado,
    asientosLibres,
    vehiculo: {
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      color: vehiculo.color,
    },
  };
}

async function fetchAsientosLibres(
  client: Client,
  viajeId: string,
  fallbackCapacidad: number,
): Promise<number> {
  const { data, error } = await client.rpc("asientos_libres_viaje", {
    p_viaje_id: viajeId,
  });
  if (error || data == null) {
    return fallbackCapacidad;
  }
  return Number(data);
}

export function createSupabaseViajesRepository(client: Client): ViajesRepository {
  return {
    async search(query: SearchViajesQuery): Promise<ViajeListItem[]> {
      let q = client
        .from("viaje")
        .select(
          `
          id,
          fecha_salida,
          precio,
          estado,
          ruta!inner ( origen, destino ),
          vehiculo!inner ( patente, marca, modelo, color, capacidad )
        `,
        )
        .eq("estado", "programado")
        .eq("ruta.origen", query.origen)
        .eq("ruta.destino", query.destino);

      if (query.fecha) {
        const { startIso, endIso } = dayBoundsIso(query.fecha, query.horaDesde);
        // Nunca ofrecer salidas ya pasadas, incluso con un día "hoy".
        const nowIso = new Date().toISOString();
        const start =
          new Date(startIso).getTime() > Date.now() ? startIso : nowIso;
        q = q.gte("fecha_salida", start).lte("fecha_salida", endIso);
      } else {
        q = q.gte("fecha_salida", new Date().toISOString());
      }

      q = q.order("fecha_salida", { ascending: true });
      if (!query.fecha) {
        q = q.limit(50);
      }

      const { data, error } = await q;

      if (error) {
        throw new Error(`viajes.search failed: ${error.message}`);
      }

      const rows = data ?? [];
      return Promise.all(
        rows.map(async (row) => {
          const typed = row as unknown as {
            id: string;
            fecha_salida: string;
            precio: number;
            estado: EstadoViaje;
            ruta: RutaEmbed | RutaEmbed[] | null;
            vehiculo: VehiculoEmbed | VehiculoEmbed[] | null;
          };
          const vehiculo = one(typed.vehiculo);
          const libres = await fetchAsientosLibres(
            client,
            typed.id,
            vehiculo?.capacidad ?? 0,
          );
          return toListItem(typed, libres);
        }),
      );
    },

    async findById(id: string): Promise<ViajeDetail | null> {
      const { data, error } = await client
        .from("viaje")
        .select(
          `
          id,
          ruta_id,
          fecha_salida,
          eta_llegada,
          precio,
          estado,
          ruta!inner ( origen, destino ),
          vehiculo!inner ( patente, marca, modelo, color, capacidad ),
          conductor:profiles!viaje_conductor_id_fkey ( id, nombre, apellido )
        `,
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(`viajes.findById failed: ${error.message}`);
      }
      if (!data) return null;

      const typed = data as unknown as {
        id: string;
        fecha_salida: string;
        precio: number;
        estado: EstadoViaje;
        ruta: RutaEmbed | RutaEmbed[] | null;
        vehiculo: VehiculoEmbed | VehiculoEmbed[] | null;
        conductor?: ConductorEmbed | ConductorEmbed[] | null;
      };
      const vehiculo = one(typed.vehiculo);
      const libres = await fetchAsientosLibres(
        client,
        typed.id,
        vehiculo?.capacidad ?? 0,
      );
      const base = toListItem(typed, libres);

      const conductor = one(typed.conductor);
      if (!conductor) {
        throw new Error("viaje row missing conductor embed");
      }

      const rutaId = (data as { ruta_id: string }).ruta_id;
      const { data: paradasData, error: paradasError } = await client
        .from("parada")
        .select("id, nombre, ciudad, orden, tipo")
        .eq("ruta_id", rutaId)
        .order("orden", { ascending: true });

      if (paradasError) {
        throw new Error(`viajes.findById paradas failed: ${paradasError.message}`);
      }

      const eta = (data as { eta_llegada?: string | null }).eta_llegada ?? null;

      return {
        ...base,
        etaLlegada: eta,
        conductor: {
          id: conductor.id,
          nombre: conductor.nombre,
          apellido: conductor.apellido,
        },
        paradas: ((paradasData ?? []) as ParadaEmbed[]).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          ciudad: p.ciudad,
          orden: p.orden,
          tipo: p.tipo,
        })),
      };
    },
  };
}

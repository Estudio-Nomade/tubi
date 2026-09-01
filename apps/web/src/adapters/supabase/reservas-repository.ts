/**
 * Supabase adapter for ReservasRepository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PickupMode } from "@/domain/geo";
import {
  RESERVA_ESTADOS_OCUPAN,
  type BoardingPass,
  type BoardingPassSummary,
  type CancelReservaResult,
  type EstadoReserva,
  type PoliticaCancelacionSnapshot,
  type RecogidaInput,
  type Reserva,
  type ReservaActivaSummary,
  type ReservaListItem,
  type ReservasRepository,
} from "@/domain/reservas";
import type { Database, Json } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;
type ReservaRow = Database["public"]["Tables"]["reserva"]["Row"];

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function fullName(nombre: string, apellido: string | null | undefined): string {
  return [nombre, apellido].filter(Boolean).join(" ").trim();
}

function parsePolitica(raw: Json): PoliticaCancelacionSnapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("RESERVA_POLITICA_INVALIDA");
  }
  const obj = raw as Record<string, unknown>;
  const a = Number(obj.devolucion_24h_pct);
  const b = Number(obj.devolucion_12_24h_pct);
  const c = Number(obj.devolucion_menos_12h_pct);
  if (![a, b, c].every(Number.isFinite)) {
    throw new Error("RESERVA_POLITICA_INVALIDA");
  }
  return {
    devolucion_24h_pct: a,
    devolucion_12_24h_pct: b,
    devolucion_menos_12h_pct: c,
  };
}

function mapReserva(row: ReservaRow): Reserva {
  return {
    id: row.id,
    viajeId: row.viaje_id,
    pasajeroId: row.pasajero_id,
    estado: row.estado as EstadoReserva,
    montoSena: Number(row.monto_sena),
    qrToken: row.qr_token,
    politicaCancelacion: parsePolitica(row.politica_cancelacion),
    asientoNum: row.asiento_num,
    recogidaLabel: row.recogida_label ?? null,
    recogidaLat: row.recogida_lat == null ? null : Number(row.recogida_lat),
    recogidaLng: row.recogida_lng == null ? null : Number(row.recogida_lng),
    recogidaPlaceId: row.recogida_place_id ?? null,
    recogidaMode: (row.recogida_mode as PickupMode | null) ?? null,
    createdAt: row.created_at,
  };
}

function mapRpcError(message: string): Error {
  if (message.includes("RESERVA_SIN_ASIENTOS")) {
    return new Error("RESERVA_SIN_ASIENTOS");
  }
  if (message.includes("NO_ENCONTRADO")) {
    return new Error("NO_ENCONTRADO");
  }
  if (message.includes("NO_AUTORIZADO") || message.includes("NO_AUTENTICADO")) {
    return new Error("NO_AUTORIZADO");
  }
  if (message.includes("TRANSICION_INVALIDA")) {
    return new Error("TRANSICION_INVALIDA");
  }
  if (message.includes("RESERVA_POLITICA_INVALIDA")) {
    return new Error("RESERVA_POLITICA_INVALIDA");
  }
  if (message.includes("RECOGIDA_REQUERIDA")) {
    return new Error("RECOGIDA_REQUERIDA");
  }
  if (message.includes("RECOGIDA_FUERA_ZONA")) {
    return new Error("RECOGIDA_FUERA_ZONA");
  }
  if (message.includes("RECOGIDA_INVALIDA")) {
    return new Error("RECOGIDA_INVALIDA");
  }
  if (message.includes("PARADA_ORIGEN_MISSING")) {
    return new Error("PARADA_ORIGEN_MISSING");
  }
  return new Error(message);
}

function mapCancelResult(raw: Json): CancelReservaResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("CANCEL_RESULT_INVALID");
  }
  const obj = raw as Record<string, unknown>;
  const reservaId = String(obj.reserva_id ?? "");
  const viajeId = String(obj.viaje_id ?? "");
  const estado = obj.estado;
  const devolucionPct = Number(obj.devolucion_pct);
  const montoDevolucion = Number(obj.monto_devolucion);
  const canceladaEn = String(obj.cancelada_en ?? "");
  if (
    !reservaId ||
    !viajeId ||
    estado !== "cancelada" ||
    !Number.isFinite(devolucionPct) ||
    !Number.isFinite(montoDevolucion)
  ) {
    throw new Error("CANCEL_RESULT_INVALID");
  }
  return {
    ok: true,
    reservaId,
    viajeId,
    estado: "cancelada",
    devolucionPct,
    montoDevolucion,
    canceladaEn,
  };
}

export function createSupabaseReservasRepository(
  client: Client,
): ReservasRepository {
  return {
    async createForPassenger(
      viajeId: string,
      recogida?: RecogidaInput,
    ): Promise<Reserva> {
      const { data, error } = await client.rpc("crear_reserva", {
        p_viaje_id: viajeId,
        p_recogida_label: recogida?.label ?? null,
        p_recogida_lat: recogida?.lat ?? null,
        p_recogida_lng: recogida?.lng ?? null,
        p_recogida_place_id: recogida?.placeId ?? null,
      });

      if (error) {
        throw mapRpcError(error.message);
      }
      if (!data) {
        throw new Error("RESERVA_CREATE_EMPTY");
      }
      return mapReserva(data as ReservaRow);
    },

    async findByIdForPassenger(
      id: string,
      pasajeroId: string,
    ): Promise<Reserva | null> {
      const { data, error } = await client
        .from("reserva")
        .select("*")
        .eq("id", id)
        .eq("pasajero_id", pasajeroId)
        .maybeSingle();

      if (error) {
        throw new Error(`reservas.findById failed: ${error.message}`);
      }
      if (!data) return null;
      return mapReserva(data);
    },

    async findSummaryByIdForPassenger(
      id: string,
      pasajeroId: string,
    ): Promise<ReservaActivaSummary | null> {
      const { data, error } = await client
        .from("reserva")
        .select(
          `
          *,
          viaje!inner (
            id,
            fecha_salida,
            precio,
            ruta!inner ( origen, destino )
          )
        `,
        )
        .eq("id", id)
        .eq("pasajero_id", pasajeroId)
        .maybeSingle();

      if (error) {
        throw new Error(`reservas.findSummaryById failed: ${error.message}`);
      }
      if (!data) return null;
      return mapSummary(data);
    },

    async findLatestActiveForPassenger(
      pasajeroId: string,
    ): Promise<ReservaActivaSummary | null> {
      const { data, error } = await client
        .from("reserva")
        .select(
          `
          *,
          viaje!inner (
            id,
            fecha_salida,
            precio,
            ruta!inner ( origen, destino )
          )
        `,
        )
        .eq("pasajero_id", pasajeroId)
        .in("estado", [...RESERVA_ESTADOS_OCUPAN])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(
          `reservas.findLatestActive failed: ${error.message}`,
        );
      }
      if (!data) return null;
      return mapSummary(data);
    },

    async findBoardingPass(
      id: string,
      pasajeroId: string,
    ): Promise<BoardingPass | null> {
      const { data, error } = await client
        .from("reserva")
        .select(
          `
          id,
          estado,
          qr_token,
          pasajero_id,
          pasajero:profiles!reserva_pasajero_id_fkey ( nombre, apellido ),
          viaje!inner (
            fecha_salida,
            ruta!inner ( origen, destino ),
            vehiculo!inner ( patente, marca, modelo, color ),
            conductor:profiles!viaje_conductor_id_fkey ( nombre, apellido )
          )
        `,
        )
        .eq("id", id)
        .eq("pasajero_id", pasajeroId)
        .eq("estado", "confirmada")
        .maybeSingle();

      if (error) {
        throw new Error(`reservas.findBoardingPass failed: ${error.message}`);
      }
      if (!data) return null;
      return mapBoardingPass(data);
    },

    async listConfirmedBoardingSummaries(
      pasajeroId: string,
    ): Promise<BoardingPassSummary[]> {
      const { data, error } = await client
        .from("reserva")
        .select(
          `
          id,
          viaje!inner (
            fecha_salida,
            ruta!inner ( origen, destino )
          )
        `,
        )
        .eq("pasajero_id", pasajeroId)
        .eq("estado", "confirmada")
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(
          `reservas.listConfirmedBoardingSummaries failed: ${error.message}`,
        );
      }
      if (!data?.length) return [];

      const items: BoardingPassSummary[] = [];
      for (const row of data) {
        const mapped = mapBoardingSummary(row);
        if (mapped) items.push(mapped);
      }
      items.sort(
        (a, b) =>
          new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime(),
      );
      return items;
    },

    async listForPassenger(pasajeroId: string): Promise<ReservaListItem[]> {
      const { data, error } = await client
        .from("reserva")
        .select(
          `
          id,
          estado,
          monto_sena,
          monto_devolucion,
          politica_cancelacion,
          viaje!inner (
            fecha_salida,
            precio,
            ruta!inner ( origen, destino )
          )
        `,
        )
        .eq("pasajero_id", pasajeroId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`reservas.listForPassenger failed: ${error.message}`);
      }
      if (!data?.length) return [];

      const items: ReservaListItem[] = [];
      for (const row of data) {
        const mapped = mapListItem(row);
        if (mapped) items.push(mapped);
      }
      items.sort(
        (a, b) =>
          new Date(b.fechaSalida).getTime() - new Date(a.fechaSalida).getTime(),
      );
      return items;
    },

    async cancelForPassenger(reservaId: string): Promise<CancelReservaResult> {
      const { data, error } = await client.rpc("cancelar_reserva", {
        p_reserva_id: reservaId,
      });

      if (error) {
        throw mapRpcError(error.message);
      }
      if (data == null) {
        throw new Error("CANCEL_RESULT_EMPTY");
      }
      return mapCancelResult(data as Json);
    },
  };
}

function mapSummary(data: unknown): ReservaActivaSummary | null {
  const row = data as ReservaRow & {
    viaje:
      | {
          fecha_salida: string;
          precio: number;
          ruta:
            | { origen: string; destino: string }
            | { origen: string; destino: string }[];
        }
      | {
          fecha_salida: string;
          precio: number;
          ruta:
            | { origen: string; destino: string }
            | { origen: string; destino: string }[];
        }[];
  };

  const viaje = Array.isArray(row.viaje) ? row.viaje[0] : row.viaje;
  if (!viaje) return null;
  const ruta = Array.isArray(viaje.ruta) ? viaje.ruta[0] : viaje.ruta;
  if (!ruta) return null;

  return {
    reserva: mapReserva(row),
    origen: ruta.origen,
    destino: ruta.destino,
    fechaSalida: viaje.fecha_salida,
    precioViaje: Number(viaje.precio),
  };
}

function mapBoardingPass(data: unknown): BoardingPass | null {
  const row = data as {
    id: string;
    qr_token: string;
    pasajero:
      | { nombre: string; apellido: string | null }
      | { nombre: string; apellido: string | null }[]
      | null;
    viaje:
      | {
          fecha_salida: string;
          ruta:
            | { origen: string; destino: string }
            | { origen: string; destino: string }[]
            | null;
          vehiculo:
            | {
                patente: string;
                marca: string;
                modelo: string;
                color: string;
              }
            | {
                patente: string;
                marca: string;
                modelo: string;
                color: string;
              }[]
            | null;
          conductor:
            | { nombre: string; apellido: string | null }
            | { nombre: string; apellido: string | null }[]
            | null;
        }
      | {
          fecha_salida: string;
          ruta:
            | { origen: string; destino: string }
            | { origen: string; destino: string }[]
            | null;
          vehiculo:
            | {
                patente: string;
                marca: string;
                modelo: string;
                color: string;
              }
            | {
                patente: string;
                marca: string;
                modelo: string;
                color: string;
              }[]
            | null;
          conductor:
            | { nombre: string; apellido: string | null }
            | { nombre: string; apellido: string | null }[]
            | null;
        }[]
      | null;
  };

  const viaje = one(row.viaje);
  if (!viaje) return null;
  const ruta = one(viaje.ruta);
  const vehiculo = one(viaje.vehiculo);
  const conductor = one(viaje.conductor);
  const pasajero = one(row.pasajero);
  if (!ruta || !vehiculo || !conductor || !pasajero) return null;

  return {
    reservaId: row.id,
    qrToken: row.qr_token,
    origen: ruta.origen,
    destino: ruta.destino,
    fechaSalida: viaje.fecha_salida,
    passengerName: fullName(pasajero.nombre, pasajero.apellido),
    conductorName: fullName(conductor.nombre, conductor.apellido),
    vehicleLabel: `${vehiculo.patente} · ${vehiculo.marca} ${vehiculo.modelo} · ${vehiculo.color}`,
  };
}

function mapBoardingSummary(data: unknown): BoardingPassSummary | null {
  const row = data as {
    id: string;
    viaje:
      | {
          fecha_salida: string;
          ruta:
            | { origen: string; destino: string }
            | { origen: string; destino: string }[]
            | null;
        }
      | {
          fecha_salida: string;
          ruta:
            | { origen: string; destino: string }
            | { origen: string; destino: string }[]
            | null;
        }[]
      | null;
  };

  const viaje = one(row.viaje);
  if (!viaje) return null;
  const ruta = one(viaje.ruta);
  if (!ruta) return null;

  return {
    reservaId: row.id,
    origen: ruta.origen,
    destino: ruta.destino,
    fechaSalida: viaje.fecha_salida,
  };
}

function mapListItem(data: unknown): ReservaListItem | null {
  const row = data as {
    id: string;
    estado: string;
    monto_sena: number | string;
    monto_devolucion?: number | string | null;
    politica_cancelacion?: Json;
    viaje:
      | {
          fecha_salida: string;
          precio: number | string;
          ruta:
            | { origen: string; destino: string }
            | { origen: string; destino: string }[]
            | null;
        }
      | {
          fecha_salida: string;
          precio: number | string;
          ruta:
            | { origen: string; destino: string }
            | { origen: string; destino: string }[]
            | null;
        }[]
      | null;
  };

  const viaje = one(row.viaje);
  if (!viaje) return null;
  const ruta = one(viaje.ruta);
  if (!ruta) return null;

  let politicaCancelacion: PoliticaCancelacionSnapshot | undefined;
  if (row.politica_cancelacion != null) {
    try {
      politicaCancelacion = parsePolitica(row.politica_cancelacion);
    } catch {
      politicaCancelacion = undefined;
    }
  }

  const montoDev =
    row.monto_devolucion == null ? undefined : Number(row.monto_devolucion);

  return {
    reservaId: row.id,
    estado: row.estado as EstadoReserva,
    origen: ruta.origen,
    destino: ruta.destino,
    fechaSalida: viaje.fecha_salida,
    montoSena: Number(row.monto_sena),
    precioViaje: Number(viaje.precio),
    politicaCancelacion,
    montoDevolucion:
      montoDev != null && Number.isFinite(montoDev) && montoDev > 0
        ? montoDev
        : undefined,
  };
}

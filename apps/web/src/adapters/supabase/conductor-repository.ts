/**
 * Supabase adapter for ConductorRepository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapVerifyErrorMessage,
  type CompleteTripResult,
  type ConductorPassengerRow,
  type ConductorRepository,
  type ConductorTripDetail,
  type ConductorTripSummary,
  type ConductorVehiculoRow,
  type CrearVehiculoPropioInput,
  type CrearVehiculoPropioResult,
  type MarkNoShowResult,
  type PickupContext,
  type RegisterSaldoResult,
  type SaldoContext,
  type VerifyQrResult,
} from "@/domain/conductor";
import {
  computeSaldo,
  mapSaldoErrorMessage,
  type MetodoPago,
} from "@/domain/pagos";
import type { EstadoReserva } from "@/domain/reservas";
import type { Database, EstadoViaje, Json } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

const OCCUPYING: EstadoReserva[] = [
  "pendiente_sena",
  "confirmada",
  "verificada",
  "abordada",
];

const LISTABLE: EstadoReserva[] = [
  "confirmada",
  "verificada",
  "abordada",
];

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function fullName(nombre: string, apellido: string | null | undefined): string {
  return [nombre, apellido].filter(Boolean).join(" ").trim();
}

function mapRpcError(message: string): Error {
  if (message.includes("QR_YA_VERIFICADO")) return new Error("QR_YA_VERIFICADO");
  if (message.includes("QR_INVALIDO")) return new Error("QR_INVALIDO");
  if (message.includes("NO_ENCONTRADO")) return new Error("NO_ENCONTRADO");
  if (message.includes("NO_AUTORIZADO") || message.includes("NO_AUTENTICADO")) {
    return new Error("NO_AUTORIZADO");
  }
  if (message.includes("TRANSICION_INVALIDA")) {
    return new Error("TRANSICION_INVALIDA");
  }
  if (message.includes("PENDIENTES_ACTIVOS")) {
    return new Error("PENDIENTES_ACTIVOS");
  }
  if (message.includes("YA_NO_SHOW")) return new Error("YA_NO_SHOW");
  if (message.includes("ESTADO_INVALIDO")) return new Error("ESTADO_INVALIDO");
  const saldo = mapSaldoErrorMessage(message);
  if (
    saldo !== "SALDO_INVALIDO" ||
    message.includes("SALDO_INVALIDO") ||
    message.includes("YA_ABORDADA") ||
    message.includes("RESERVA_NO_VERIFICADA") ||
    message.includes("SALDO_YA_REGISTRADO") ||
    message.includes("METODO_INVALIDO")
  ) {
    return new Error(saldo);
  }
  return new Error(message);
}

export function createSupabaseConductorRepository(
  client: Client,
): ConductorRepository {
  return {
    async listTripsForConductor(
      conductorId: string,
    ): Promise<ConductorTripSummary[]> {
      const start = startOfLocalDayIso();
      const { data, error } = await client
        .from("viaje")
        .select(
          `
          id,
          fecha_salida,
          estado,
          ruta!inner ( origen, destino ),
          vehiculo!inner ( patente, marca, modelo, color, capacidad )
        `,
        )
        .eq("conductor_id", conductorId)
        .in("estado", ["programado", "recogida", "en_curso"])
        .gte("fecha_salida", start)
        .order("fecha_salida", { ascending: true })
        .limit(10);

      if (error) {
        throw new Error(`conductor.listTrips failed: ${error.message}`);
      }
      if (!data?.length) return [];

      const items: ConductorTripSummary[] = [];
      for (const row of data) {
        const mapped = await mapTripSummary(
          client,
          row as unknown as TripRow,
        );
        if (mapped) items.push(mapped);
      }
      return items;
    },

    async getTripForConductor(
      viajeId: string,
      conductorId: string,
      options?: { isOperador?: boolean },
    ): Promise<ConductorTripDetail | null> {
      const { data, error } = await client
        .from("viaje")
        .select(
          `
          id,
          fecha_salida,
          estado,
          conductor_id,
          ruta!inner ( origen, destino ),
          vehiculo!inner ( patente, marca, modelo, color, capacidad )
        `,
        )
        .eq("id", viajeId)
        .maybeSingle();

      if (error) {
        throw new Error(`conductor.getTrip failed: ${error.message}`);
      }
      if (!data) return null;

      const typed = data as unknown as TripRow & { conductor_id: string };
      if (!options?.isOperador && typed.conductor_id !== conductorId) {
        return null;
      }

      const summary = await mapTripSummary(client, typed);
      if (!summary) return null;

      const passengers = await listPassengers(client, viajeId, summary.origen);
      return { ...summary, passengers };
    },

    async startPickup(viajeId: string): Promise<void> {
      const { error } = await client.rpc("iniciar_recogida", {
        p_viaje_id: viajeId,
      });
      if (error) throw mapRpcError(error.message);
    },

    async verifyQr(viajeId: string, qrToken: string): Promise<VerifyQrResult> {
      const { data, error } = await client.rpc("verificar_reserva_qr", {
        p_viaje_id: viajeId,
        p_qr_token: qrToken,
      });

      if (error) {
        return { ok: false, code: mapVerifyErrorMessage(error.message) };
      }

      const payload = data as Json;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return { ok: false, code: "QR_INVALIDO" };
      }
      const obj = payload as Record<string, unknown>;
      if (obj.ok !== true) return { ok: false, code: "QR_INVALIDO" };

      return {
        ok: true,
        reservaId: String(obj.reserva_id ?? ""),
        pasajeroNombre: String(obj.pasajero_nombre ?? ""),
        origen: String(obj.origen ?? ""),
        destino: String(obj.destino ?? ""),
        fechaSalida: String(obj.fecha_salida ?? ""),
        estado: "verificada",
      };
    },

    async getSaldoContext(
      viajeId: string,
      reservaId: string,
      conductorId: string,
      options?: { isOperador?: boolean },
    ): Promise<SaldoContext | null> {
      const { data, error } = await client
        .from("reserva")
        .select(
          `
          id,
          estado,
          monto_sena,
          pasajero:profiles!reserva_pasajero_id_fkey ( nombre, apellido ),
          viaje!inner (
            id,
            fecha_salida,
            precio,
            conductor_id,
            ruta!inner ( origen, destino )
          )
        `,
        )
        .eq("id", reservaId)
        .eq("viaje_id", viajeId)
        .eq("estado", "verificada")
        .maybeSingle();

      if (error) {
        throw new Error(`conductor.getSaldoContext failed: ${error.message}`);
      }
      if (!data) return null;

      const typed = data as unknown as {
        id: string;
        estado: string;
        monto_sena: number;
        pasajero:
          | { nombre: string; apellido: string | null }
          | { nombre: string; apellido: string | null }[]
          | null;
        viaje:
          | {
              id: string;
              fecha_salida: string;
              precio: number;
              conductor_id: string;
              ruta:
                | { origen: string; destino: string }
                | { origen: string; destino: string }[]
                | null;
            }
          | {
              id: string;
              fecha_salida: string;
              precio: number;
              conductor_id: string;
              ruta:
                | { origen: string; destino: string }
                | { origen: string; destino: string }[]
                | null;
            }[]
          | null;
      };

      const viaje = one(typed.viaje);
      if (!viaje) return null;
      if (!options?.isOperador && viaje.conductor_id !== conductorId) {
        return null;
      }
      const ruta = one(viaje.ruta);
      const pax = one(typed.pasajero);
      if (!ruta || !pax) return null;

      const precioViaje = Number(viaje.precio);
      const montoSena = Number(typed.monto_sena);
      return {
        reservaId: typed.id,
        viajeId: viaje.id,
        pasajeroNombre: fullName(pax.nombre, pax.apellido),
        origen: ruta.origen,
        destino: ruta.destino,
        fechaSalida: viaje.fecha_salida,
        precioViaje,
        montoSena,
        saldo: computeSaldo(precioViaje, montoSena),
        estado: "verificada",
      };
    },

    async registerSaldoAndBoard(
      reservaId: string,
      metodo: MetodoPago,
    ): Promise<RegisterSaldoResult> {
      const { data, error } = await client.rpc("registrar_saldo_y_abordar", {
        p_reserva_id: reservaId,
        p_metodo: metodo,
      });
      if (error) throw mapRpcError(error.message);

      const payload = data as Json;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("SALDO_INVALIDO");
      }
      const obj = payload as Record<string, unknown>;
      if (obj.ok !== true) throw new Error("SALDO_INVALIDO");

      const metodoOut = String(obj.metodo ?? metodo);
      return {
        reservaId: String(obj.reserva_id ?? reservaId),
        viajeId: String(obj.viaje_id ?? ""),
        monto: Number(obj.monto ?? 0),
        metodo: (metodoOut === "transferencia" ? "transferencia" : "efectivo"),
        estado: "abordada",
        viajeEstado: String(obj.viaje_estado ?? "recogida") as EstadoViaje,
        pasajeroNombre: String(obj.pasajero_nombre ?? ""),
        origen: String(obj.origen ?? ""),
        destino: String(obj.destino ?? ""),
      };
    },

    async getPickupContext(
      viajeId: string,
      reservaId: string,
      conductorId: string,
      options?: { isOperador?: boolean },
    ): Promise<PickupContext | null> {
      const { data, error } = await client
        .from("reserva")
        .select(
          `
          id,
          estado,
          created_at,
          pasajero:profiles!reserva_pasajero_id_fkey ( nombre, apellido ),
          viaje!inner (
            id,
            fecha_salida,
            conductor_id,
            ruta!inner ( origen, destino )
          )
        `,
        )
        .eq("id", reservaId)
        .eq("viaje_id", viajeId)
        .in("estado", ["confirmada", "verificada"])
        .maybeSingle();

      if (error) {
        throw new Error(`conductor.getPickupContext failed: ${error.message}`);
      }
      if (!data) return null;

      const typed = data as unknown as {
        id: string;
        estado: "confirmada" | "verificada";
        created_at: string;
        pasajero:
          | { nombre: string; apellido: string | null }
          | { nombre: string; apellido: string | null }[]
          | null;
        viaje:
          | {
              id: string;
              fecha_salida: string;
              conductor_id: string;
              ruta:
                | { origen: string; destino: string }
                | { origen: string; destino: string }[]
                | null;
            }
          | {
              id: string;
              fecha_salida: string;
              conductor_id: string;
              ruta:
                | { origen: string; destino: string }
                | { origen: string; destino: string }[]
                | null;
            }[]
          | null;
      };

      const viaje = one(typed.viaje);
      if (!viaje) return null;
      if (!options?.isOperador && viaje.conductor_id !== conductorId) {
        return null;
      }
      const ruta = one(viaje.ruta);
      const pax = one(typed.pasajero);
      if (!ruta || !pax) return null;

      const nextParadaLabel = await findNextPendingParada(
        client,
        viajeId,
        reservaId,
        ruta.origen,
      );

      return {
        reservaId: typed.id,
        viajeId: viaje.id,
        pasajeroNombre: fullName(pax.nombre, pax.apellido),
        origen: ruta.origen,
        destino: ruta.destino,
        fechaSalida: viaje.fecha_salida,
        paradaLabel: ruta.origen,
        nextParadaLabel,
        estado: typed.estado,
      };
    },

    async markNoShow(reservaId: string): Promise<MarkNoShowResult> {
      const { data, error } = await client.rpc("marcar_no_show", {
        p_reserva_id: reservaId,
      });
      if (error) throw mapRpcError(error.message);

      const payload = data as Json;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("ESTADO_INVALIDO");
      }
      const obj = payload as Record<string, unknown>;
      if (obj.ok !== true) throw new Error("ESTADO_INVALIDO");

      return {
        reservaId: String(obj.reserva_id ?? reservaId),
        viajeId: String(obj.viaje_id ?? ""),
        estado: "no_show",
        viajeEstado: String(obj.viaje_estado ?? "recogida") as EstadoViaje,
        pasajeroNombre: String(obj.pasajero_nombre ?? ""),
        origen: String(obj.origen ?? ""),
        destino: String(obj.destino ?? ""),
      };
    },

    async completeTrip(viajeId: string): Promise<CompleteTripResult> {
      const { data, error } = await client.rpc("completar_viaje", {
        p_viaje_id: viajeId,
      });
      if (error) throw mapRpcError(error.message);

      const payload = data as Json;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("TRANSICION_INVALIDA");
      }
      const obj = payload as Record<string, unknown>;
      if (obj.ok !== true) throw new Error("TRANSICION_INVALIDA");

      return {
        ok: true,
        viajeId: String(obj.viaje_id ?? viajeId),
        estado: "completado",
        origen: String(obj.origen ?? ""),
        destino: String(obj.destino ?? ""),
      };
    },

    async listMisVehiculos(
      conductorId: string,
    ): Promise<ConductorVehiculoRow[]> {
      const { data, error } = await client
        .from("vehiculo")
        .select("id, patente, marca, modelo, color, capacidad")
        .eq("conductor_id", conductorId)
        .order("patente", { ascending: true });

      if (error) {
        throw new Error(`conductor.listMisVehiculos failed: ${error.message}`);
      }

      return (data ?? []).map((v) => ({
        id: v.id,
        patente: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        color: v.color,
        capacidad: Number(v.capacidad),
      }));
    },

    async crearVehiculoPropio(
      input: CrearVehiculoPropioInput,
    ): Promise<CrearVehiculoPropioResult> {
      const { data, error } = await client.rpc("crear_vehiculo_propio", {
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
        conductorId: String(obj.conductor_id ?? ""),
        patente: String(obj.patente ?? input.patente),
        capacidad: Number(obj.capacidad ?? input.capacidad),
      };
    },
  };
}

async function findNextPendingParada(
  client: Client,
  viajeId: string,
  currentReservaId: string,
  origenFallback: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("reserva")
    .select("id")
    .eq("viaje_id", viajeId)
    .in("estado", ["confirmada", "verificada"])
    .neq("id", currentReservaId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`conductor.nextPickup failed: ${error.message}`);
  }
  if (!data?.length) return null;
  return origenFallback;
}

function startOfLocalDayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

type TripRow = {
  id: string;
  fecha_salida: string;
  estado: string;
  ruta: { origen: string; destino: string } | { origen: string; destino: string }[] | null;
  vehiculo:
    | {
        patente: string;
        marca: string;
        modelo: string;
        color: string;
        capacidad: number;
      }
    | {
        patente: string;
        marca: string;
        modelo: string;
        color: string;
        capacidad: number;
      }[]
    | null;
};

async function mapTripSummary(
  client: Client,
  row: TripRow,
): Promise<ConductorTripSummary | null> {
  const ruta = one(row.ruta);
  const vehiculo = one(row.vehiculo);
  if (!ruta || !vehiculo) return null;

  const { count, error } = await client
    .from("reserva")
    .select("id", { count: "exact", head: true })
    .eq("viaje_id", row.id)
    .in("estado", OCCUPYING);

  if (error) {
    throw new Error(`conductor.countSeats failed: ${error.message}`);
  }

  return {
    id: row.id,
    origen: ruta.origen,
    destino: ruta.destino,
    fechaSalida: row.fecha_salida,
    estado: row.estado as EstadoViaje,
    asientosOcupados: count ?? 0,
    capacidad: vehiculo.capacidad,
    vehiculoLabel: `${vehiculo.patente} · ${vehiculo.color}`,
  };
}

async function listPassengers(
  client: Client,
  viajeId: string,
  origenFallback: string,
): Promise<ConductorPassengerRow[]> {
  const { data, error } = await client
    .from("reserva")
    .select(
      `
      id,
      estado,
      pasajero:profiles!reserva_pasajero_id_fkey ( nombre, apellido )
    `,
    )
    .eq("viaje_id", viajeId)
    .in("estado", LISTABLE)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`conductor.listPassengers failed: ${error.message}`);
  }
  if (!data?.length) return [];

  return data.map((row) => {
    const typed = row as unknown as {
      id: string;
      estado: EstadoReserva;
      pasajero:
        | { nombre: string; apellido: string | null }
        | { nombre: string; apellido: string | null }[]
        | null;
    };
    const pax = one(typed.pasajero);
    return {
      reservaId: typed.id,
      nombre: pax ? fullName(pax.nombre, pax.apellido) : "Pasajero",
      estado: typed.estado,
      paradaLabel: origenFallback,
    };
  });
}

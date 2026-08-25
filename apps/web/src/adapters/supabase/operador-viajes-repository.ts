import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CancelViajeResult,
  DevolucionPendienteRow,
  MarkRefundResult,
  OperadorViajesRepository,
  ViajeOperadorDetalle,
  ViajeOperadorReservaRow,
  ViajeOperadorRow,
} from "@/domain/operador";
import type { EstadoReserva } from "@/domain/reservas";
import type { EstadoViaje } from "@/domain/viajes";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function conductorLabel(
  c: { nombre: string; apellido: string } | null,
): string {
  if (!c) return "Conductor";
  return [c.nombre, c.apellido].filter(Boolean).join(" ") || "Conductor";
}

export function createOperadorViajesRepository(
  client: Client,
): OperadorViajesRepository {
  return {
    async listViajesProximos(): Promise<ViajeOperadorRow[]> {
      const { data, error } = await client
        .from("viaje")
        .select(
          `
          id,
          fecha_salida,
          estado,
          precio,
          conductor:profiles!viaje_conductor_id_fkey ( nombre, apellido ),
          vehiculo!inner ( patente, capacidad ),
          ruta!inner ( origen, destino ),
          reservas:reserva ( id, estado )
        `,
        )
        .order("fecha_salida", { ascending: true })
        .limit(40);

      if (error) {
        throw new Error(`operador.listViajesProximos failed: ${error.message}`);
      }

      const rows: ViajeOperadorRow[] = [];
      for (const raw of data ?? []) {
        const mapped = mapViajeRow(raw as unknown);
        if (mapped) rows.push(mapped);
      }
      return rows;
    },

    async getViajeDetalle(
      viajeId: string,
    ): Promise<ViajeOperadorDetalle | null> {
      const { data, error } = await client
        .from("viaje")
        .select(
          `
          id,
          fecha_salida,
          estado,
          precio,
          conductor:profiles!viaje_conductor_id_fkey ( nombre, apellido ),
          vehiculo!inner ( patente, capacidad ),
          ruta!inner ( origen, destino ),
          reservas:reserva (
            id,
            estado,
            monto_sena,
            monto_devolucion,
            pasajero:profiles!reserva_pasajero_id_fkey ( nombre, apellido )
          )
        `,
        )
        .eq("id", viajeId)
        .maybeSingle();

      if (error) {
        throw new Error(`operador.getViajeDetalle failed: ${error.message}`);
      }
      if (!data) return null;

      const typed = data as unknown as {
        reservas?: unknown;
      } & Record<string, unknown>;
      const base = mapViajeRow(typed);
      if (!base) return null;

      const list = Array.isArray(typed.reservas) ? typed.reservas : [];
      const reservas: ViajeOperadorReservaRow[] = [];
      for (const r of list) {
        const row = r as {
          id: string;
          estado: string;
          monto_sena: number | string;
          monto_devolucion: number | string | null;
          pasajero:
            | { nombre: string; apellido: string }
            | { nombre: string; apellido: string }[]
            | null;
        };
        const pasajero = one(row.pasajero);
        reservas.push({
          reservaId: row.id,
          estado: row.estado as EstadoReserva,
          pasajeroNombre: conductorLabel(pasajero),
          montoSena: Number(row.monto_sena),
          montoDevolucion:
            row.monto_devolucion == null
              ? null
              : Number(row.monto_devolucion),
        });
      }

      return { ...base, reservas };
    },

    async listDevolucionesPendientes(): Promise<DevolucionPendienteRow[]> {
      const { data, error } = await client
        .from("reserva")
        .select(
          `
          id,
          monto_devolucion,
          cancelada_en,
          pasajero:profiles!reserva_pasajero_id_fkey ( nombre, apellido, telefono ),
          viaje!inner (
            fecha_salida,
            ruta!inner ( origen, destino )
          )
        `,
        )
        .gt("monto_devolucion", 0)
        .is("devolucion_saldada_en", null)
        .order("cancelada_en", { ascending: true, nullsFirst: false });

      if (error) {
        throw new Error(
          `operador.listDevolucionesPendientes failed: ${error.message}`,
        );
      }

      const out: DevolucionPendienteRow[] = [];
      for (const raw of data ?? []) {
        const row = raw as unknown as {
          id: string;
          monto_devolucion: number | string | null;
          cancelada_en: string | null;
          pasajero:
            | { nombre: string; apellido: string; telefono: string | null }
            | {
                nombre: string;
                apellido: string;
                telefono: string | null;
              }[]
            | null;
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
        const pasajero = one(row.pasajero);
        const viaje = one(row.viaje);
        if (!viaje) continue;
        const ruta = one(viaje.ruta);
        if (!ruta) continue;
        const monto = Number(row.monto_devolucion);
        if (!Number.isFinite(monto) || monto <= 0) continue;

        out.push({
          reservaId: row.id,
          montoDevolucion: monto,
          canceladaEn: row.cancelada_en,
          pasajeroNombre: conductorLabel(pasajero),
          pasajeroTelefono: pasajero?.telefono ?? null,
          origen: ruta.origen,
          destino: ruta.destino,
          fechaSalida: viaje.fecha_salida,
        });
      }
      return out;
    },

    async countDevolucionesPendientes(): Promise<number> {
      const { count, error } = await client
        .from("reserva")
        .select("id", { count: "exact", head: true })
        .gt("monto_devolucion", 0)
        .is("devolucion_saldada_en", null);

      if (error) {
        throw new Error(
          `operador.countDevolucionesPendientes failed: ${error.message}`,
        );
      }
      return count ?? 0;
    },

    async cancelarViaje(
      viajeId: string,
      motivo?: string | null,
    ): Promise<CancelViajeResult> {
      const { data, error } = await client.rpc("cancelar_viaje", {
        p_viaje_id: viajeId,
        p_motivo: motivo ?? undefined,
      });
      if (error) throw new Error(error.message);
      const obj = data as {
        ok?: boolean;
        viaje_id?: string;
        estado?: string;
        reservas_canceladas?: number;
        monto_devolucion_total?: number;
      };
      return {
        ok: true,
        viajeId: String(obj.viaje_id ?? viajeId),
        estado: "cancelado",
        reservasCanceladas: Number(obj.reservas_canceladas ?? 0),
        montoDevolucionTotal: Number(obj.monto_devolucion_total ?? 0),
      };
    },

    async marcarDevolucionSaldada(
      reservaId: string,
    ): Promise<MarkRefundResult> {
      const { data, error } = await client.rpc("marcar_devolucion_saldada", {
        p_reserva_id: reservaId,
      });
      if (error) throw new Error(error.message);
      const obj = data as {
        reserva_id?: string;
        saldada_en?: string;
      };
      return {
        ok: true,
        reservaId: String(obj.reserva_id ?? reservaId),
        saldadaEn: String(obj.saldada_en ?? new Date().toISOString()),
      };
    },
  };
}

function mapViajeRow(raw: unknown): ViajeOperadorRow | null {
  const row = raw as {
    id: string;
    fecha_salida: string;
    estado: string;
    precio: number | string;
    conductor:
      | { nombre: string; apellido: string }
      | { nombre: string; apellido: string }[]
      | null;
    vehiculo:
      | { patente: string; capacidad: number }
      | { patente: string; capacidad: number }[]
      | null;
    ruta:
      | { origen: string; destino: string }
      | { origen: string; destino: string }[]
      | null;
    reservas?: { id: string; estado: string }[] | null;
  };

  const conductor = one(row.conductor);
  const vehiculo = one(row.vehiculo);
  const ruta = one(row.ruta);
  if (!ruta || !vehiculo) return null;

  const reservas = Array.isArray(row.reservas) ? row.reservas : [];
  const ocupacion = reservas.filter((r) =>
    ["pendiente_sena", "confirmada", "verificada", "abordada"].includes(
      r.estado,
    ),
  ).length;

  return {
    id: row.id,
    origen: ruta.origen,
    destino: ruta.destino,
    fechaSalida: row.fecha_salida,
    estado: row.estado as EstadoViaje,
    precio: Number(row.precio),
    conductorNombre: conductorLabel(conductor),
    patente: vehiculo.patente,
    ocupacion,
    capacidad: Number(vehiculo.capacidad),
  };
}

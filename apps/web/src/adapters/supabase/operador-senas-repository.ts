/**
 * Operator queue: pending sena payments + resolve via RPC.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export type PendingSenaItem = {
  pagoId: string;
  reservaId: string;
  monto: number;
  comprobantePath: string | null;
  createdAt: string;
  pasajeroNombre: string;
  origen: string;
  destino: string;
  fechaSalida: string;
};

export type SenaReviewDetail = PendingSenaItem & {
  reservaEstado: string;
  pagoEstado: string;
  signedComprobanteUrl: string | null;
  comprobanteIsImage: boolean;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function mapRow(raw: unknown): PendingSenaItem | null {
  const row = raw as {
    id: string;
    reserva_id: string;
    monto: number;
    comprobante: string | null;
    created_at: string;
    reserva:
      | {
          id: string;
          estado: string;
          pasajero_id: string;
          viaje:
            | {
                fecha_salida: string;
                ruta:
                  | { origen: string; destino: string }
                  | { origen: string; destino: string }[];
              }
            | {
                fecha_salida: string;
                ruta:
                  | { origen: string; destino: string }
                  | { origen: string; destino: string }[];
              }[];
          pasajero:
            | { nombre: string; apellido: string }
            | { nombre: string; apellido: string }[];
        }
      | null;
  };

  const reserva = one(row.reserva as never) as {
    id: string;
    estado: string;
    viaje: unknown;
    pasajero: unknown;
  } | null;
  if (!reserva) return null;

  const viaje = one(reserva.viaje as never) as {
    fecha_salida: string;
    ruta: unknown;
  } | null;
  if (!viaje) return null;

  const ruta = one(viaje.ruta as never) as {
    origen: string;
    destino: string;
  } | null;
  if (!ruta) return null;

  const pasajero = one(reserva.pasajero as never) as {
    nombre: string;
    apellido: string;
  } | null;
  const pasajeroNombre = pasajero
    ? [pasajero.nombre, pasajero.apellido].filter(Boolean).join(" ")
    : "Pasajero";

  return {
    pagoId: row.id,
    reservaId: row.reserva_id,
    monto: Number(row.monto),
    comprobantePath: row.comprobante,
    createdAt: row.created_at,
    pasajeroNombre,
    origen: ruta.origen,
    destino: ruta.destino,
    fechaSalida: viaje.fecha_salida,
  };
}

const SELECT_BODY = `
  id,
  reserva_id,
  monto,
  comprobante,
  created_at,
  estado,
  reserva!inner (
    id,
    estado,
    pasajero_id,
    viaje!inner (
      fecha_salida,
      ruta!inner ( origen, destino )
    ),
    pasajero:profiles!reserva_pasajero_id_fkey ( nombre, apellido )
  )
`;

export function createOperadorSenasRepository(client: Client) {
  return {
    async listPendingSenas(): Promise<PendingSenaItem[]> {
      const { data, error } = await client
        .from("pago")
        .select(SELECT_BODY)
        .eq("tipo", "sena")
        .eq("estado", "pendiente")
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`operador.listPendingSenas failed: ${error.message}`);
      }

      return (data ?? [])
        .map((row) => mapRow(row as unknown))
        .filter((x): x is PendingSenaItem => x != null);
    },

    async findForReview(pagoId: string): Promise<SenaReviewDetail | null> {
      const { data, error } = await client
        .from("pago")
        .select(SELECT_BODY)
        .eq("id", pagoId)
        .eq("tipo", "sena")
        .maybeSingle();

      if (error) {
        throw new Error(`operador.findForReview failed: ${error.message}`);
      }
      if (!data) return null;

      const base = mapRow(data as unknown);
      if (!base) return null;

      const estadoPago = (data as { estado: string }).estado;
      const reservaEstado = (
        one((data as { reserva: unknown }).reserva as never) as {
          estado: string;
        } | null
      )?.estado;

      let signedComprobanteUrl: string | null = null;
      let comprobanteIsImage = false;
      const path = base.comprobantePath;
      if (path) {
        comprobanteIsImage = /\.(jpe?g|png|webp)$/i.test(path);
        const { data: signed, error: signErr } = await client.storage
          .from("comprobantes")
          .createSignedUrl(path, 3600);
        if (!signErr && signed?.signedUrl) {
          signedComprobanteUrl = signed.signedUrl;
        }
      }

      return {
        ...base,
        pagoEstado: estadoPago,
        reservaEstado: reservaEstado ?? "pendiente_sena",
        signedComprobanteUrl,
        comprobanteIsImage,
      };
    },

    async resolver(
      pagoId: string,
      accion: "confirmar" | "rechazar",
    ): Promise<{ pagoEstado: string; reservaEstado: string }> {
      const { data, error } = await client.rpc("resolver_sena", {
        p_pago_id: pagoId,
        p_accion: accion,
      });

      if (error) {
        if (error.message.includes("NO_AUTORIZADO")) {
          throw new Error("NO_AUTORIZADO");
        }
        if (error.message.includes("PAGO_NO_PENDIENTE")) {
          throw new Error("PAGO_NO_PENDIENTE");
        }
        if (error.message.includes("NO_ENCONTRADO")) {
          throw new Error("NO_ENCONTRADO");
        }
        if (error.message.includes("TRANSICION_INVALIDA")) {
          throw new Error("TRANSICION_INVALIDA");
        }
        throw new Error(error.message);
      }

      const json = data as {
        pago_estado?: string;
        reserva_estado?: string;
      } | null;

      return {
        pagoEstado: json?.pago_estado ?? "",
        reservaEstado: json?.reserva_estado ?? "",
      };
    },
  };
}

export type OperadorSenasRepository = ReturnType<
  typeof createOperadorSenasRepository
>;

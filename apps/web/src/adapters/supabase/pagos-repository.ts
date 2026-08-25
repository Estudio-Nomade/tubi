/**
 * Supabase adapter for PagosRepository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateSenaInput,
  EstadoPago,
  MetodoPago,
  Pago,
  PagosRepository,
  TipoPago,
} from "@/domain/pagos";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;
type PagoRow = Database["public"]["Tables"]["pago"]["Row"];

function mapPago(row: PagoRow): Pago {
  return {
    id: row.id,
    reservaId: row.reserva_id,
    tipo: row.tipo as TipoPago,
    monto: Number(row.monto),
    metodo: row.metodo as MetodoPago,
    estado: row.estado as EstadoPago,
    comprobante: row.comprobante,
    createdAt: row.created_at,
  };
}

export function createSupabasePagosRepository(client: Client): PagosRepository {
  return {
    async createSena(input: CreateSenaInput): Promise<Pago> {
      const existing = await this.findSenaByReserva(input.reservaId);
      if (existing?.estado === "confirmado") {
        throw new Error("PAGO_YA_CONFIRMADO");
      }
      if (existing?.estado === "pendiente") {
        // Idempotent: already waiting for operator.
        return existing;
      }
      // No row, or last was rechazado → insert new pendiente.

      const { data, error } = await client
        .from("pago")
        .insert({
          reserva_id: input.reservaId,
          tipo: "sena",
          monto: input.monto,
          metodo: "transferencia",
          estado: "pendiente",
          comprobante: input.comprobantePath,
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(`pagos.createSena failed: ${error.message}`);
      }
      return mapPago(data);
    },

    async findSenaByReserva(reservaId: string): Promise<Pago | null> {
      const { data, error } = await client
        .from("pago")
        .select("*")
        .eq("reserva_id", reservaId)
        .eq("tipo", "sena")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(`pagos.findSenaByReserva failed: ${error.message}`);
      }
      if (!data) return null;
      return mapPago(data);
    },
  };
}

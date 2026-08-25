import type { Pago } from "./types";

export type CreateSenaInput = {
  reservaId: string;
  monto: number;
  comprobantePath: string;
};

export interface PagosRepository {
  createSena(input: CreateSenaInput): Promise<Pago>;
  findSenaByReserva(reservaId: string): Promise<Pago | null>;
}

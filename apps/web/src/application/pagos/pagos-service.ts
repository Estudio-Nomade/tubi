import type { CreateSenaInput, Pago, PagosRepository } from "@/domain/pagos";

export function createPagosService(repo: PagosRepository) {
  return {
    registrarSena(input: CreateSenaInput): Promise<Pago> {
      return repo.createSena(input);
    },
    getSenaByReserva(reservaId: string): Promise<Pago | null> {
      return repo.findSenaByReserva(reservaId);
    },
  };
}

export type PagosService = ReturnType<typeof createPagosService>;

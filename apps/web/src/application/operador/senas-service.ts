import type {
  OperadorSenasRepository,
  PendingSenaItem,
  SenaReviewDetail,
} from "@/adapters/supabase/operador-senas-repository";

export function createOperadorSenasService(repo: OperadorSenasRepository) {
  return {
    listPending(): Promise<PendingSenaItem[]> {
      return repo.listPendingSenas();
    },
    getReview(pagoId: string): Promise<SenaReviewDetail | null> {
      return repo.findForReview(pagoId);
    },
    confirmar(pagoId: string) {
      return repo.resolver(pagoId, "confirmar");
    },
    rechazar(pagoId: string) {
      return repo.resolver(pagoId, "rechazar");
    },
  };
}

export type OperadorSenasService = ReturnType<typeof createOperadorSenasService>;

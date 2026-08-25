import type {
  CancelViajeResult,
  DevolucionPendienteRow,
  MarkRefundResult,
  OperadorViajesRepository,
  ViajeOperadorDetalle,
  ViajeOperadorRow,
} from "@/domain/operador";

export function createOperadorViajesService(repo: OperadorViajesRepository) {
  return {
    listViajes(): Promise<ViajeOperadorRow[]> {
      return repo.listViajesProximos();
    },
    getViaje(viajeId: string): Promise<ViajeOperadorDetalle | null> {
      return repo.getViajeDetalle(viajeId);
    },
    listDevoluciones(): Promise<DevolucionPendienteRow[]> {
      return repo.listDevolucionesPendientes();
    },
    countDevoluciones(): Promise<number> {
      return repo.countDevolucionesPendientes();
    },
    cancelarViaje(
      viajeId: string,
      motivo?: string | null,
    ): Promise<CancelViajeResult> {
      return repo.cancelarViaje(viajeId, motivo);
    },
    marcarDevolucionSaldada(reservaId: string): Promise<MarkRefundResult> {
      return repo.marcarDevolucionSaldada(reservaId);
    },
  };
}

export type OperadorViajesService = ReturnType<
  typeof createOperadorViajesService
>;

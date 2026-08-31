import type {
  CancelViajeResult,
  ConductorCatalogoRow,
  CrearViajeInput,
  CrearViajeResult,
  DevolucionPendienteRow,
  MarkRefundResult,
  OperadorViajesRepository,
  RutaCatalogoRow,
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
    listRutas(): Promise<RutaCatalogoRow[]> {
      return repo.listRutas();
    },
    listConductoresConVehiculos(): Promise<ConductorCatalogoRow[]> {
      return repo.listConductoresConVehiculos();
    },
    crearViaje(input: CrearViajeInput): Promise<CrearViajeResult> {
      return repo.crearViaje(input);
    },
  };
}

export type OperadorViajesService = ReturnType<
  typeof createOperadorViajesService
>;

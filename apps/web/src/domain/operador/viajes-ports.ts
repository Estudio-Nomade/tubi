import type {
  CancelViajeResult,
  DevolucionPendienteRow,
  MarkRefundResult,
  ViajeOperadorDetalle,
  ViajeOperadorRow,
} from "./viajes-types";

export interface OperadorViajesRepository {
  listViajesProximos(): Promise<ViajeOperadorRow[]>;
  getViajeDetalle(viajeId: string): Promise<ViajeOperadorDetalle | null>;
  listDevolucionesPendientes(): Promise<DevolucionPendienteRow[]>;
  countDevolucionesPendientes(): Promise<number>;
  cancelarViaje(viajeId: string, motivo?: string | null): Promise<CancelViajeResult>;
  marcarDevolucionSaldada(reservaId: string): Promise<MarkRefundResult>;
}

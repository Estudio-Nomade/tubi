import type {
  CancelViajeResult,
  ConductorCatalogoRow,
  CrearViajeInput,
  CrearViajeResult,
  DevolucionPendienteRow,
  MarkRefundResult,
  RutaCatalogoRow,
  ViajeOperadorDetalle,
  ViajeOperadorRow,
} from "./viajes-types";

export interface OperadorViajesRepository {
  listViajesActivos(): Promise<ViajeOperadorRow[]>;
  listViajesHistorial(): Promise<ViajeOperadorRow[]>;
  /** @deprecated usar listViajesActivos */
  listViajesProximos(): Promise<ViajeOperadorRow[]>;
  getViajeDetalle(viajeId: string): Promise<ViajeOperadorDetalle | null>;
  listDevolucionesPendientes(): Promise<DevolucionPendienteRow[]>;
  countDevolucionesPendientes(): Promise<number>;
  cancelarViaje(viajeId: string, motivo?: string | null): Promise<CancelViajeResult>;
  marcarDevolucionSaldada(reservaId: string): Promise<MarkRefundResult>;
  listRutas(): Promise<RutaCatalogoRow[]>;
  listConductoresConVehiculos(): Promise<ConductorCatalogoRow[]>;
  crearViaje(input: CrearViajeInput): Promise<CrearViajeResult>;
}

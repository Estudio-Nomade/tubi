import type { MetodoPago } from "@/domain/pagos";

import type {
  CompleteTripResult,
  ConductorTripDetail,
  ConductorTripSummary,
  ConductorVehiculoRow,
  CrearVehiculoPropioInput,
  CrearVehiculoPropioResult,
  MarkNoShowResult,
  PickupContext,
  RegisterSaldoResult,
  SaldoContext,
  VerifyQrResult,
} from "./types";

export interface ConductorRepository {
  listTripsForConductor(conductorId: string): Promise<ConductorTripSummary[]>;
  getTripForConductor(
    viajeId: string,
    conductorId: string,
    options?: { isOperador?: boolean },
  ): Promise<ConductorTripDetail | null>;
  listMisVehiculos(conductorId: string): Promise<ConductorVehiculoRow[]>;
  crearVehiculoPropio(
    input: CrearVehiculoPropioInput,
  ): Promise<CrearVehiculoPropioResult>;
  startPickup(viajeId: string): Promise<void>;
  verifyQr(viajeId: string, qrToken: string): Promise<VerifyQrResult>;
  getSaldoContext(
    viajeId: string,
    reservaId: string,
    conductorId: string,
    options?: { isOperador?: boolean },
  ): Promise<SaldoContext | null>;
  registerSaldoAndBoard(
    reservaId: string,
    metodo: MetodoPago,
  ): Promise<RegisterSaldoResult>;
  getPickupContext(
    viajeId: string,
    reservaId: string,
    conductorId: string,
    options?: { isOperador?: boolean },
  ): Promise<PickupContext | null>;
  markNoShow(reservaId: string): Promise<MarkNoShowResult>;
  completeTrip(viajeId: string): Promise<CompleteTripResult>;
}

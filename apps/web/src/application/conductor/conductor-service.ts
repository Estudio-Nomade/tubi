import type {
  CompleteTripResult,
  ConductorRepository,
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
} from "@/domain/conductor";
import type { MetodoPago } from "@/domain/pagos";

export function createConductorService(repo: ConductorRepository) {
  return {
    listTrips(conductorId: string): Promise<ConductorTripSummary[]> {
      return repo.listTripsForConductor(conductorId);
    },
    getTrip(
      viajeId: string,
      conductorId: string,
      options?: { isOperador?: boolean },
    ): Promise<ConductorTripDetail | null> {
      return repo.getTripForConductor(viajeId, conductorId, options);
    },
    startPickup(viajeId: string): Promise<void> {
      return repo.startPickup(viajeId);
    },
    verifyQr(viajeId: string, qrToken: string): Promise<VerifyQrResult> {
      return repo.verifyQr(viajeId, qrToken.trim());
    },
    getSaldoContext(
      viajeId: string,
      reservaId: string,
      conductorId: string,
      options?: { isOperador?: boolean },
    ): Promise<SaldoContext | null> {
      return repo.getSaldoContext(viajeId, reservaId, conductorId, options);
    },
    registerSaldoAndBoard(
      reservaId: string,
      metodo: MetodoPago,
    ): Promise<RegisterSaldoResult> {
      return repo.registerSaldoAndBoard(reservaId, metodo);
    },
    getPickupContext(
      viajeId: string,
      reservaId: string,
      conductorId: string,
      options?: { isOperador?: boolean },
    ): Promise<PickupContext | null> {
      return repo.getPickupContext(viajeId, reservaId, conductorId, options);
    },
    markNoShow(reservaId: string): Promise<MarkNoShowResult> {
      return repo.markNoShow(reservaId);
    },
    completeTrip(viajeId: string): Promise<CompleteTripResult> {
      return repo.completeTrip(viajeId);
    },
    listMisVehiculos(conductorId: string): Promise<ConductorVehiculoRow[]> {
      return repo.listMisVehiculos(conductorId);
    },
    crearVehiculoPropio(
      input: CrearVehiculoPropioInput,
    ): Promise<CrearVehiculoPropioResult> {
      return repo.crearVehiculoPropio(input);
    },
  };
}

export type ConductorService = ReturnType<typeof createConductorService>;

import type {
  ConductorRepository,
  ConductorTripDetail,
  ConductorTripSummary,
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
  };
}

export type ConductorService = ReturnType<typeof createConductorService>;

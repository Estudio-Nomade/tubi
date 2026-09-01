import {
  assertCanViewBoardingPass,
  type BoardingPass,
  type BoardingPassSummary,
  type CancelReservaResult,
  type RecogidaInput,
  type Reserva,
  type ReservaActivaSummary,
  type ReservaListItem,
  type ReservasRepository,
} from "@/domain/reservas";

export function createReservasService(repo: ReservasRepository) {
  return {
    crear(viajeId: string, recogida?: RecogidaInput): Promise<Reserva> {
      return repo.createForPassenger(viajeId, recogida);
    },
    getByIdForPassenger(
      id: string,
      pasajeroId: string,
    ): Promise<Reserva | null> {
      return repo.findByIdForPassenger(id, pasajeroId);
    },
    getSummaryById(
      id: string,
      pasajeroId: string,
    ): Promise<ReservaActivaSummary | null> {
      return repo.findSummaryByIdForPassenger(id, pasajeroId);
    },
    getLatestActive(
      pasajeroId: string,
    ): Promise<ReservaActivaSummary | null> {
      return repo.findLatestActiveForPassenger(pasajeroId);
    },
    async getBoardingPass(
      id: string,
      pasajeroId: string,
    ): Promise<BoardingPass | null> {
      const pass = await repo.findBoardingPass(id, pasajeroId);
      if (!pass) return null;
      assertCanViewBoardingPass(
        { pasajeroId, estado: "confirmada" },
        pasajeroId,
      );
      return pass;
    },
    listConfirmedBoardingSummaries(
      pasajeroId: string,
    ): Promise<BoardingPassSummary[]> {
      return repo.listConfirmedBoardingSummaries(pasajeroId);
    },
    listForPassenger(pasajeroId: string): Promise<ReservaListItem[]> {
      return repo.listForPassenger(pasajeroId);
    },
    async hasConfirmedBoardingPass(pasajeroId: string): Promise<boolean> {
      const list = await repo.listConfirmedBoardingSummaries(pasajeroId);
      return list.length >= 1;
    },
    cancelar(reservaId: string): Promise<CancelReservaResult> {
      return repo.cancelForPassenger(reservaId);
    },
  };
}

export type ReservasService = ReturnType<typeof createReservasService>;

import type {
  BoardingPass,
  BoardingPassSummary,
  CancelReservaResult,
  Reserva,
  ReservaActivaSummary,
  ReservaListItem,
} from "./types";

export interface ReservasRepository {
  /** Atomic create via RPC (capacity + snapshots + qr_token). */
  createForPassenger(viajeId: string): Promise<Reserva>;
  findByIdForPassenger(
    id: string,
    pasajeroId: string,
  ): Promise<Reserva | null>;
  findSummaryByIdForPassenger(
    id: string,
    pasajeroId: string,
  ): Promise<ReservaActivaSummary | null>;
  findLatestActiveForPassenger(
    pasajeroId: string,
  ): Promise<ReservaActivaSummary | null>;
  /** Confirmed boarding pass by reserva id (owner only). */
  findBoardingPass(
    id: string,
    pasajeroId: string,
  ): Promise<BoardingPass | null>;
  /** All confirmed passes for passenger, departure ascending. */
  listConfirmedBoardingSummaries(
    pasajeroId: string,
  ): Promise<BoardingPassSummary[]>;
  /** All reservations for passenger, departure descending. */
  listForPassenger(pasajeroId: string): Promise<ReservaListItem[]>;
  /** Cancel own reserva via RPC (RN-03). */
  cancelForPassenger(reservaId: string): Promise<CancelReservaResult>;
}

export {
  RESERVA_ESTADOS_OCUPAN,
  asientosLibres,
  assertHayCapacidad,
  isEstadoQueOcupaAsiento,
  type ReservaEstadoOcupa,
} from "./capacity";
export {
  assertCanViewBoardingPass,
  canViewBoardingPass,
} from "./boarding";
export {
  buildPoliticaCancelacion,
  readSenaMonto,
  type PoliticaCancelacionSnapshot,
} from "./snapshots";
export type {
  BoardingPass,
  BoardingPassSummary,
  EstadoReserva,
  Reserva,
  ReservaActivaSummary,
} from "./types";
export type { ReservasRepository } from "./ports";
export {
  assertTransitionReserva,
  canTransitionReserva,
} from "./states";

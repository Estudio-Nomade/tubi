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
  assertCanCancelReserva,
  canCancelReserva,
  computeRefundAmount,
  computeRefundPct,
  formatRefundHint,
  previewRefund,
  type RefundPreview,
} from "./cancel";
export {
  buildPoliticaCancelacion,
  readSenaMonto,
  type PoliticaCancelacionSnapshot,
} from "./snapshots";
export type {
  BoardingPass,
  BoardingPassSummary,
  CancelReservaResult,
  EstadoReserva,
  RecogidaInput,
  Reserva,
  ReservaActivaSummary,
  ReservaListItem,
} from "./types";
export type { ReservasRepository } from "./ports";
export {
  assertTransitionReserva,
  canTransitionReserva,
} from "./states";

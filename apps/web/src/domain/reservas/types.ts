import type { PickupMode } from "@/domain/geo";

import type { PoliticaCancelacionSnapshot } from "./snapshots";

export type EstadoReserva =
  | "pendiente_sena"
  | "confirmada"
  | "verificada"
  | "abordada"
  | "cancelada"
  | "no_show";

/** Punto de recogida que el pasajero declara al reservar (solo Tandil libre). */
export type RecogidaInput = {
  label: string;
  lat: number;
  lng: number;
  placeId?: string | null;
};

export type Reserva = {
  id: string;
  viajeId: string;
  pasajeroId: string;
  estado: EstadoReserva;
  montoSena: number;
  qrToken: string;
  politicaCancelacion: PoliticaCancelacionSnapshot;
  asientoNum: number | null;
  recogidaLabel: string | null;
  recogidaLat: number | null;
  recogidaLng: number | null;
  recogidaPlaceId: string | null;
  recogidaMode: PickupMode | null;
  createdAt: string;
};

/** Active booking card for passenger home (joined trip summary). */
export type ReservaActivaSummary = {
  reserva: Reserva;
  origen: string;
  destino: string;
  fechaSalida: string;
  precioViaje: number;
};

/** Confirmed boarding pass for passenger QR screen (joined trip + vehicle). */
export type BoardingPass = {
  reservaId: string;
  qrToken: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  passengerName: string;
  conductorName: string;
  vehicleLabel: string;
};

/** Lightweight row for multi-pass index at /pasajero/pase. */
export type BoardingPassSummary = {
  reservaId: string;
  origen: string;
  destino: string;
  fechaSalida: string;
};

/** Row for passenger reservation list at /pasajero/reservas. */
export type ReservaListItem = {
  reservaId: string;
  estado: EstadoReserva;
  origen: string;
  destino: string;
  fechaSalida: string;
  montoSena: number;
  precioViaje?: number;
  politicaCancelacion?: PoliticaCancelacionSnapshot;
  /** Pending refund amount after cancel (operator settles out-of-band). */
  montoDevolucion?: number;
};

/** Result of cancelar_reserva RPC. */
export type CancelReservaResult = {
  ok: true;
  reservaId: string;
  viajeId: string;
  estado: "cancelada";
  devolucionPct: number;
  montoDevolucion: number;
  canceladaEn: string;
};

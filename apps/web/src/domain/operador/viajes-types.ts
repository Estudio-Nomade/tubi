import type { EstadoReserva } from "@/domain/reservas";
import type { EstadoViaje } from "@/domain/viajes";

export type ViajeOperadorRow = {
  id: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  estado: EstadoViaje;
  precio: number;
  conductorNombre: string;
  patente: string;
  ocupacion: number;
  capacidad: number;
};

export type ViajeOperadorReservaRow = {
  reservaId: string;
  estado: EstadoReserva;
  pasajeroNombre: string;
  montoSena: number;
  montoDevolucion: number | null;
};

export type ViajeOperadorDetalle = ViajeOperadorRow & {
  reservas: ViajeOperadorReservaRow[];
};

export type DevolucionPendienteRow = {
  reservaId: string;
  montoDevolucion: number;
  canceladaEn: string | null;
  pasajeroNombre: string;
  pasajeroTelefono: string | null;
  origen: string;
  destino: string;
  fechaSalida: string;
};

export type CancelViajeResult = {
  ok: true;
  viajeId: string;
  estado: "cancelado";
  reservasCanceladas: number;
  montoDevolucionTotal: number;
};

export type MarkRefundResult = {
  ok: true;
  reservaId: string;
  saldadaEn: string;
};

import type { MetodoPago } from "@/domain/pagos";
import type { EstadoReserva } from "@/domain/reservas";
import type { EstadoViaje } from "@/lib/supabase/types";

export type ConductorTripSummary = {
  id: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  estado: EstadoViaje;
  asientosOcupados: number;
  capacidad: number;
  vehiculoLabel: string;
};

export type ConductorPassengerRow = {
  reservaId: string;
  nombre: string;
  estado: EstadoReserva;
  paradaLabel: string;
};

export type ConductorTripDetail = ConductorTripSummary & {
  passengers: ConductorPassengerRow[];
};

export type VerifyQrSuccess = {
  ok: true;
  reservaId: string;
  pasajeroNombre: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  estado: "verificada";
};

export type VerifyQrFailureCode =
  | "QR_INVALIDO"
  | "QR_YA_VERIFICADO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "NO_AUTENTICADO";

export type VerifyQrResult =
  | VerifyQrSuccess
  | { ok: false; code: VerifyQrFailureCode };

export type SaldoContext = {
  reservaId: string;
  viajeId: string;
  pasajeroNombre: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  precioViaje: number;
  montoSena: number;
  saldo: number;
  estado: "verificada";
};

export type RegisterSaldoResult = {
  reservaId: string;
  viajeId: string;
  monto: number;
  metodo: MetodoPago;
  estado: "abordada";
  viajeEstado: EstadoViaje;
  pasajeroNombre: string;
  origen: string;
  destino: string;
};

export type PickupContext = {
  reservaId: string;
  viajeId: string;
  pasajeroNombre: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  paradaLabel: string;
  nextParadaLabel: string | null;
  estado: "confirmada" | "verificada";
};

export type MarkNoShowResult = {
  reservaId: string;
  viajeId: string;
  estado: "no_show";
  viajeEstado: EstadoViaje;
  pasajeroNombre: string;
  origen: string;
  destino: string;
};

export type MarkNoShowFailureCode =
  | "YA_NO_SHOW"
  | "ESTADO_INVALIDO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "NO_AUTENTICADO";

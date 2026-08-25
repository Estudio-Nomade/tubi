export type TipoPago = "sena" | "saldo";
export type MetodoPago = "efectivo" | "transferencia";
export type EstadoPago = "pendiente" | "confirmado" | "rechazado";

export type Pago = {
  id: string;
  reservaId: string;
  tipo: TipoPago;
  monto: number;
  metodo: MetodoPago;
  estado: EstadoPago;
  comprobante: string | null;
  createdAt: string;
};

export type TransferenciaInstrucciones = {
  banco: string;
  alias: string;
  cbu: string;
  titular: string;
};

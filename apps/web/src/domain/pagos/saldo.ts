/** RN-02 — balance due at boarding (pure). */
export function computeSaldo(precioViaje: number, montoSena: number): number {
  return precioViaje - montoSena;
}

export type SaldoErrorCode =
  | "YA_ABORDADA"
  | "RESERVA_NO_VERIFICADA"
  | "SALDO_YA_REGISTRADO"
  | "SALDO_INVALIDO"
  | "METODO_INVALIDO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "NO_AUTENTICADO";

const KNOWN: readonly SaldoErrorCode[] = [
  "YA_ABORDADA",
  "RESERVA_NO_VERIFICADA",
  "SALDO_YA_REGISTRADO",
  "SALDO_INVALIDO",
  "METODO_INVALIDO",
  "NO_AUTORIZADO",
  "NO_ENCONTRADO",
  "NO_AUTENTICADO",
];

export function mapSaldoErrorMessage(message: string): SaldoErrorCode {
  for (const code of KNOWN) {
    if (message.includes(code)) return code;
  }
  return "SALDO_INVALIDO";
}

export function saldoErrorUserMessage(code: SaldoErrorCode): string {
  switch (code) {
    case "YA_ABORDADA":
      return "Este pasajero ya está abordado.";
    case "RESERVA_NO_VERIFICADA":
      return "Primero tenés que escanear el QR del pasajero.";
    case "SALDO_YA_REGISTRADO":
      return "El saldo de esta reserva ya fue registrado.";
    case "METODO_INVALIDO":
      return "Elegí efectivo o transferencia.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para cobrar en este viaje.";
    case "NO_ENCONTRADO":
      return "No encontramos esa reserva.";
    case "NO_AUTENTICADO":
      return "Tenés que iniciar sesión.";
    default:
      return "No se pudo registrar el saldo.";
  }
}

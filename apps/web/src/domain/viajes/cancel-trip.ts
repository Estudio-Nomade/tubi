export type CancelTripErrorCode =
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "TRANSICION_INVALIDA"
  | "UNKNOWN";

export function mapCancelTripErrorMessage(msg: string): CancelTripErrorCode {
  if (msg.includes("NO_AUTENTICADO")) return "NO_AUTENTICADO";
  if (msg.includes("NO_AUTORIZADO")) return "NO_AUTORIZADO";
  if (msg.includes("NO_ENCONTRADO")) return "NO_ENCONTRADO";
  if (msg.includes("TRANSICION_INVALIDA")) return "TRANSICION_INVALIDA";
  return "UNKNOWN";
}

export function cancelTripErrorUserMessage(code: CancelTripErrorCode): string {
  switch (code) {
    case "NO_AUTORIZADO":
      return "No tenés permiso para cancelar este viaje.";
    case "TRANSICION_INVALIDA":
      return "Este viaje no se puede cancelar ahora.";
    case "NO_ENCONTRADO":
      return "No encontramos el viaje.";
    default:
      return "No se pudo cancelar el viaje. Probá de nuevo.";
  }
}

export type MarkRefundErrorCode =
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "SIN_DEVOLUCION"
  | "YA_SALDADA"
  | "UNKNOWN";

export function mapMarkRefundErrorMessage(msg: string): MarkRefundErrorCode {
  if (msg.includes("NO_AUTENTICADO")) return "NO_AUTENTICADO";
  if (msg.includes("NO_AUTORIZADO")) return "NO_AUTORIZADO";
  if (msg.includes("NO_ENCONTRADO")) return "NO_ENCONTRADO";
  if (msg.includes("SIN_DEVOLUCION")) return "SIN_DEVOLUCION";
  if (msg.includes("YA_SALDADA")) return "YA_SALDADA";
  return "UNKNOWN";
}

export function markRefundErrorUserMessage(code: MarkRefundErrorCode): string {
  switch (code) {
    case "NO_AUTORIZADO":
      return "No tenés permiso para marcar esta devolución.";
    case "SIN_DEVOLUCION":
      return "Esta reserva no tiene monto a devolver.";
    case "YA_SALDADA":
      return "Esta devolución ya estaba marcada como transferida.";
    case "NO_ENCONTRADO":
      return "No encontramos esa reserva.";
    default:
      return "No se pudo marcar la devolución. Probá de nuevo.";
  }
}

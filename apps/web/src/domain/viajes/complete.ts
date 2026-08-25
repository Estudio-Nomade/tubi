export type CompleteTripErrorCode =
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "TRANSICION_INVALIDA"
  | "PENDIENTES_ACTIVOS"
  | "UNKNOWN";

export function mapCompleteTripErrorMessage(msg: string): CompleteTripErrorCode {
  if (msg.includes("NO_AUTENTICADO")) return "NO_AUTENTICADO";
  if (msg.includes("NO_AUTORIZADO")) return "NO_AUTORIZADO";
  if (msg.includes("NO_ENCONTRADO")) return "NO_ENCONTRADO";
  if (msg.includes("TRANSICION_INVALIDA")) return "TRANSICION_INVALIDA";
  if (msg.includes("PENDIENTES_ACTIVOS")) return "PENDIENTES_ACTIVOS";
  return "UNKNOWN";
}

export function completeTripErrorUserMessage(
  code: CompleteTripErrorCode,
): string {
  switch (code) {
    case "NO_AUTORIZADO":
      return "No tenés permiso para finalizar este viaje.";
    case "TRANSICION_INVALIDA":
      return "Este viaje no se puede finalizar ahora.";
    case "PENDIENTES_ACTIVOS":
      return "Todavía hay pasajeros pendientes de abordar o verificar.";
    case "NO_ENCONTRADO":
      return "No encontramos el viaje.";
    default:
      return "No se pudo finalizar el viaje.";
  }
}

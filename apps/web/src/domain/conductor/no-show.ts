import type { MarkNoShowFailureCode } from "./types";

const KNOWN: readonly MarkNoShowFailureCode[] = [
  "YA_NO_SHOW",
  "ESTADO_INVALIDO",
  "NO_AUTORIZADO",
  "NO_ENCONTRADO",
  "NO_AUTENTICADO",
];

export function mapNoShowErrorMessage(message: string): MarkNoShowFailureCode {
  for (const code of KNOWN) {
    if (message.includes(code)) return code;
  }
  return "ESTADO_INVALIDO";
}

export function noShowErrorUserMessage(code: MarkNoShowFailureCode): string {
  switch (code) {
    case "YA_NO_SHOW":
      return "Este pasajero ya está marcado como que no llegó.";
    case "ESTADO_INVALIDO":
      return "No se puede marcar que no llegó en este momento.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para esta acción en el viaje.";
    case "NO_ENCONTRADO":
      return "No encontramos esa reserva.";
    case "NO_AUTENTICADO":
      return "Tenés que iniciar sesión.";
    default:
      return "No se pudo marcar que no llegó. Probá de nuevo.";
  }
}

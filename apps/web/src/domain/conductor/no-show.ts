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
      return "Esta reserva ya está marcada como no-show.";
    case "ESTADO_INVALIDO":
      return "Esta reserva no se puede marcar como no-show ahora.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para marcar no-show en este viaje.";
    case "NO_ENCONTRADO":
      return "No encontramos esa reserva.";
    case "NO_AUTENTICADO":
      return "Tenés que iniciar sesión.";
    default:
      return "No se pudo marcar el no-show.";
  }
}

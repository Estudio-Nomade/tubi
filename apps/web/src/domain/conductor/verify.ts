import type { VerifyQrFailureCode } from "./types";

const KNOWN: readonly VerifyQrFailureCode[] = [
  "QR_INVALIDO",
  "QR_YA_VERIFICADO",
  "NO_AUTORIZADO",
  "NO_ENCONTRADO",
  "NO_AUTENTICADO",
];

export function mapVerifyErrorMessage(message: string): VerifyQrFailureCode {
  for (const code of KNOWN) {
    if (message.includes(code)) return code;
  }
  return "QR_INVALIDO";
}

export function verifyErrorUserMessage(code: VerifyQrFailureCode): string {
  switch (code) {
    case "QR_YA_VERIFICADO":
      return "Esta reserva ya fue verificada.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para escanear en este viaje.";
    case "NO_ENCONTRADO":
      return "No encontramos ese viaje.";
    case "NO_AUTENTICADO":
      return "Tenés que iniciar sesión.";
    default:
      return "Esta reserva no corresponde a este viaje, conductor o vehículo. El pasajero no sube.";
  }
}

export type CuponErrorCode =
  | "CUPON_NO_ENCONTRADO"
  | "CUPON_INACTIVO"
  | "CUPON_VENCIDO_CAMPANIA"
  | "CUPON_SIN_CUPOS"
  | "CUPON_YA_CANJEADO"
  | "CUPON_NO_DISPONIBLE"
  | "CUPON_RUTA_INVALIDA"
  | "CUPONES_DESHABILITADOS"
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO";

const KNOWN: readonly CuponErrorCode[] = [
  "CUPON_NO_ENCONTRADO",
  "CUPON_INACTIVO",
  "CUPON_VENCIDO_CAMPANIA",
  "CUPON_SIN_CUPOS",
  "CUPON_YA_CANJEADO",
  "CUPON_NO_DISPONIBLE",
  "CUPON_RUTA_INVALIDA",
  "CUPONES_DESHABILITADOS",
  "NO_AUTENTICADO",
  "NO_AUTORIZADO",
];

export function mapCuponErrorMessage(message: string): CuponErrorCode {
  for (const code of KNOWN) {
    if (message.includes(code)) return code;
  }
  return "CUPON_NO_DISPONIBLE";
}

export function cuponErrorUserMessage(code: CuponErrorCode): string {
  switch (code) {
    case "CUPON_NO_ENCONTRADO":
      return "Ese código no es válido.";
    case "CUPON_INACTIVO":
      return "Ese cupón ya no está activo.";
    case "CUPON_VENCIDO_CAMPANIA":
      return "Ese código ya no está vigente.";
    case "CUPON_SIN_CUPOS":
      return "Se agotaron los cupos de este código.";
    case "CUPON_YA_CANJEADO":
      return "Ya canjeaste este beneficio.";
    case "CUPON_NO_DISPONIBLE":
      return "Ese cupón no se puede usar ahora.";
    case "CUPON_RUTA_INVALIDA":
      return "Ese cupón no aplica a este viaje.";
    case "CUPONES_DESHABILITADOS":
      return "Los cupones no están disponibles por ahora.";
    case "NO_AUTENTICADO":
      return "Tenés que iniciar sesión.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para esta acción.";
    default:
      return "No se pudo procesar el cupón.";
  }
}

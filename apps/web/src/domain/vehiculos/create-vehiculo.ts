export type CreateVehiculoErrorCode =
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "CONDUCTOR_INVALIDO"
  | "PATENTE_DUPLICADA"
  | "PATENTE_INVALIDA"
  | "CAPACIDAD_INVALIDA"
  | "DATOS_INVALIDOS"
  | "UNKNOWN";

export function mapCreateVehiculoErrorMessage(
  msg: string,
): CreateVehiculoErrorCode {
  if (msg.includes("NO_AUTENTICADO")) return "NO_AUTENTICADO";
  if (msg.includes("NO_AUTORIZADO")) return "NO_AUTORIZADO";
  if (msg.includes("CONDUCTOR_INVALIDO")) return "CONDUCTOR_INVALIDO";
  if (msg.includes("PATENTE_DUPLICADA")) return "PATENTE_DUPLICADA";
  if (msg.includes("PATENTE_INVALIDA")) return "PATENTE_INVALIDA";
  if (msg.includes("CAPACIDAD_INVALIDA")) return "CAPACIDAD_INVALIDA";
  if (msg.includes("DATOS_INVALIDOS")) return "DATOS_INVALIDOS";
  return "UNKNOWN";
}

export function createVehiculoErrorUserMessage(
  code: CreateVehiculoErrorCode,
): string {
  switch (code) {
    case "NO_AUTENTICADO":
      return "Tu sesión expiró. Volvé a iniciar sesión.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para registrar vehículos.";
    case "CONDUCTOR_INVALIDO":
      return "Elegí un conductor válido.";
    case "PATENTE_DUPLICADA":
      return "Ya hay un vehículo con esa patente.";
    case "PATENTE_INVALIDA":
      return "Indicá una patente válida.";
    case "CAPACIDAD_INVALIDA":
      return "La capacidad debe ser mayor a 0.";
    case "DATOS_INVALIDOS":
      return "Completá marca, modelo y color.";
    default:
      return "No se pudo registrar el vehículo. Probá de nuevo.";
  }
}

export type CrearVehiculoFormFields = {
  conductorId: string;
  patente: string;
  marca: string;
  modelo: string;
  color: string;
  capacidad: string;
};

export type ParseCrearVehiculoOk = {
  ok: true;
  conductorId: string;
  patente: string;
  marca: string;
  modelo: string;
  color: string;
  capacidad: number;
};

export type ParseCrearVehiculoErr = {
  ok: false;
  error: string;
  fieldErrors?: Partial<Record<keyof CrearVehiculoFormFields, string>>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCrearVehiculoForm(
  fields: CrearVehiculoFormFields,
): ParseCrearVehiculoOk | ParseCrearVehiculoErr {
  const fieldErrors: ParseCrearVehiculoErr["fieldErrors"] = {};

  const conductorId = fields.conductorId.trim();
  const patente = fields.patente.trim();
  const marca = fields.marca.trim();
  const modelo = fields.modelo.trim();
  const color = fields.color.trim();
  const capacidadRaw = fields.capacidad.trim();

  if (!conductorId || !UUID_RE.test(conductorId)) {
    fieldErrors.conductorId = "Elegí un conductor.";
  }
  if (!patente) {
    fieldErrors.patente = "Indicá la patente.";
  }
  if (!marca) {
    fieldErrors.marca = "Indicá la marca.";
  }
  if (!modelo) {
    fieldErrors.modelo = "Indicá el modelo.";
  }
  if (!color) {
    fieldErrors.color = "Indicá el color.";
  }

  let capacidad = 0;
  if (capacidadRaw === "") {
    fieldErrors.capacidad = "Indicá la capacidad.";
  } else {
    const n = Number(capacidadRaw.replace(",", "."));
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      fieldErrors.capacidad = "La capacidad debe ser un número mayor a 0.";
    } else {
      capacidad = n;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Revisá los datos del vehículo.",
      fieldErrors,
    };
  }

  return {
    ok: true,
    conductorId,
    patente,
    marca,
    modelo,
    color,
    capacidad,
  };
}

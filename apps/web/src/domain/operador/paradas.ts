export type ParadaErrorCode =
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "RUTA_NO_ENCONTRADA"
  | "PARADA_NO_ENCONTRADA"
  | "NOMBRE_INVALIDO"
  | "CIUDAD_INVALIDA"
  | "COORDS_INVALIDAS"
  | "PARADA_NO_ELIMINABLE"
  | "ORDEN_INVALIDO"
  | "UNKNOWN";

export function mapParadasErrorMessage(msg: string): ParadaErrorCode {
  if (msg.includes("NO_AUTENTICADO")) return "NO_AUTENTICADO";
  if (msg.includes("NO_AUTORIZADO")) return "NO_AUTORIZADO";
  if (msg.includes("RUTA_NO_ENCONTRADA")) return "RUTA_NO_ENCONTRADA";
  if (msg.includes("PARADA_NO_ENCONTRADA")) return "PARADA_NO_ENCONTRADA";
  if (msg.includes("PARADA_NO_ELIMINABLE")) return "PARADA_NO_ELIMINABLE";
  if (msg.includes("NOMBRE_INVALIDO")) return "NOMBRE_INVALIDO";
  if (msg.includes("CIUDAD_INVALIDA")) return "CIUDAD_INVALIDA";
  if (msg.includes("COORDS_INVALIDAS")) return "COORDS_INVALIDAS";
  if (msg.includes("ORDEN_INVALIDO")) return "ORDEN_INVALIDO";
  return "UNKNOWN";
}

export function paradasErrorUserMessage(code: ParadaErrorCode): string {
  switch (code) {
    case "NO_AUTENTICADO":
      return "Tu sesión expiró. Volvé a iniciar sesión.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para editar paradas.";
    case "RUTA_NO_ENCONTRADA":
      return "No encontramos esa ruta.";
    case "PARADA_NO_ENCONTRADA":
      return "No encontramos esa parada.";
    case "PARADA_NO_ELIMINABLE":
      return "No se puede borrar el origen ni el destino de la ruta.";
    case "NOMBRE_INVALIDO":
      return "Indicá un nombre para la parada.";
    case "CIUDAD_INVALIDA":
      return "Indicá la ciudad de la parada.";
    case "COORDS_INVALIDAS":
      return "Las coordenadas no son válidas.";
    case "ORDEN_INVALIDO":
      return "El orden de las paradas no es válido.";
    default:
      return "No se pudo guardar. Probá de nuevo.";
  }
}

export type ParadaFormFields = {
  nombre: string;
  ciudad: string;
  lat: string;
  lng: string;
};

export type ParseParadaOk = {
  ok: true;
  nombre: string;
  ciudad: string;
  lat: number;
  lng: number;
};

export type ParseParadaErr = {
  ok: false;
  error: string;
  fieldErrors?: Partial<Record<keyof ParadaFormFields, string>>;
};

export function parseParadaForm(fields: ParadaFormFields): ParseParadaOk | ParseParadaErr {
  const fieldErrors: ParseParadaErr["fieldErrors"] = {};
  const nombre = fields.nombre.trim();
  const ciudad = fields.ciudad.trim();
  const latRaw = fields.lat.trim().replace(",", ".");
  const lngRaw = fields.lng.trim().replace(",", ".");

  if (!nombre) fieldErrors.nombre = "Indicá el nombre.";
  if (!ciudad) fieldErrors.ciudad = "Indicá la ciudad.";

  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (latRaw === "" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    fieldErrors.lat = "Latitud inválida (-90 a 90).";
  }
  if (lngRaw === "" || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    fieldErrors.lng = "Longitud inválida (-180 a 180).";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Revisá los datos de la parada.", fieldErrors };
  }

  return { ok: true, nombre, ciudad, lat, lng };
}

/** Devuelve una copia del arreglo con el elemento en `index` movido +/- `delta`. */
export function moveParada<T>(list: T[], index: number, delta: 1 | -1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export type CreateTripErrorCode =
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "RUTA_NO_ENCONTRADA"
  | "CONDUCTOR_INVALIDO"
  | "VEHICULO_INVALIDO"
  | "VEHICULO_NO_DEL_CONDUCTOR"
  | "FECHA_INVALIDA"
  | "PRECIO_INVALIDO"
  | "UNKNOWN";

export function mapCreateTripErrorMessage(msg: string): CreateTripErrorCode {
  if (msg.includes("NO_AUTENTICADO")) return "NO_AUTENTICADO";
  if (msg.includes("NO_AUTORIZADO")) return "NO_AUTORIZADO";
  if (msg.includes("RUTA_NO_ENCONTRADA")) return "RUTA_NO_ENCONTRADA";
  if (msg.includes("CONDUCTOR_INVALIDO")) return "CONDUCTOR_INVALIDO";
  if (msg.includes("VEHICULO_NO_DEL_CONDUCTOR")) return "VEHICULO_NO_DEL_CONDUCTOR";
  if (msg.includes("VEHICULO_INVALIDO")) return "VEHICULO_INVALIDO";
  if (msg.includes("FECHA_INVALIDA")) return "FECHA_INVALIDA";
  if (msg.includes("PRECIO_INVALIDO")) return "PRECIO_INVALIDO";
  return "UNKNOWN";
}

export function createTripErrorUserMessage(code: CreateTripErrorCode): string {
  switch (code) {
    case "NO_AUTENTICADO":
      return "Tu sesión expiró. Volvé a iniciar sesión.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para crear viajes.";
    case "RUTA_NO_ENCONTRADA":
      return "No encontramos esa ruta.";
    case "CONDUCTOR_INVALIDO":
      return "El conductor no es válido.";
    case "VEHICULO_INVALIDO":
      return "El vehículo no es válido.";
    case "VEHICULO_NO_DEL_CONDUCTOR":
      return "Ese vehículo no pertenece al conductor elegido.";
    case "FECHA_INVALIDA":
      return "La fecha y hora de salida no son válidas.";
    case "PRECIO_INVALIDO":
      return "Definí un precio mayor a 0 o la tarifa base en Settings.";
    default:
      return "No se pudo crear el viaje. Probá de nuevo.";
  }
}

export type CrearViajeFormFields = {
  rutaId: string;
  conductorId: string;
  vehiculoId: string;
  fecha: string;
  hora: string;
  precio: string;
};

export type ParseCrearViajeOk = {
  ok: true;
  rutaId: string;
  conductorId: string;
  vehiculoId: string;
  fechaSalidaIso: string;
  precio: number | null;
};

export type ParseCrearViajeErr = {
  ok: false;
  error: string;
  fieldErrors?: Partial<Record<keyof CrearViajeFormFields, string>>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Build local calendar fecha+hora → ISO (same basis as passenger dayBoundsIso). */
export function fechaHoraLocalToIso(fecha: string, hora: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  // Browsers may submit type=time as HH:mm or HH:mm:ss
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) return null;
  const hm = hora.slice(0, 5);
  const [y, m, day] = fecha.split("-").map(Number);
  const [hh, mm] = hm.split(":").map(Number);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hh) ||
    !Number.isFinite(mm)
  ) {
    return null;
  }
  const d = new Date(y, m - 1, day, hh, mm, 0, 0);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== m - 1 ||
    d.getDate() !== day ||
    d.getHours() !== hh ||
    d.getMinutes() !== mm
  ) {
    return null;
  }
  return d.toISOString();
}

export function parseCrearViajeForm(
  fields: CrearViajeFormFields,
): ParseCrearViajeOk | ParseCrearViajeErr {
  const fieldErrors: ParseCrearViajeErr["fieldErrors"] = {};

  const rutaId = fields.rutaId.trim();
  const conductorId = fields.conductorId.trim();
  const vehiculoId = fields.vehiculoId.trim();
  const fecha = fields.fecha.trim();
  const hora = fields.hora.trim();
  const precioRaw = fields.precio.trim();

  if (!rutaId || !UUID_RE.test(rutaId)) {
    fieldErrors.rutaId = "Elegí una ruta.";
  }
  if (!conductorId || !UUID_RE.test(conductorId)) {
    fieldErrors.conductorId = "Elegí un conductor.";
  }
  if (!vehiculoId || !UUID_RE.test(vehiculoId)) {
    fieldErrors.vehiculoId = "Elegí un vehículo.";
  }
  if (!fecha) {
    fieldErrors.fecha = "Indicá la fecha de salida.";
  }
  if (!hora) {
    fieldErrors.hora = "Indicá la hora de salida.";
  }

  const fechaSalidaIso =
    fecha && hora ? fechaHoraLocalToIso(fecha, hora) : null;
  if (fecha && hora && !fechaSalidaIso) {
    fieldErrors.fecha = "Fecha u hora inválida.";
  }

  let precio: number | null = null;
  if (precioRaw !== "") {
    const n = Number(precioRaw.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      fieldErrors.precio = "El precio debe ser mayor a 0.";
    } else {
      precio = n;
    }
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Revisá los datos del viaje.",
      fieldErrors,
    };
  }

  return {
    ok: true,
    rutaId,
    conductorId,
    vehiculoId,
    fechaSalidaIso: fechaSalidaIso as string,
    precio,
  };
}

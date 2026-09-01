"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createOperadorViajesRepository } from "@/adapters/supabase/operador-viajes-repository";
import {
  cancelTripErrorUserMessage,
  mapCancelTripErrorMessage,
  mapMarkRefundErrorMessage,
  markRefundErrorUserMessage,
} from "@/domain/viajes/cancel-trip";
import {
  createTripErrorUserMessage,
  mapCreateTripErrorMessage,
  parseCrearViajeForm,
} from "@/domain/viajes/create-trip";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createOperadorViajesService } from "./viajes-service";

export type ActionError = { error: string };

export type CrearViajeActionResult = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "rutaId" | "conductorId" | "vehiculoId" | "fecha" | "hora" | "precio",
      string
    >
  >;
};

function isNextRedirect(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function cancelarViajeAction(
  viajeId: string,
): Promise<ActionError | void> {
  if (!viajeId) return { error: "Viaje inválido." };

  await requireProfile(["operador"]);
  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );

  try {
    await service.cancelarViaje(viajeId);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCancelTripErrorMessage(msg);
    return { error: cancelTripErrorUserMessage(code) };
  }

  revalidatePath("/operador");
  revalidatePath("/operador/viajes");
  revalidatePath("/operador/viajes/historial");
  revalidatePath(`/operador/viajes/${viajeId}`);
  revalidatePath("/operador/devoluciones");
  revalidatePath("/pasajero");
  revalidatePath("/pasajero/reservas");
  revalidatePath("/conductor");
  redirect(`/operador/viajes/${viajeId}?ok=cancelado`);
}

export async function marcarDevolucionSaldadaAction(
  reservaId: string,
): Promise<ActionError | void> {
  if (!reservaId) return { error: "Reserva inválida." };

  await requireProfile(["operador"]);
  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );

  try {
    await service.marcarDevolucionSaldada(reservaId);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapMarkRefundErrorMessage(msg);
    return { error: markRefundErrorUserMessage(code) };
  }

  revalidatePath("/operador");
  revalidatePath("/operador/devoluciones");
  revalidatePath("/pasajero/reservas");
  redirect("/operador/devoluciones?ok=saldada");
}

export async function crearViajeAction(
  _prev: CrearViajeActionResult | void,
  formData: FormData,
): Promise<CrearViajeActionResult | void> {
  await requireProfile(["operador"]);

  const parsed = parseCrearViajeForm({
    rutaId: formString(formData, "rutaId"),
    conductorId: formString(formData, "conductorId"),
    vehiculoId: formString(formData, "vehiculoId"),
    fecha: formString(formData, "fecha"),
    hora: formString(formData, "hora"),
    precio: formString(formData, "precio"),
  });

  if (!parsed.ok) {
    return {
      error: parsed.error,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );

  let viajeId = "";
  try {
    const result = await service.crearViaje({
      rutaId: parsed.rutaId,
      conductorId: parsed.conductorId,
      vehiculoId: parsed.vehiculoId,
      fechaSalidaIso: parsed.fechaSalidaIso,
      precio: parsed.precio,
    });
    viajeId = result.viajeId;
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCreateTripErrorMessage(msg);
    return { error: createTripErrorUserMessage(code) };
  }

  if (!viajeId) {
    return { error: "No se pudo crear el viaje. Probá de nuevo." };
  }

  revalidatePath("/operador");
  revalidatePath("/operador/viajes");
  revalidatePath(`/operador/viajes/${viajeId}`);
  revalidatePath("/pasajero");
  revalidatePath("/pasajero/buscar");
  revalidatePath("/pasajero/resultados");
  revalidatePath("/conductor");
  redirect(`/operador/viajes/${viajeId}?ok=creado`);
}

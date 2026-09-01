"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createOperadorVehiculosRepository } from "@/adapters/supabase/operador-vehiculos-repository";
import {
  createVehiculoErrorUserMessage,
  mapCreateVehiculoErrorMessage,
  parseCrearVehiculoForm,
} from "@/domain/vehiculos/create-vehiculo";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createOperadorVehiculosService } from "./vehiculos-service";

export type CrearVehiculoActionResult = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "conductorId" | "patente" | "marca" | "modelo" | "color" | "capacidad",
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

export async function crearVehiculoAction(
  _prev: CrearVehiculoActionResult | void,
  formData: FormData,
): Promise<CrearVehiculoActionResult | void> {
  await requireProfile(["operador"]);

  const parsed = parseCrearVehiculoForm({
    conductorId: formString(formData, "conductorId"),
    patente: formString(formData, "patente"),
    marca: formString(formData, "marca"),
    modelo: formString(formData, "modelo"),
    color: formString(formData, "color"),
    capacidad: formString(formData, "capacidad"),
  });

  if (!parsed.ok) {
    return {
      error: parsed.error,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();
  const service = createOperadorVehiculosService(
    createOperadorVehiculosRepository(supabase),
  );

  let vehiculoId = "";
  let conductorId = parsed.conductorId;
  try {
    const result = await service.crearVehiculo({
      conductorId: parsed.conductorId,
      patente: parsed.patente,
      marca: parsed.marca,
      modelo: parsed.modelo,
      color: parsed.color,
      capacidad: parsed.capacidad,
    });
    vehiculoId = result.vehiculoId;
    conductorId = result.conductorId;
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCreateVehiculoErrorMessage(msg);
    return { error: createVehiculoErrorUserMessage(code) };
  }

  if (!vehiculoId) {
    return { error: "No se pudo registrar el vehículo. Probá de nuevo." };
  }

  revalidatePath("/operador");
  revalidatePath("/operador/viajes");
  revalidatePath("/operador/viajes/nuevo");
  revalidatePath("/operador/viajes/vehiculos/nuevo");
  redirect(
    `/operador/viajes/nuevo?conductorId=${conductorId}&vehiculoId=${vehiculoId}`,
  );
}

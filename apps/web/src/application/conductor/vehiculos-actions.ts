"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import {
  createVehiculoErrorUserMessage,
  mapCreateVehiculoErrorMessage,
  parseCrearVehiculoPropioForm,
} from "@/domain/vehiculos/create-vehiculo";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createConductorService } from "./conductor-service";

export type CrearVehiculoPropioActionResult = {
  error?: string;
  fieldErrors?: Partial<
    Record<"patente" | "marca" | "modelo" | "color" | "capacidad", string>
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

export async function crearVehiculoPropioAction(
  _prev: CrearVehiculoPropioActionResult | void,
  formData: FormData,
): Promise<CrearVehiculoPropioActionResult | void> {
  await requireProfile(["conductor"]);

  const parsed = parseCrearVehiculoPropioForm({
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
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );

  let vehiculoId = "";
  try {
    const result = await service.crearVehiculoPropio({
      patente: parsed.patente,
      marca: parsed.marca,
      modelo: parsed.modelo,
      color: parsed.color,
      capacidad: parsed.capacidad,
    });
    vehiculoId = result.vehiculoId;
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCreateVehiculoErrorMessage(msg);
    return { error: createVehiculoErrorUserMessage(code) };
  }

  if (!vehiculoId) {
    return { error: "No se pudo registrar el vehículo. Probá de nuevo." };
  }

  revalidatePath("/conductor");
  revalidatePath("/conductor/vehiculo");
  revalidatePath("/operador");
  revalidatePath("/operador/viajes");
  revalidatePath("/operador/viajes/nuevo");
  redirect("/conductor/vehiculo?ok=creado");
}

export async function actualizarVehiculoPropioAction(
  _prev: CrearVehiculoPropioActionResult | void,
  formData: FormData,
): Promise<CrearVehiculoPropioActionResult | void> {
  await requireProfile(["conductor"]);

  const vehiculoId = formString(formData, "vehiculoId");

  const parsed = parseCrearVehiculoPropioForm({
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
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );

  try {
    await service.actualizarVehiculoPropio({
      vehiculoId,
      patente: parsed.patente,
      marca: parsed.marca,
      modelo: parsed.modelo,
      color: parsed.color,
      capacidad: parsed.capacidad,
    });
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCreateVehiculoErrorMessage(msg);
    return { error: createVehiculoErrorUserMessage(code) };
  }

  revalidatePath("/conductor");
  revalidatePath("/conductor/vehiculo");
  revalidatePath("/operador");
  revalidatePath("/operador/viajes");
  revalidatePath("/operador/viajes/nuevo");
  redirect("/conductor/vehiculo?ok=actualizado");
}

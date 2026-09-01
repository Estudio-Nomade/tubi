"use server";

import { revalidatePath } from "next/cache";

import { createOperadorParadasRepository } from "@/adapters/supabase/operador-paradas-repository";
import {
  mapParadasErrorMessage,
  parseParadaForm,
  paradasErrorUserMessage,
} from "@/domain/operador";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createOperadorParadasService } from "./paradas-service";

export type ParadaActionResult = {
  error?: string;
  fieldErrors?: Partial<Record<"nombre" | "ciudad" | "lat" | "lng", string>>;
};

function revalidateRuta(rutaId: string) {
  revalidatePath("/operador/viajes");
  revalidatePath("/operador/viajes/[id]");
  revalidatePath(`/operador/rutas/${rutaId}/paradas`);
  revalidatePath("/pasajero/viajes/[id]");
  revalidatePath("/pasajero");
  revalidatePath("/pasajero/buscar");
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function actualizarParadaAction(
  _prev: ParadaActionResult | void,
  formData: FormData,
): Promise<ParadaActionResult | void> {
  await requireProfile(["operador"]);

  const paradaId = formString(formData, "paradaId").trim();
  const rutaId = formString(formData, "rutaId").trim();
  const parsed = parseParadaForm({
    nombre: formString(formData, "nombre"),
    ciudad: formString(formData, "ciudad"),
    lat: formString(formData, "lat"),
    lng: formString(formData, "lng"),
  });

  if (!paradaId || !rutaId) {
    return { error: "Faltan datos de la parada." };
  }
  if (!parsed.ok) {
    return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  }

  const supabase = await createClient();
  const service = createOperadorParadasService(
    createOperadorParadasRepository(supabase),
  );

  try {
    await service.actualizarParada({
      paradaId,
      nombre: parsed.nombre,
      ciudad: parsed.ciudad,
      lat: parsed.lat,
      lng: parsed.lng,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return { error: paradasErrorUserMessage(mapParadasErrorMessage(msg)) };
  }

  revalidateRuta(rutaId);
}

export async function crearParadaIntermediaAction(
  _prev: ParadaActionResult | void,
  formData: FormData,
): Promise<ParadaActionResult | void> {
  await requireProfile(["operador"]);

  const rutaId = formString(formData, "rutaId").trim();
  const parsed = parseParadaForm({
    nombre: formString(formData, "nombre"),
    ciudad: formString(formData, "ciudad"),
    lat: formString(formData, "lat"),
    lng: formString(formData, "lng"),
  });

  if (!rutaId) {
    return { error: "Falta la ruta." };
  }
  if (!parsed.ok) {
    return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  }

  const supabase = await createClient();
  const service = createOperadorParadasService(
    createOperadorParadasRepository(supabase),
  );

  try {
    await service.crearParadaIntermedia({
      rutaId,
      nombre: parsed.nombre,
      ciudad: parsed.ciudad,
      lat: parsed.lat,
      lng: parsed.lng,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return { error: paradasErrorUserMessage(mapParadasErrorMessage(msg)) };
  }

  revalidateRuta(rutaId);
}

export async function eliminarParadaIntermediaAction(
  paradaId: string,
  rutaId: string,
): Promise<ParadaActionResult | void> {
  await requireProfile(["operador"]);

  if (!paradaId || !rutaId) {
    return { error: "Faltan datos de la parada." };
  }

  const supabase = await createClient();
  const service = createOperadorParadasService(
    createOperadorParadasRepository(supabase),
  );

  try {
    await service.eliminarParadaIntermedia(paradaId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return { error: paradasErrorUserMessage(mapParadasErrorMessage(msg)) };
  }

  revalidateRuta(rutaId);
}

export async function reordenarParadasAction(
  rutaId: string,
  ids: string[],
): Promise<ParadaActionResult | void> {
  await requireProfile(["operador"]);

  if (!rutaId || !Array.isArray(ids) || ids.length === 0) {
    return { error: "Orden inválido." };
  }

  const supabase = await createClient();
  const service = createOperadorParadasService(
    createOperadorParadasRepository(supabase),
  );

  try {
    await service.reordenarParadas(rutaId, ids);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return { error: paradasErrorUserMessage(mapParadasErrorMessage(msg)) };
  }

  revalidateRuta(rutaId);
}

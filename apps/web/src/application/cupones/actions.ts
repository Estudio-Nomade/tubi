"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseCuponesRepository } from "@/adapters/supabase/cupones-repository";
import {
  cuponErrorUserMessage,
  mapCuponErrorMessage,
  normalizeCuponCodigo,
} from "@/domain/cupones";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createCuponesService } from "./cupones-service";

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

function formNumber(formData: FormData, key: string): number | null {
  const raw = formString(formData, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function canjearCuponAction(
  codigo: string,
): Promise<{ error: string } | { ok: true }> {
  await requireProfile(["pasajero"]);

  const normalized = normalizeCuponCodigo(codigo);
  if (!normalized) {
    return { error: cuponErrorUserMessage("CUPON_NO_ENCONTRADO") };
  }

  const supabase = await createClient();
  const service = createCuponesService(
    createSupabaseCuponesRepository(supabase),
  );

  try {
    await service.canjear(normalized);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCuponErrorMessage(msg);
    return { error: cuponErrorUserMessage(code) };
  }

  revalidatePath("/pasajero/cupones");
  revalidatePath("/pasajero");
  return { ok: true };
}

export type CrearCampaniaActionResult = {
  error?: string;
  ok?: true;
};

export async function crearCampaniaAction(
  formData: FormData,
): Promise<CrearCampaniaActionResult> {
  await requireProfile(["operador"]);

  const codigo = normalizeCuponCodigo(formString(formData, "codigo"));
  const montoDescuento = formNumber(formData, "montoDescuento");
  const cuposRaw = formString(formData, "cuposTotales");
  const cuposTotales =
    cuposRaw === "" ? null : formNumber(formData, "cuposTotales");
  const vigenciaDesde = formString(formData, "vigenciaDesde");
  const vigenciaHasta = formString(formData, "vigenciaHasta");
  const validoDiasPostCanje =
    formNumber(formData, "validoDiasPostCanje") ?? 14;
  const maxPorUsuario = formNumber(formData, "maxPorUsuario") ?? 1;
  const rutaRaw = formString(formData, "rutaId");
  const rutaId = rutaRaw === "" ? null : rutaRaw;

  if (!codigo || montoDescuento == null || montoDescuento <= 0) {
    return { error: "Completá código y monto de descuento válidos." };
  }
  if (!vigenciaDesde || !vigenciaHasta) {
    return { error: "Indicá la vigencia de la campaña." };
  }
  if (cuposTotales != null && cuposTotales <= 0) {
    return { error: "Los cupos totales tienen que ser mayores a cero." };
  }

  const supabase = await createClient();
  const service = createCuponesService(
    createSupabaseCuponesRepository(supabase),
  );

  try {
    await service.crearCampania({
      codigo,
      montoDescuento,
      cuposTotales,
      vigenciaDesde,
      vigenciaHasta,
      validoDiasPostCanje,
      maxPorUsuario,
      rutaId,
    });
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCuponErrorMessage(msg);
    return { error: cuponErrorUserMessage(code) };
  }

  revalidatePath("/operador/cupones");
  revalidatePath("/operador");
  return { ok: true };
}

export async function setCampaniaActivaAction(
  id: string,
  activa: boolean,
): Promise<{ error: string } | { ok: true }> {
  await requireProfile(["operador"]);

  if (!id) {
    return { error: cuponErrorUserMessage("CUPON_NO_ENCONTRADO") };
  }

  const supabase = await createClient();
  const service = createCuponesService(
    createSupabaseCuponesRepository(supabase),
  );

  try {
    await service.setCampaniaActiva(id, activa);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCuponErrorMessage(msg);
    return { error: cuponErrorUserMessage(code) };
  }

  revalidatePath("/operador/cupones");
  revalidatePath("/operador");
  return { ok: true };
}

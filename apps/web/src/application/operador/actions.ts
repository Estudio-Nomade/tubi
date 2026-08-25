"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createOperadorSenasRepository } from "@/adapters/supabase/operador-senas-repository";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createOperadorSenasService } from "./senas-service";

export type ResolveSenaResult = { error: string };

function isNextRedirect(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

async function resolve(
  pagoId: string,
  accion: "confirmar" | "rechazar",
): Promise<ResolveSenaResult | void> {
  if (!pagoId) return { error: "Pago inválido." };

  await requireProfile(["operador"]);
  const supabase = await createClient();
  const service = createOperadorSenasService(
    createOperadorSenasRepository(supabase),
  );

  try {
    await (accion === "confirmar"
      ? service.confirmar(pagoId)
      : service.rechazar(pagoId));
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    if (msg === "PAGO_NO_PENDIENTE") {
      return { error: "Esta seña ya fue resuelta." };
    }
    if (msg === "NO_AUTORIZADO") {
      return { error: "No tenés permiso para esta acción." };
    }
    if (msg === "NO_ENCONTRADO") {
      return { error: "No encontramos ese pago." };
    }
    return { error: "No se pudo resolver la seña." };
  }

  revalidatePath("/operador");
  revalidatePath(`/operador/confirmar/${pagoId}`);
  revalidatePath("/pasajero");
  redirect(
    accion === "confirmar"
      ? "/operador?ok=confirmada"
      : "/operador?ok=rechazada",
  );
}

export async function confirmSenaAction(
  pagoId: string,
): Promise<ResolveSenaResult | void> {
  return resolve(pagoId, "confirmar");
}

export async function rejectSenaAction(
  pagoId: string,
): Promise<ResolveSenaResult | void> {
  return resolve(pagoId, "rechazar");
}

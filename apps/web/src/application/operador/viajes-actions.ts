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
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createOperadorViajesService } from "./viajes-service";

export type ActionError = { error: string };

function isNextRedirect(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
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

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createReservasService } from "./reservas-service";

export type CreateReservaResult = { error: string };
export type CancelReservaActionResult = { error: string };

function isNextRedirect(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function createReservaAction(
  viajeId: string,
): Promise<CreateReservaResult | void> {
  if (!viajeId || typeof viajeId !== "string") {
    return { error: "Ese viaje no es válido." };
  }

  await requireProfile(["pasajero"]);
  const supabase = await createClient();
  const service = createReservasService(
    createSupabaseReservasRepository(supabase),
  );

  try {
    const reserva = await service.crear(viajeId);
    revalidatePath("/pasajero");
    revalidatePath(`/pasajero/viajes/${viajeId}`);
    revalidatePath("/pasajero/resultados");
    redirect(`/pasajero?reserva=${reserva.id}`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;

    const message = err instanceof Error ? err.message : "";
    if (message === "RESERVA_SIN_ASIENTOS") {
      return { error: "No quedan asientos en este viaje." };
    }
    if (message === "NO_ENCONTRADO") {
      return { error: "No encontramos ese viaje." };
    }
    if (message === "TRANSICION_INVALIDA") {
      return { error: "Ese viaje ya no se puede reservar." };
    }
    return { error: "No se pudo crear la reserva. Probá de nuevo." };
  }
}

export async function cancelReservaAction(
  reservaId: string,
): Promise<CancelReservaActionResult | void> {
  if (!reservaId || typeof reservaId !== "string") {
    return { error: "Esa reserva no es válida." };
  }

  await requireProfile(["pasajero"]);
  const supabase = await createClient();
  const service = createReservasService(
    createSupabaseReservasRepository(supabase),
  );

  try {
    await service.cancelar(reservaId);
    revalidatePath("/pasajero");
    revalidatePath("/pasajero/reservas");
    revalidatePath("/pasajero/pase");
    revalidatePath(`/pasajero/pase/${reservaId}`);
    revalidatePath(`/pasajero/reservas/${reservaId}`);
    redirect("/pasajero/reservas?ok=cancelada");
  } catch (err) {
    if (isNextRedirect(err)) throw err;

    const message = err instanceof Error ? err.message : "";
    if (message === "NO_ENCONTRADO") {
      return { error: "No encontramos esa reserva." };
    }
    if (message === "NO_AUTORIZADO") {
      return { error: "No podés cancelar esta reserva." };
    }
    if (message === "TRANSICION_INVALIDA") {
      return { error: "Esta reserva ya no se puede cancelar." };
    }
    return { error: "No se pudo cancelar la reserva. Probá de nuevo." };
  }
}

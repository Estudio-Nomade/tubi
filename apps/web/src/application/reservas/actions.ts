"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createReservasService } from "./reservas-service";

export type CreateReservaResult = { error: string };

export async function createReservaAction(
  viajeId: string,
): Promise<CreateReservaResult | void> {
  if (!viajeId || typeof viajeId !== "string") {
    return { error: "Viaje inválido." };
  }

  await requireProfile(["pasajero", "operador"]);
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
    // Next.js redirect throws; rethrow so navigation works.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }

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
    return { error: "No se pudo crear la reserva." };
  }
}

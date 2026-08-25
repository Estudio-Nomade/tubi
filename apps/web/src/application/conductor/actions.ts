"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import {
  mapNoShowErrorMessage,
  noShowErrorUserMessage,
} from "@/domain/conductor";
import {
  completeTripErrorUserMessage,
  mapCompleteTripErrorMessage,
} from "@/domain/viajes";
import { saldoErrorUserMessage, type MetodoPago } from "@/domain/pagos";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createConductorService } from "./conductor-service";

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

export async function startPickupAction(
  viajeId: string,
): Promise<ActionError | void> {
  if (!viajeId) return { error: "Ese viaje no es válido." };

  await requireProfile(["conductor", "operador"]);
  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );

  try {
    await service.startPickup(viajeId);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NO_AUTORIZADO") {
      return { error: "No tenés permiso para este viaje." };
    }
    if (msg === "TRANSICION_INVALIDA") {
      return { error: "Este viaje no puede iniciar recogida ahora." };
    }
    return { error: "No se pudo iniciar la recogida. Probá de nuevo." };
  }

  revalidatePath("/conductor");
  revalidatePath(`/conductor/viajes/${viajeId}`);
  redirect(`/conductor/viajes/${viajeId}`);
}

export async function verifyQrAction(
  viajeId: string,
  qrToken: string,
): Promise<ActionError | void> {
  if (!viajeId) return { error: "Ese viaje no es válido." };
  const token = qrToken?.trim() ?? "";
  if (!token) return { error: "Ingresá o escaneá el código del pasajero." };

  await requireProfile(["conductor", "operador"]);
  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );

  const result = await service.verifyQr(viajeId, token);

  if (!result.ok) {
    revalidatePath(`/conductor/viajes/${viajeId}`);
    redirect(
      `/conductor/viajes/${viajeId}/escaneo/error?code=${encodeURIComponent(result.code)}`,
    );
  }

  revalidatePath("/conductor");
  revalidatePath(`/conductor/viajes/${viajeId}`);
  const q = new URLSearchParams({
    reserva: result.reservaId,
    nombre: result.pasajeroNombre,
    origen: result.origen,
    destino: result.destino,
    fecha: result.fechaSalida,
  });
  redirect(`/conductor/viajes/${viajeId}/escaneo/ok?${q.toString()}`);
}

export async function registerSaldoAction(
  viajeId: string,
  reservaId: string,
  metodo: string,
): Promise<ActionError | void> {
  if (!viajeId || !reservaId) {
    return { error: "Faltan datos del viaje o la reserva." };
  }
  if (metodo !== "efectivo" && metodo !== "transferencia") {
    return { error: "Elegí efectivo o transferencia." };
  }

  await requireProfile(["conductor", "operador"]);
  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );

  try {
    const result = await service.registerSaldoAndBoard(
      reservaId,
      metodo as MetodoPago,
    );
    revalidatePath("/conductor");
    revalidatePath(`/conductor/viajes/${viajeId}`);
    revalidatePath("/pasajero");
    const q = new URLSearchParams({ ok: "abordada" });
    if (result.viajeEstado === "en_curso") q.set("viaje", "en_curso");
    redirect(`/conductor/viajes/${viajeId}?${q.toString()}`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const known = [
      "YA_ABORDADA",
      "RESERVA_NO_VERIFICADA",
      "SALDO_YA_REGISTRADO",
      "SALDO_INVALIDO",
      "METODO_INVALIDO",
      "NO_AUTORIZADO",
      "NO_ENCONTRADO",
      "NO_AUTENTICADO",
    ] as const;
    for (const code of known) {
      if (msg.includes(code)) {
        return { error: saldoErrorUserMessage(code) };
      }
    }
    return { error: "No se pudo registrar el saldo. Probá de nuevo." };
  }
}

export async function marcarNoShowAction(
  viajeId: string,
  reservaId: string,
): Promise<ActionError | void> {
  if (!viajeId || !reservaId) {
    return { error: "Faltan datos del viaje o la reserva." };
  }

  await requireProfile(["conductor", "operador"]);
  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );

  try {
    const result = await service.markNoShow(reservaId);
    revalidatePath("/conductor");
    revalidatePath(`/conductor/viajes/${viajeId}`);
    revalidatePath("/pasajero");
    const q = new URLSearchParams({ ok: "noshow" });
    if (result.viajeEstado === "en_curso") q.set("viaje", "en_curso");
    redirect(`/conductor/viajes/${viajeId}?${q.toString()}`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapNoShowErrorMessage(msg);
    return { error: noShowErrorUserMessage(code) };
  }
}

export async function completeTripAction(
  viajeId: string,
): Promise<ActionError | void> {
  if (!viajeId) return { error: "Ese viaje no es válido." };

  await requireProfile(["conductor", "operador"]);
  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );

  try {
    await service.completeTrip(viajeId);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCompleteTripErrorMessage(msg);
    return { error: completeTripErrorUserMessage(code) };
  }

  revalidatePath("/conductor");
  revalidatePath(`/conductor/viajes/${viajeId}`);
  redirect(`/conductor/viajes/${viajeId}?ok=completado`);
}

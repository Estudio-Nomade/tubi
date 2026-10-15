"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { enqueueNotification } from "@/application/notifications/enqueue";
import type { RecogidaInput } from "@/domain/reservas";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

export type SolicitarAsientoResult = { error: string };

function isNextRedirect(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function formString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function mapSolicitarError(message: string): string {
  if (message.includes("YA_SOLICITADO")) {
    return "Ya tenés una solicitud en este viaje.";
  }
  if (message.includes("SOLAPAMIENTO")) {
    return "No podés solicitar asiento en tu propio viaje.";
  }
  if (message.includes("RESERVA_SIN_ASIENTOS") || message.includes("SIN_CUPOS")) {
    return "No quedan asientos en este viaje.";
  }
  if (message.includes("RECOGIDA_REQUERIDA")) {
    return "Indicá dónde te buscamos en Tandil.";
  }
  if (message.includes("RECOGIDA_FUERA_ZONA")) {
    return "Ese punto queda fuera de Tandil.";
  }
  if (message.includes("RECOGIDA_INVALIDA")) {
    return "El punto de recogida no es válido.";
  }
  if (message.includes("NO_ENCONTRADO")) {
    return "No encontramos ese viaje.";
  }
  if (message.includes("TRANSICION_INVALIDA")) {
    return "Ese viaje ya no acepta solicitudes.";
  }
  return "No se pudo enviar la solicitud. Probá de nuevo.";
}

/**
 * Passenger requests a seat on a peer trip (does not hold capacity until accept).
 */
export async function solicitarAsientoAction(
  viajeId: string,
  recogida?: RecogidaInput | null,
): Promise<SolicitarAsientoResult | void> {
  if (!viajeId || typeof viajeId !== "string") {
    return { error: "Ese viaje no es válido." };
  }

  await requireProfile(["pasajero"]);
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("solicitar_asiento", {
      p_viaje_id: viajeId,
      p_recogida_label: recogida?.label ?? null,
      p_recogida_lat: recogida?.lat ?? null,
      p_recogida_lng: recogida?.lng ?? null,
      p_recogida_place_id: recogida?.placeId ?? null,
    });

    if (error) {
      return { error: mapSolicitarError(error.message) };
    }

    const reservaId =
      data && typeof data === "object" && "id" in data
        ? String((data as { id: string }).id)
        : null;

    const { data: viaje } = await supabase
      .from("viaje")
      .select("conductor_id")
      .eq("id", viajeId)
      .maybeSingle();

    if (viaje?.conductor_id) {
      await enqueueNotification(supabase, {
        userId: viaje.conductor_id,
        title: "Nueva solicitud",
        body: "Alguien pidió un asiento en tu viaje",
        href: "/conductor/solicitudes",
      });
    }

    revalidatePath("/pasajero");
    revalidatePath("/conductor");
    revalidatePath(`/pasajero/viajes/${viajeId}`);
    if (reservaId) {
      redirect(`/pasajero/reservas/${reservaId}/solicitud`);
    }
    redirect("/pasajero/reservas");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { error: "No se pudo enviar la solicitud. Probá de nuevo." };
  }
}

export async function aceptarSolicitudAction(formData: FormData): Promise<void> {
  await requireProfile(["conductor"]);
  const reservaId = formString(formData, "reservaId");
  if (!reservaId) redirect("/conductor/solicitudes");

  const supabase = await createClient();
  const { error } = await supabase.rpc("aceptar_solicitud", {
    p_reserva_id: reservaId,
  });

  if (error) {
    redirect(
      `/conductor/solicitudes?error=${encodeURIComponent(error.message)}`,
    );
  }

  const { data: res } = await supabase
    .from("reserva")
    .select("pasajero_id, viaje_id")
    .eq("id", reservaId)
    .maybeSingle();

  if (res?.pasajero_id) {
    await enqueueNotification(supabase, {
      userId: res.pasajero_id,
      title: "Te aceptaron",
      body: "Pagá la seña para confirmar tu lugar",
      href: `/pasajero/reservas/${reservaId}/sena`,
    });
  }

  revalidatePath("/conductor");
  revalidatePath("/pasajero");
  redirect("/conductor/solicitudes?ok=1");
}

export async function rechazarSolicitudAction(formData: FormData): Promise<void> {
  await requireProfile(["conductor"]);
  const reservaId = formString(formData, "reservaId");
  if (!reservaId) redirect("/conductor/solicitudes");

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("reserva")
    .select("pasajero_id")
    .eq("id", reservaId)
    .maybeSingle();

  const { error } = await supabase.rpc("rechazar_solicitud", {
    p_reserva_id: reservaId,
  });

  if (error) {
    redirect(
      `/conductor/solicitudes?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (before?.pasajero_id) {
    await enqueueNotification(supabase, {
      userId: before.pasajero_id,
      title: "Solicitud rechazada",
      body: "El conductor no pudo aceptarte en este viaje",
      href: "/pasajero",
    });
  }

  revalidatePath("/conductor");
  revalidatePath("/pasajero");
  redirect("/conductor/solicitudes");
}

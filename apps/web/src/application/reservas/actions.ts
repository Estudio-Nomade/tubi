"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPhotonGeocoder } from "@/adapters/photon/photon-geocoder";
import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import {
  isWithinBbox,
  isValidManualAddress,
  TANDIL_BBOX,
  TANDIL_CENTER,
} from "@/domain/geo";
import type { RecogidaInput } from "@/domain/reservas";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createReservasService } from "./reservas-service";

export type CreateReservaResult = { error: string };
export type CancelReservaActionResult = { error: string };

export type ResolvePickupResult =
  | { ok: true; recogida: RecogidaInput; aproximada: boolean }
  | { ok: false; error: string };

/**
 * Resuelve una dirección manual (calle + altura) a coords para recogida Tandil.
 * Preferido: 1er hit de Photon dentro del bbox del partido. Si no hay hit (o
 * Photon cae), último recurso documentado: coords = centro de Tandil + label
 * "texto, Tandil" (placeId null), para no bloquear la reserva por geocoding.
 */
export async function resolvePickupAddressAction(
  label: string,
): Promise<ResolvePickupResult> {
  const text = (label ?? "").trim();
  if (!isValidManualAddress(text)) {
    return {
      ok: false,
      error: "Escribí calle y altura (ej: San Martín 454).",
    };
  }

  await requireProfile(["pasajero"]);

  const geocoder = createPhotonGeocoder();
  const result = await geocoder.search({
    query: text,
    bias: { lat: TANDIL_CENTER.lat, lon: TANDIL_CENTER.lng, bbox: TANDIL_BBOX },
  });

  if (result.error === null) {
    const hit = result.results.find((r) => isWithinBbox(r.lat, r.lng));
    if (hit) {
      return {
        ok: true,
        recogida: {
          label: hit.label,
          lat: hit.lat,
          lng: hit.lng,
          placeId: hit.placeId,
        },
        aproximada: false,
      };
    }
  }

  return {
    ok: true,
    recogida: {
      label: `${text}, Tandil`,
      lat: TANDIL_CENTER.lat,
      lng: TANDIL_CENTER.lng,
      placeId: null,
    },
    aproximada: true,
  };
}

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
  recogida?: RecogidaInput,
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
    const reserva = await service.crear(viajeId, recogida);
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
    if (message === "RECOGIDA_REQUERIDA") {
      return { error: "Indicá dónde te buscamos en Tandil." };
    }
    if (message === "RECOGIDA_FUERA_ZONA") {
      return { error: "Ese punto queda fuera de Tandil. Elegí uno dentro de la zona." };
    }
    if (message === "RECOGIDA_INVALIDA") {
      return { error: "El punto de recogida no es válido." };
    }
    if (message === "PARADA_ORIGEN_MISSING") {
      return { error: "Esta ruta no tiene punto de recogida definido. Avisá al operador." };
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

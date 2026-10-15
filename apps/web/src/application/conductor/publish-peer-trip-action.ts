"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canDrive } from "@/domain/auth";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

export type PublishPeerResult = { error?: string };

function formString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Peer publishes a trip (marketplace.enabled + KYC verified).
 */
export async function publishPeerTripAction(
  formData: FormData,
): Promise<void> {
  const profile = await requireProfile({ area: "drive" });
  if (!canDrive(profile)) {
    redirect("/conductor/kyc");
  }

  const rutaId = formString(formData, "rutaId");
  const vehiculoId = formString(formData, "vehiculoId");
  const fecha = formString(formData, "fecha");
  const hora = formString(formData, "hora");
  const precioRaw = formString(formData, "precio");

  if (!rutaId || !vehiculoId || !fecha || !hora || !precioRaw) {
    redirect("/conductor/publicar?error=" + encodeURIComponent("Completá todos los campos"));
  }

  const precio = Number(precioRaw.replace(",", "."));
  if (!Number.isFinite(precio) || precio <= 0) {
    redirect("/conductor/publicar?error=" + encodeURIComponent("Precio inválido"));
  }

  const fechaSalida = new Date(`${fecha}T${hora}:00`);
  if (Number.isNaN(fechaSalida.getTime())) {
    redirect("/conductor/publicar?error=" + encodeURIComponent("Fecha u hora inválida"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publicar_viaje_peer", {
    p_ruta_id: rutaId,
    p_vehiculo_id: vehiculoId,
    p_fecha_salida: fechaSalida.toISOString(),
    p_precio: precio,
    p_eta_llegada: null,
  });

  if (error) {
    const msg = error.message.includes("MARKETPLACE_DISABLED")
      ? "El marketplace peer aún no está habilitado"
      : error.message.includes("CONDUCTOR_NO_VERIFICADO")
        ? "Completá la verificación de identidad"
        : error.message;
    redirect("/conductor/publicar?error=" + encodeURIComponent(msg));
  }

  const id =
    data && typeof data === "object" && "id" in data
      ? String((data as { id: string }).id)
      : null;

  revalidatePath("/conductor");
  revalidatePath("/pasajero");
  if (id) redirect(`/conductor/viajes/${id}`);
  redirect("/conductor");
}

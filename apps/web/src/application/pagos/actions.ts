"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabasePagosRepository } from "@/adapters/supabase/pagos-repository";
import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { createReservasService } from "@/application/reservas";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

import { createPagosService } from "./pagos-service";

export type SubmitSenaResult = { error: string };

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function isNextRedirect(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "jpg";
  }
}

export async function submitSenaComprobanteAction(
  formData: FormData,
): Promise<SubmitSenaResult | void> {
  const profile = await requireProfile(["pasajero"]);
  const reservaId = String(formData.get("reserva_id") ?? "").trim();
  const file = formData.get("comprobante");

  if (!reservaId) {
    return { error: "Esa reserva no es válida." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Subí una foto o PDF del comprobante." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "El archivo no puede superar 5 MB." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Formato no permitido. Usá JPG, PNG, WebP o PDF." };
  }

  const supabase = await createClient();
  const reservas = createReservasService(
    createSupabaseReservasRepository(supabase),
  );
  const pagos = createPagosService(createSupabasePagosRepository(supabase));

  const reserva = await reservas.getByIdForPassenger(reservaId, profile.id);
  if (!reserva) {
    return { error: "No encontramos esa reserva." };
  }
  if (reserva.estado !== "pendiente_sena") {
    return { error: "Esta reserva ya no acepta comprobante de seña." };
  }

  const existing = await pagos.getSenaByReserva(reservaId);
  if (existing?.estado === "pendiente" || existing?.estado === "confirmado") {
    redirect(`/pasajero/reservas/${reservaId}/en-revision`);
  }

  const ext = extFromMime(file.type);
  const path = `${profile.id}/${reservaId}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("comprobantes")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: "No se pudo subir el comprobante. Probá de nuevo." };
  }

  try {
    await pagos.registrarSena({
      reservaId,
      monto: reserva.montoSena,
      comprobantePath: path,
    });
  } catch {
    return { error: "No se pudo registrar el pago. Probá de nuevo." };
  }

  revalidatePath("/pasajero");
  revalidatePath(`/pasajero/reservas/${reservaId}/sena`);
  revalidatePath(`/pasajero/reservas/${reservaId}/en-revision`);

  try {
    redirect(`/pasajero/reservas/${reservaId}/en-revision`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    throw err;
  }
}

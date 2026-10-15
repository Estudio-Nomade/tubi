"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

export async function ensureChatThreadAction(
  reservaId: string,
): Promise<{ threadId?: string; error?: string }> {
  await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ensure_chat_thread", {
    p_reserva_id: reservaId,
  });
  if (error) {
    return { error: error.message };
  }
  return { threadId: data ? String(data) : undefined };
}

export async function sendChatMessageAction(formData: FormData): Promise<void> {
  await requireProfile();
  const threadId =
    typeof formData.get("threadId") === "string"
      ? String(formData.get("threadId"))
      : "";
  const body =
    typeof formData.get("body") === "string" ? String(formData.get("body")) : "";
  const reservaId =
    typeof formData.get("reservaId") === "string"
      ? String(formData.get("reservaId"))
      : "";

  if (!threadId || !body.trim()) return;

  const supabase = await createClient();
  await supabase.rpc("enviar_mensaje_chat", {
    p_thread_id: threadId,
    p_body: body.trim(),
  });

  revalidatePath(`/pasajero/reservas/${reservaId}/chat`);
  revalidatePath(`/conductor/reservas/${reservaId}/chat`);
}

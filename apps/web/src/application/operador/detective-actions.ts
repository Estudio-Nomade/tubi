"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

function formString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function resolveDetectiveSignalAction(
  formData: FormData,
): Promise<void> {
  await requireProfile({ area: "operate" });
  const id = formString(formData, "signalId");
  const status = formString(formData, "status");
  if (!id || !status) redirect("/operador/detective");

  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_detective_signal", {
    p_signal_id: id,
    p_status: status,
  });

  if (error) {
    redirect(
      `/operador/detective?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/operador/detective");
  redirect("/operador/detective?ok=1");
}

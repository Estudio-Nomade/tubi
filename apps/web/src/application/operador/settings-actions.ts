"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseSettingsRepository } from "@/adapters/supabase/settings-repository";
import { createSettingsService } from "@/application/settings";
import {
  EDITABLE_SETTING_KEYS,
  type SettingUpdateInput,
} from "@/domain/settings";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

export type UpdateSettingsResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function isNextRedirect(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function parseFormData(formData: FormData): SettingUpdateInput[] {
  const inputs: SettingUpdateInput[] = [];
  for (const clave of EDITABLE_SETTING_KEYS) {
    if (clave === "feature.ratings_habilitado") {
      const raw = formData.get(clave);
      inputs.push({
        clave,
        valor: raw === "on" || raw === "true" || raw === "1",
      });
      continue;
    }
    if (!formData.has(clave)) continue;
    const raw = formData.get(clave);
    if (typeof raw !== "string") continue;
    inputs.push({ clave, valor: raw });
  }
  return inputs;
}

export async function updateOperadorSettingsAction(
  _prev: UpdateSettingsResult | void,
  formData: FormData,
): Promise<UpdateSettingsResult | void> {
  const profile = await requireProfile(["operador"]);
  const inputs = parseFormData(formData);

  if (inputs.length === 0) {
    return { error: "No hay cambios para guardar." };
  }

  const supabase = await createClient();
  const service = createSettingsService(
    createSupabaseSettingsRepository(supabase),
  );

  try {
    await service.updateMany(inputs, profile.id);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("SETTING_INVALID:")) {
      const parts = msg.split(":");
      const clave = parts[1] ?? "";
      const detail = parts.slice(2).join(":") || "Valor inválido.";
      return {
        error: detail,
        fieldErrors: clave ? { [clave]: detail } : undefined,
      };
    }
    if (msg.includes("failed:")) {
      return { error: "No se pudieron guardar los cambios. Probá de nuevo." };
    }
    return { error: "No se pudieron guardar los cambios." };
  }

  revalidatePath("/operador/settings");
  revalidatePath("/operador");
  revalidatePath("/pasajero");
  redirect("/operador/settings?ok=1");
}

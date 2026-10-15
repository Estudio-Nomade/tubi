import { completeManualKycAction } from "@/application/identity/start-kyc-action";
import { AppHeader, AppShell, BtnPrimary } from "@/components/design";
import { requireProfile } from "@/lib/auth/require-profile";
import { redirect } from "next/navigation";

/**
 * Manual IdentityVerifier completion (local/dev when Didit envs absent).
 */
export default async function ManualKycCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; token?: string }>;
}) {
  const profile = await requireProfile({ allowKycOnboarding: true });
  const sp = await searchParams;
  if (sp.uid && sp.uid !== profile.id) {
    redirect("/conductor/kyc?error=token+inválido");
  }

  return (
    <AppShell>
      <AppHeader showBack backHref="/conductor/kyc" roleLabel="Conductor" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
        <h1 className="font-heading text-[28px] font-semibold text-foreground">
          Completar verificación (dev)
        </h1>
        <p className="text-sm text-muted-foreground">
          Solo disponible sin Didit configurado. Confirma la identidad en local
          para probar el modo Conducir.
        </p>
        <form
          action={async () => {
            "use server";
            await completeManualKycAction(profile.id);
          }}
        >
          <BtnPrimary type="submit">Marcar como verificado</BtnPrimary>
        </form>
      </div>
    </AppShell>
  );
}

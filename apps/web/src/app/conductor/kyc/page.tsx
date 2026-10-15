import { AppHeader, AppShell, BtnPrimary } from "@/components/design";
import { startDriverKycAction } from "@/application/identity/start-kyc-action";
import { isDiditConfigured } from "@/adapters/identity/create-identity-verifier";
import { requireProfile } from "@/lib/auth/require-profile";
import { canDrive, driverKycStatusLabel } from "@/domain/auth";
import { redirect } from "next/navigation";

/**
 * Driver KYC funnel — Didit hosted session when configured,
 * manual complete path for local/dev without keys.
 */
export default async function ConductorKycPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireProfile({ allowKycOnboarding: true });
  if (canDrive(profile)) {
    redirect("/conductor");
  }

  const sp = await searchParams;
  const didit = isDiditConfigured();

  return (
    <AppShell>
      <AppHeader showBack backHref="/pasajero" roleLabel="Conductor" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
        <h1 className="font-heading text-[28px] font-semibold text-foreground">
          Verificá tu identidad
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Para ofrecer viajes o ser asignado a un viaje Operado por Tubi tenés que
          completar la verificación de identidad.
        </p>
        <p className="text-sm text-muted-foreground">
          Estado:{" "}
          <span className="font-semibold text-foreground">
            {driverKycStatusLabel(profile.driverKycStatus)}
          </span>
        </p>
        {!didit ? (
          <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            Didit no está configurado en este entorno (faltan{" "}
            <code className="text-xs">DIDIT_API_KEY</code> /{" "}
            <code className="text-xs">DIDIT_WORKFLOW_ID</code>). Se usa el flujo
            manual de desarrollo.
          </p>
        ) : null}
        {sp.error ? (
          <p className="text-sm text-destructive" role="alert">
            {sp.error}
          </p>
        ) : null}
        <form action={startDriverKycAction}>
          <BtnPrimary type="submit">
            {didit ? "Continuar con Didit" : "Continuar (modo manual)"}
          </BtnPrimary>
        </form>
      </div>
    </AppShell>
  );
}

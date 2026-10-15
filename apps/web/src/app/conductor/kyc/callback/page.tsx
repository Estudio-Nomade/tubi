import Link from "next/link";

import { AppHeader, AppShell, BtnPrimary, BtnSecondary } from "@/components/design";
import { requireProfile } from "@/lib/auth/require-profile";
import { canDrive } from "@/domain/auth";

/**
 * Return URL after Didit hosted flow. Webhook is source of truth;
 * this page just reflects current profile state.
 */
export default async function ConductorKycCallbackPage() {
  const profile = await requireProfile({ allowKycOnboarding: true });
  const ok = canDrive(profile);

  return (
    <AppShell>
      <AppHeader showBack backHref="/pasajero" roleLabel="Conductor" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
        <h1 className="font-heading text-[28px] font-semibold text-foreground">
          {ok ? "Listo" : "Estamos revisando"}
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          {ok
            ? "Tu identidad quedó verificada. Ya podés usar el modo Conducir."
            : "Si terminaste el flujo, el resultado llega en segundos. Si sigue pendiente, esperá o reintentá más tarde."}
        </p>
        <p className="text-sm text-muted-foreground">
          Estado:{" "}
          <span className="font-semibold text-foreground">
            {profile.driverKycStatus}
          </span>
        </p>
        {ok ? (
          <BtnPrimary asChild>
            <Link href="/conductor">Ir a Conducir</Link>
          </BtnPrimary>
        ) : (
          <>
            <BtnPrimary asChild>
              <Link href="/conductor/kyc">Volver a verificación</Link>
            </BtnPrimary>
            <BtnSecondary asChild>
              <Link href="/pasajero">Viajar</Link>
            </BtnSecondary>
          </>
        )}
      </div>
    </AppShell>
  );
}

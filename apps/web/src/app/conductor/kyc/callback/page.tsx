import { headers } from "next/headers";
import Link from "next/link";

import { AppHeader, AppShell, BtnPrimary, BtnSecondary } from "@/components/design";
import { syncDriverKycFromProvider } from "@/application/identity/sync-kyc-from-provider";
import { canDrive, driverKycStatusLabel } from "@/domain/auth";
import { requireProfile } from "@/lib/auth/require-profile";

function appOriginFromHeaders(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

/**
 * Return URL after Didit hosted flow.
 * Webhook is the async source of truth; we also poll Didit decision here so
 * approval applies immediately without waiting for the webhook or a human.
 */
export default async function ConductorKycCallbackPage() {
  let profile = await requireProfile({ allowKycOnboarding: true });

  if (!canDrive(profile)) {
    const h = await headers();
    await syncDriverKycFromProvider({
      userId: profile.id,
      appOrigin: appOriginFromHeaders(h),
    });
    profile = await requireProfile({ allowKycOnboarding: true });
  }

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
            : "Didit está procesando el resultado. Si ya terminaste el flujo, refrescá en unos segundos."}
        </p>
        <p className="text-sm text-muted-foreground">
          Estado:{" "}
          <span className="font-semibold text-foreground">
            {driverKycStatusLabel(profile.driverKycStatus)}
          </span>
        </p>
        {ok ? (
          <BtnPrimary asChild>
            <Link href="/conductor">Ir a Conducir</Link>
          </BtnPrimary>
        ) : (
          <>
            <BtnPrimary asChild>
              <Link href="/conductor/kyc/callback">Actualizar estado</Link>
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

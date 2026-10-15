import Link from "next/link";

import { AppHeader, AppShell, BtnPrimary } from "@/components/design";
import { requireProfile } from "@/lib/auth/require-profile";

/**
 * Fase 0 placeholder — real Didit funnel is Fase 1.
 * ModeSwitch comes from conductor layout. Reachable without verified KYC.
 */
export default async function ConductorKycPlaceholderPage() {
  const profile = await requireProfile({ allowKycOnboarding: true });

  return (
    <AppShell>
      <AppHeader showBack backHref="/pasajero" roleLabel="Conductor" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
        <h1 className="font-heading text-[28px] font-semibold text-foreground">
          Verificá tu identidad
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Para ofrecer viajes o manejar como conductor en Tubi necesitás completar
          la verificación (Didit). Pronto vas a poder hacerlo acá. Las keys Didit
          las configurás vos en el entorno.
        </p>
        <p className="text-sm text-muted-foreground">
          Estado actual:{" "}
          <span className="font-semibold text-foreground">
            {profile.driverKycStatus}
          </span>
        </p>
        <BtnPrimary asChild>
          <Link href="/pasajero">Volver a Viajar</Link>
        </BtnPrimary>
      </div>
    </AppShell>
  );
}

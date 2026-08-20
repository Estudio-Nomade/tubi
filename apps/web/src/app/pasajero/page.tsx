import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";
import { AppHeader, BtnPrimary } from "@/components/design";

export default async function PasajeroPage() {
  const profile = await requireProfile(["pasajero", "operador"]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[375px] flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Hola, {profile.nombre}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Tu próximo viaje
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Todavía no tenés un viaje
          </p>
        </div>

        <BtnPrimary disabled title="Próximamente">
          Buscar viaje
        </BtnPrimary>

        <Link
          href="/cuenta"
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Tu cuenta
        </Link>
      </main>
    </div>
  );
}

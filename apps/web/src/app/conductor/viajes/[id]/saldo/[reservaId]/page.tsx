import { notFound } from "next/navigation";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import { createConductorService } from "@/application/conductor";
import { SaldoForm } from "@/components/conductor/saldo-form";
import { AppHeader } from "@/components/design";
import { formatArs } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string; reservaId: string }>;
};

/** Pencil C7 · Cobrar saldo */
export default async function ConductorSaldoPage({ params }: PageProps) {
  const profile = await requireProfile(["conductor", "operador"]);
  const { id: viajeId, reservaId } = await params;

  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );
  const ctx = await service.getSaldoContext(viajeId, reservaId, profile.id, {
    isOperador: profile.rol === "operador",
  });
  if (!ctx) notFound();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader
        showBack
        backHref={`/conductor/viajes/${viajeId}`}
        roleLabel="Conductor"
      />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Cobrar saldo
          </h1>
          <p className="text-base font-semibold text-foreground">
            {ctx.pasajeroNombre}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1.5 py-4">
          <p className="font-heading text-[40px] font-semibold tabular-nums leading-none text-foreground">
            {formatArs(ctx.saldo)}
          </p>
          <p className="text-[13px] font-medium text-muted-foreground">
            Saldo al subir · viaje − seña
          </p>
          <p className="text-xs font-medium text-muted-foreground/80">
            Viaje {formatArs(ctx.precioViaje)} · seña {formatArs(ctx.montoSena)}
          </p>
        </div>

        <div className="mt-auto flex w-full flex-col">
          <SaldoForm viajeId={viajeId} reservaId={reservaId} />
        </div>
      </main>
    </div>
  );
}

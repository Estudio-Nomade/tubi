import { notFound } from "next/navigation";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import { createConductorService } from "@/application/conductor";
import { getSetting } from "@/application/settings";
import { PickupActions } from "@/components/conductor/pickup-actions";
import { AppHeader } from "@/components/design";
import { mapsLink } from "@/domain/geo";
import { SETTING_KEYS } from "@/domain/settings";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string; reservaId: string }>;
};

function readEsperaMaxMin(valor: unknown): number {
  if (typeof valor === "number" && Number.isFinite(valor) && valor >= 0) {
    return valor;
  }
  if (typeof valor === "string") {
    const n = Number(valor);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  throw new Error(`SETTING_INVALID:${SETTING_KEYS.RESERVA_ESPERA_MAX_MIN}`);
}

/** Pencil C5 · Recogida — wait timer + scan + no-show. */
export default async function ConductorRecogidaPage({ params }: PageProps) {
  const profile = await requireProfile(["conductor", "operador"]);
  const { id: viajeId, reservaId } = await params;

  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );
  const ctx = await service.getPickupContext(viajeId, reservaId, profile.id, {
    isOperador: profile.rol === "operador",
  });
  if (!ctx) notFound();

  const setting = await getSetting(SETTING_KEYS.RESERVA_ESPERA_MAX_MIN);
  if (!setting) {
    throw new Error(`SETTING_MISSING:${SETTING_KEYS.RESERVA_ESPERA_MAX_MIN}`);
  }
  const esperaMaxMin = readEsperaMaxMin(setting.valor);
  const esperaLabel =
    esperaMaxMin === 1 ? "1 min" : `${esperaMaxMin} min`;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader
        showBack
        backHref={`/conductor/viajes/${viajeId}`}
        roleLabel="Conductor"
      />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[22px] font-semibold text-foreground">
            {ctx.recogidaLabel ?? ctx.paradaLabel}
          </h1>
          <p className="text-base font-semibold text-foreground">
            {ctx.pasajeroNombre}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Espera máxima {esperaLabel}. Si no llega, no-show y seguís.
          </p>
          {ctx.recogidaLat != null && ctx.recogidaLng != null ? (
            <a
              href={mapsLink(ctx.recogidaLat, ctx.recogidaLng)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Cómo llegar
            </a>
          ) : null}
        </div>

        <PickupActions
          viajeId={viajeId}
          reservaId={reservaId}
          esperaMaxMin={esperaMaxMin}
          nextParadaLabel={ctx.nextParadaLabel}
        />
      </main>
    </div>
  );
}

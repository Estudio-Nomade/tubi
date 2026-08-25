import { notFound, redirect } from "next/navigation";

import { createSupabasePagosRepository } from "@/adapters/supabase/pagos-repository";
import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { createPagosService } from "@/application/pagos";
import { createReservasService } from "@/application/reservas";
import { getSettingsService } from "@/application/settings";
import {
  AppHeader,
  ProgressDots,
} from "@/components/design";
import { CheckoutSenaForm } from "@/components/pasajero/checkout-sena-form";
import { readTransferenciaInstrucciones } from "@/domain/pagos";
import { formatArs } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import type { Setting } from "@/domain/settings";

type PageProps = {
  params: Promise<{ id: string }>;
};

function settingsToMap(items: Setting[]): Map<string, Setting> {
  return new Map(items.map((s) => [s.clave, s]));
}

/** Pencil P6 · Checkout seña */
export default async function CheckoutSenaPage({ params }: PageProps) {
  const profile = await requireProfile(["pasajero", "operador"]);
  const { id } = await params;

  const supabase = await createClient();
  const reservas = createReservasService(
    createSupabaseReservasRepository(supabase),
  );
  const pagos = createPagosService(createSupabasePagosRepository(supabase));

  const reserva = await reservas.getByIdForPassenger(id, profile.id);
  if (!reserva) notFound();
  if (reserva.estado !== "pendiente_sena") {
    redirect("/pasajero");
  }

  const senaPago = await pagos.getSenaByReserva(id);
  // Allow checkout if never sent or last sena was rejected (reenvío).
  if (senaPago?.estado === "pendiente" || senaPago?.estado === "confirmado") {
    redirect(`/pasajero/reservas/${id}/en-revision`);
  }

  const settingsService = await getSettingsService();
  const settingsMap = settingsToMap(await settingsService.getSettings());
  const transfer = readTransferenciaInstrucciones(settingsMap);

  const rows: Array<{ label: string; value: string }> = [
    { label: "Banco", value: transfer.banco },
    { label: "Alias", value: transfer.alias },
    { label: "CBU", value: transfer.cbu },
    { label: "Titular", value: transfer.titular },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/pasajero" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-2">
        <ProgressDots step={2} total={3} />

        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Seña de compromiso
          </h1>
          <p className="font-heading text-[40px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
            {formatArs(reserva.montoSena)}
          </p>
          <p className="text-xs font-normal text-muted-foreground">
            según settings · snapshot de tu reserva
          </p>
        </div>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3"
            >
              <span className="shrink-0 text-[13px] font-normal text-muted-foreground">
                {row.label}
              </span>
              <span className="min-w-0 text-right text-sm font-medium break-all text-foreground">
                {row.value}
              </span>
            </div>
          ))}
        </section>

        <p className="text-sm font-normal leading-relaxed text-muted-foreground">
          Transferí la seña y subí el comprobante. Te confirmamos a mano.
        </p>

        <div className="mt-auto">
          <CheckoutSenaForm reservaId={reserva.id} />
        </div>
      </main>
    </div>
  );
}

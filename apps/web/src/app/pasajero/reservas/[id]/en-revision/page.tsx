import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createSupabasePagosRepository } from "@/adapters/supabase/pagos-repository";
import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { createPagosService } from "@/application/pagos";
import { createReservasService } from "@/application/reservas";
import {
  AppHeader,
  BtnPrimary,
  StatusPill,
} from "@/components/design";
import { formatArs, formatFechaHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Pencil P11 · Seña en revisión */
export default async function SenaEnRevisionPage({ params }: PageProps) {
  const profile = await requireProfile(["pasajero", "operador"]);
  const { id } = await params;

  const supabase = await createClient();
  const reservas = createReservasService(
    createSupabaseReservasRepository(supabase),
  );
  const pagos = createPagosService(createSupabasePagosRepository(supabase));

  const summary = await reservas.getSummaryById(id, profile.id);
  if (!summary) notFound();

  const sena = await pagos.getSenaByReserva(id);
  if (!sena) {
    redirect(`/pasajero/reservas/${id}/sena`);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/pasajero" />
      <main className="flex flex-1 flex-col items-center gap-5 px-5 pb-8 pt-4">
        <StatusPill label="En revisión" variant="pending" />

        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-heading text-[26px] font-semibold leading-tight text-foreground">
            Tu seña está en revisión
          </h1>
          <p className="text-sm font-normal text-muted-foreground">
            Recibimos el comprobante. Te confirmamos a mano en cuanto lo
            revisemos.
          </p>
        </div>

        <section className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <p className="font-heading text-xl font-semibold text-foreground">
            {summary.origen} → {summary.destino}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {formatFechaHoraAr(summary.fechaSalida)}
          </p>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-sm font-medium text-muted-foreground">
              Seña enviada
            </span>
            <span className="font-heading text-[28px] font-semibold tabular-nums leading-none text-foreground">
              {formatArs(sena.monto)}
            </span>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Confirmación estimada: según operación del equipo.
          </p>
        </section>

        <div className="mt-auto flex w-full flex-col gap-3">
          <BtnPrimary asChild>
            <Link href="/pasajero">Ir al inicio</Link>
          </BtnPrimary>
          <p className="text-center text-xs font-medium text-muted-foreground">
            Te avisamos cuando esté confirmada y tengas el QR.
          </p>
        </div>
      </main>
    </div>
  );
}

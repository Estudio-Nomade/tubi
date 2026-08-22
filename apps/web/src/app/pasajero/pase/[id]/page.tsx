import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { createReservasService } from "@/application/reservas";
import { QRPass, TabBar } from "@/components/design";
import { formatFechaHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Pencil P8 · Tu pase + QRPass (no cancel on confirmed). */
export default async function PasajeroPaseDetallePage({ params }: PageProps) {
  const profile = await requireProfile(["pasajero", "operador"]);
  const { id } = await params;

  const supabase = await createClient();
  const reservas = createReservasService(
    createSupabaseReservasRepository(supabase),
  );
  const pass = await reservas.getBoardingPass(id, profile.id);
  if (!pass) notFound();

  const metaLine = `${formatFechaHoraAr(pass.fechaSalida)} · ${pass.passengerName}`;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <header className="flex items-center gap-3 bg-background px-5 pb-2 pt-4">
        <Link
          href="/pasajero"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors hover:bg-muted/80"
          aria-label="Volver"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Tu pase
        </h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-5 pb-6 pt-3">
        <QRPass
          route={`${pass.origen} → ${pass.destino}`}
          metaLine={metaLine}
          qrToken={pass.qrToken}
          conductorName={pass.conductorName}
          vehicleLabel={pass.vehicleLabel}
        />
      </main>

      <TabBar variant="pasajero" active="qr" />
    </div>
  );
}

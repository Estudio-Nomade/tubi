import { notFound } from "next/navigation";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import { createConductorService } from "@/application/conductor";
import { QrScanner } from "@/components/conductor/qr-scanner";
import { AppHeader } from "@/components/design";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Pencil C6 · Escanear QR */
export default async function ConductorEscanearPage({ params }: PageProps) {
  const profile = await requireProfile(["conductor", "operador"]);
  const { id } = await params;

  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );
  const trip = await service.getTrip(id, profile.id, {
    isOperador: profile.rol === "operador",
  });
  if (!trip) notFound();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader
        showBack
        backHref={`/conductor/viajes/${id}`}
        roleLabel="Conductor"
      />
      <main className="flex flex-1 flex-col px-5 pb-6 pt-2">
        <QrScanner viajeId={id} />
      </main>
    </div>
  );
}

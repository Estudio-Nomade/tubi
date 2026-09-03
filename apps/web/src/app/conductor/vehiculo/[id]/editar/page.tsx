import { redirect } from "next/navigation";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import { createConductorService } from "@/application/conductor";
import { AppHeader, TabBar } from "@/components/design";
import { EditarVehiculoPropioForm } from "@/components/conductor/editar-vehiculo-propio-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConductorEditarVehiculoPage({
  params,
}: PageProps) {
  const { id } = await params;
  const profile = await requireProfile(["conductor"]);

  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );
  const vehiculos = await service.listMisVehiculos(profile.id);
  const vehiculo = vehiculos.find((v) => v.id === id);

  if (!vehiculo) {
    redirect("/conductor/vehiculo");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/conductor/vehiculo" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Editar vehículo
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {vehiculo.patente}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <EditarVehiculoPropioForm vehiculo={vehiculo} />
        </div>

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="conductor" active="cuenta" />
    </div>
  );
}

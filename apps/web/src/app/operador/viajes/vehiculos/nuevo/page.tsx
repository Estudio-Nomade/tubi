import { createOperadorViajesRepository } from "@/adapters/supabase/operador-viajes-repository";
import { createOperadorViajesService } from "@/application/operador";
import { AppHeader, TabBar } from "@/components/design";
import { CrearVehiculoForm } from "@/components/operador/crear-vehiculo-form";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperadorNuevoVehiculoPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const conductorId =
    typeof params.conductorId === "string" ? params.conductorId : undefined;

  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );
  const conductores = await service.listConductoresConVehiculos();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/operador/viajes/nuevo" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Nuevo vehículo
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Registrá el vehículo de un conductor para poder asignarle viajes.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <CrearVehiculoForm
            conductores={conductores}
            initialConductorId={conductorId}
          />
        </div>

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="operador" active="viajes" />
    </div>
  );
}

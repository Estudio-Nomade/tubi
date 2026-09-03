import Link from "next/link";

import { createOperadorViajesRepository } from "@/adapters/supabase/operador-viajes-repository";
import { createOperadorViajesService } from "@/application/operador";
import { getSetting } from "@/application/settings";
import { CrearViajeForm } from "@/components/operador/crear-viaje-form";
import { AppHeader, TabBar } from "@/components/design";
import { SETTING_KEYS } from "@/domain/settings";
import { addDaysLocal, toIsoDateLocal } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

function defaultPrecioString(valor: unknown): string {
  if (typeof valor === "number" && Number.isFinite(valor) && valor > 0) {
    return String(Math.round(valor));
  }
  if (typeof valor === "string") {
    const n = Number(valor.replace(",", "."));
    if (Number.isFinite(n) && n > 0) return String(Math.round(n));
  }
  return "";
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperadorViajeNuevoPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const conductorId =
    typeof params.conductorId === "string" ? params.conductorId : undefined;
  const vehiculoId =
    typeof params.vehiculoId === "string" ? params.vehiculoId : undefined;

  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );

  const [rutas, conductores, precioSetting] = await Promise.all([
    service.listRutas(),
    service.listConductoresConVehiculos(),
    getSetting(SETTING_KEYS.TARIFA_PRECIO_BASE_TANDIL_BSAS),
  ]);

  const hoy = toIsoDateLocal(new Date());
  const manana = addDaysLocal(new Date(), 1);
  const defaultFecha = toIsoDateLocal(manana);
  const defaultHora = "10:00";
  const defaultPrecio = defaultPrecioString(precioSetting?.valor);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader
        showBack
        backHref="/operador/viajes"
        roleLabel="Operador"
      />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Nuevo viaje
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Programá un viaje para el catálogo de pasajeros.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            ¿El conductor no tiene auto?
          </p>
          <Link
            href="/operador/viajes/vehiculos/nuevo"
            className="text-sm font-semibold text-primary underline underline-offset-2"
          >
            Registrar vehículo
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <CrearViajeForm
            rutas={rutas}
            conductores={conductores}
            defaultPrecio={defaultPrecio}
            defaultFecha={defaultFecha}
            minFecha={hoy}
            defaultHora={defaultHora}
            initialConductorId={conductorId}
            initialVehiculoId={vehiculoId}
          />
        </div>

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="operador" active="viajes" />
    </div>
  );
}

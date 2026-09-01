import Link from "next/link";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import { createConductorService } from "@/application/conductor";
import { AppHeader, TabBar } from "@/components/design";
import { CrearVehiculoPropioForm } from "@/components/conductor/crear-vehiculo-propio-form";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConductorVehiculoPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const ok = typeof params.ok === "string" ? params.ok : null;
  const onboarding =
    params.onboarding === "1" ||
    params.onboarding === "true" ||
    (Array.isArray(params.onboarding) &&
      (params.onboarding[0] === "1" || params.onboarding[0] === "true"));

  const profile = await requireProfile(["conductor"]);

  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );
  const vehiculos = await service.listMisVehiculos(profile.id);
  const isOnboarding = onboarding || vehiculos.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader
        showBack={!isOnboarding}
        backHref={isOnboarding ? undefined : "/conductor"}
      />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            {isOnboarding ? "Datos de tu vehículo" : "Mi vehículo"}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {isOnboarding
              ? "Patente, marca, modelo, color y asientos. Sin esto el operador no puede asignarte viajes."
              : "Registrá el auto con el que vas a hacer los viajes."}
          </p>
        </div>

        {ok === "actualizado" ? (
          <p
            className="rounded-xl bg-[#E4EDE5] px-3 py-2 text-sm font-medium text-[#5F7A61]"
            role="status"
          >
            Vehículo actualizado.
          </p>
        ) : null}

        {vehiculos.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {vehiculos.map((v) => (
              <li
                key={v.id}
                className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-heading text-[17px] font-semibold text-foreground">
                    {v.patente}
                  </p>
                  <Link
                    href={`/conductor/vehiculo/${v.id}/editar`}
                    className="shrink-0 text-sm font-semibold text-primary underline underline-offset-2"
                  >
                    Editar
                  </Link>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {v.marca} {v.modelo} · {v.color}
                </p>
                <p className="text-xs text-muted-foreground">
                  {v.capacidad} asientos
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <CrearVehiculoPropioForm hasVehiculos={vehiculos.length > 0} />
        </div>

        <div className="flex-1" aria-hidden />
      </main>
      {isOnboarding ? null : (
        <TabBar variant="conductor" active="cuenta" />
      )}
    </div>
  );
}

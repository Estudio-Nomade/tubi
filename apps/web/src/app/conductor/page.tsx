import Link from "next/link";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import { createConductorService } from "@/application/conductor";
import { StartPickupButton } from "@/components/conductor/start-pickup-button";
import { PassengerRow } from "@/components/conductor/passenger-row";
import {
  AppHeader,
  BtnPrimary,
  BtnSecondary,
  EmptyHint,
  StatusPill,
  TabBar,
  type StatusPillVariant,
} from "@/components/design";
import { formatFechaHoraAr, formatHoraAr, formatPersonaNombre } from "@/lib/format";
import { conductorLandingPath } from "@/application/conductor/landing-path";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import type { EstadoViaje } from "@/lib/supabase/types";
import { redirect } from "next/navigation";

function tripEstadoPill(estado: EstadoViaje): {
  label: string;
  variant: StatusPillVariant;
} {
  switch (estado) {
    case "recogida":
      return { label: "Recogida", variant: "pending" };
    case "en_curso":
      return { label: "En curso", variant: "ok" };
    case "completado":
      return { label: "Completado", variant: "ok" };
    case "programado":
    default:
      return { label: "Programado", variant: "neutral" };
  }
}

/** Pencil C3 home with trip · C2 empty. */
export default async function ConductorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ok = typeof params.ok === "string" ? params.ok : null;

  const profile = await requireProfile(["conductor", "operador"]);
  const displayName = formatPersonaNombre(profile.nombre, profile.apellido);

  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );
  const trips = await service.listTrips(profile.id);
  const vehiculos = await service.listMisVehiculos(profile.id);

  // Operador puede mirar home conductor sin vehículo propio.
  if (profile.rol === "conductor" && vehiculos.length === 0) {
    redirect(conductorLandingPath(false));
  }

  const primary = trips[0] ?? null;
  const detail = primary
    ? await service.getTrip(primary.id, profile.id, {
        isOperador: profile.rol === "operador",
      })
    : null;

  const hubHref = detail ? `/conductor/viajes/${detail.id}` : undefined;
  const nConfirmada = detail
    ? detail.passengers.filter((p) => p.estado === "confirmada").length
    : 0;
  const nVerificada = detail
    ? detail.passengers.filter((p) => p.estado === "verificada").length
    : 0;
  const nAbordada = detail
    ? detail.passengers.filter((p) => p.estado === "abordada").length
    : 0;
  const estadoPill = detail ? tripEstadoPill(detail.estado) : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-tight text-foreground">
            Hola, {displayName || profile.nombre}
          </h1>
          <span className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Conductor
          </span>
        </div>

        {ok === "vehiculo" ? (
          <p
            className="rounded-xl bg-[#E4EDE5] px-3 py-2 text-sm font-medium text-[#5F7A61]"
            role="status"
          >
            Vehículo registrado. Cuando el operador te asigne un viaje, aparece acá.
          </p>
        ) : null}

        {!primary || !detail ? (
          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-2xl border border-border bg-card px-5 py-10 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
              <EmptyHint message="No hay viajes asignados hoy" />
            </div>
            <p className="px-2 text-center text-sm font-normal text-muted-foreground">
              Cuando el operador te asigne un viaje, aparece acá.
            </p>
            <BtnSecondary
              disabled
              title="Próximamente"
              className="border-transparent bg-transparent text-muted-foreground/70 shadow-none hover:bg-transparent"
            >
              Ver agenda
            </BtnSecondary>
            <div className="flex-1" aria-hidden />
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-normal text-muted-foreground">
                  {formatFechaHoraAr(detail.fechaSalida)}
                </p>
                {estadoPill ? (
                  <StatusPill
                    label={estadoPill.label}
                    variant={estadoPill.variant}
                    className="shrink-0"
                  />
                ) : null}
              </div>
              <p className="font-heading text-[22px] font-semibold leading-tight text-foreground">
                {detail.origen} → {detail.destino}
              </p>
              <p className="text-sm font-normal text-muted-foreground">
                {detail.asientosOcupados}/{detail.capacidad} asientos ·{" "}
                {detail.vehiculoLabel}
              </p>
              {detail.passengers.length > 0 ? (
                <p className="text-xs font-medium text-muted-foreground">
                  {nConfirmada} confirmada{nConfirmada === 1 ? "" : "s"} ·{" "}
                  {nVerificada} verificada{nVerificada === 1 ? "" : "s"} ·{" "}
                  {nAbordada} a bordo
                </p>
              ) : null}
              {detail.estado === "programado" ? (
                <StartPickupButton viajeId={detail.id} />
              ) : detail.estado === "completado" ? (
                <BtnSecondary asChild>
                  <Link href={hubHref!}>Ver viaje</Link>
                </BtnSecondary>
              ) : detail.estado === "en_curso" ? (
                <BtnPrimary asChild>
                  <Link href={hubHref!}>Ir al viaje</Link>
                </BtnPrimary>
              ) : (
                <BtnPrimary asChild>
                  <Link href={hubHref!}>Continuar recogida</Link>
                </BtnPrimary>
              )}
            </section>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Pasajeros
                </h2>
                {detail.passengers.length > 0 ? (
                  <span className="text-xs font-medium text-muted-foreground">
                    {detail.passengers.length}
                  </span>
                ) : null}
              </div>
              {detail.passengers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/60 px-3 py-5">
                  <p className="text-center text-sm font-medium text-muted-foreground">
                    Todavía no hay pasajeros con seña confirmada.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {detail.passengers.map((p) => (
                    <li key={p.reservaId}>
                      <PassengerRow
                        nombre={p.nombre}
                        paradaLabel={p.paradaLabel}
                        estado={p.estado}
                        dense
                        cobrarHref={
                          p.estado === "verificada"
                            ? `/conductor/viajes/${detail.id}/saldo/${p.reservaId}`
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {trips.length > 1 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Otros viajes
                </p>
                {trips.slice(1).map((t) => (
                  <Link
                    key={t.id}
                    href={`/conductor/viajes/${t.id}`}
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/25"
                  >
                    {formatHoraAr(t.fechaSalida)} · {t.origen} → {t.destino}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="flex-1" aria-hidden />
          </>
        )}
      </main>
      <TabBar variant="conductor" active="inicio" viajesHref={hubHref} />
    </div>
  );
}

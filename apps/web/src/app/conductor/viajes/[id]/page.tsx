import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseConductorRepository } from "@/adapters/supabase/conductor-repository";
import { createConductorService } from "@/application/conductor";
import { CompleteTripButton } from "@/components/conductor/complete-trip-button";
import { PassengerRow } from "@/components/conductor/passenger-row";
import { StartPickupButton } from "@/components/conductor/start-pickup-button";
import {
  AppHeader,
  BtnPrimary,
  BtnSecondary,
  EmptyHint,
  StatusPill,
  TabBar,
  type StatusPillVariant,
} from "@/components/design";
import { formatFechaHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import type { EstadoViaje } from "@/lib/supabase/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function tripEstadoPill(estado: EstadoViaje): {
  label: string;
  variant: StatusPillVariant;
} | null {
  switch (estado) {
    case "recogida":
      return { label: "Recogida", variant: "pending" };
    case "en_curso":
      return { label: "En curso", variant: "ok" };
    case "programado":
      return { label: "Programado", variant: "neutral" };
    case "completado":
      return { label: "Completado", variant: "ok" };
    default:
      return null;
  }
}

/** Trip hub: passenger list + scan CTA + cobrar links. */
export default async function ConductorViajePage({
  params,
  searchParams,
}: PageProps) {
  const profile = await requireProfile(["conductor", "operador"]);
  const { id } = await params;
  const q = await searchParams;
  const okAbordada = q.ok === "abordada";
  const okNoshow = q.ok === "noshow";
  const okCompletado = q.ok === "completado";
  const viajeEnCurso = q.viaje === "en_curso";

  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );
  const trip = await service.getTrip(id, profile.id, {
    isOperador: profile.rol === "operador",
  });
  if (!trip) notFound();

  const pendientes = trip.passengers.filter(
    (p) => p.estado === "confirmada" || p.estado === "verificada",
  );
  const aBordo = trip.passengers.filter((p) => p.estado === "abordada");
  const hubHref = `/conductor/viajes/${trip.id}`;
  const estadoPill = tripEstadoPill(trip.estado);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/conductor" roleLabel="Conductor" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-heading text-[22px] font-semibold text-foreground">
              {trip.origen} → {trip.destino}
            </h1>
            {estadoPill ? (
              <StatusPill
                label={estadoPill.label}
                variant={estadoPill.variant}
                className="shrink-0"
              />
            ) : null}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {formatFechaHoraAr(trip.fechaSalida)} · {trip.asientosOcupados}/
            {trip.capacidad} asientos
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {trip.vehiculoLabel}
          </p>
        </div>

        {okAbordada ? (
          <p
            className="rounded-xl bg-[#E4EDE5] px-3 py-2 text-sm font-medium text-[#5F7A61]"
            role="status"
          >
            {viajeEnCurso
              ? "Pasajero abordado. El viaje pasó a en curso."
              : "Pasajero abordado. Saldo registrado."}
          </p>
        ) : null}

        {okNoshow ? (
          <p
            className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
            role="status"
          >
            {viajeEnCurso
              ? "No-show registrado. El viaje pasó a en curso."
              : "No-show registrado. La seña se retiene."}
          </p>
        ) : null}

        {okCompletado || trip.estado === "completado" ? (
          <p
            className="rounded-xl bg-[#E4EDE5] px-3 py-2 text-sm font-medium text-[#5F7A61]"
            role="status"
          >
            {okCompletado
              ? "Viaje finalizado. Gracias."
              : "Este viaje ya terminó."}
          </p>
        ) : null}

        {trip.estado === "programado" ? (
          <StartPickupButton viajeId={trip.id} />
        ) : trip.estado === "completado" ? null : trip.estado === "en_curso" &&
          pendientes.length === 0 ? (
          <div className="flex w-full flex-col gap-2">
            <CompleteTripButton viajeId={trip.id} />
            <BtnSecondary asChild>
              <Link href={`/conductor/viajes/${trip.id}/escanear`}>
                Escanear otro QR
              </Link>
            </BtnSecondary>
          </div>
        ) : trip.estado === "en_curso" ? (
          <BtnPrimary asChild>
            <Link href={`/conductor/viajes/${trip.id}/escanear`}>
              Escanear otro QR
            </Link>
          </BtnPrimary>
        ) : (
          <BtnPrimary asChild>
            <Link href={`/conductor/viajes/${trip.id}/escanear`}>
              Escanear QR
            </Link>
          </BtnPrimary>
        )}

        {trip.passengers.length === 0 ? (
          <>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Pasajeros
            </h2>
            <div className="rounded-2xl border border-border bg-card px-4 py-2">
              <EmptyHint message="No hay pasajeros confirmados para este viaje." />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Pendientes
                </h2>
                <span className="text-xs font-medium text-muted-foreground">
                  {pendientes.length}
                </span>
              </div>
              {pendientes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-card/60 px-3 py-4 text-center text-sm font-medium text-muted-foreground">
                  Nadie pendiente de abordar.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {pendientes.map((p) => (
                    <li key={p.reservaId}>
                      <PassengerRow
                        nombre={p.nombre}
                        paradaLabel={p.paradaLabel}
                        recogidaLabel={p.recogidaLabel}
                        estado={p.estado}
                        dense
                        cobrarHref={
                          p.estado === "verificada"
                            ? `/conductor/viajes/${trip.id}/saldo/${p.reservaId}`
                            : undefined
                        }
                        recogidaHref={
                          p.estado === "confirmada" || p.estado === "verificada"
                            ? `/conductor/viajes/${trip.id}/recogida/${p.reservaId}`
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  A bordo
                </h2>
                <span className="text-xs font-medium text-muted-foreground">
                  {aBordo.length}
                </span>
              </div>
              {aBordo.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-card/60 px-3 py-4 text-center text-sm font-medium text-muted-foreground">
                  Todavía no subió nadie.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {aBordo.map((p) => (
                    <li key={p.reservaId}>
                      <PassengerRow
                        nombre={p.nombre}
                        paradaLabel={p.paradaLabel}
                        recogidaLabel={p.recogidaLabel}
                        estado={p.estado}
                        dense
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
      <TabBar variant="conductor" active="viajes" viajesHref={hubHref} />
    </div>
  );
}

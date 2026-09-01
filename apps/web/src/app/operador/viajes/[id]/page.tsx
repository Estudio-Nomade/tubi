import Link from "next/link";
import { notFound } from "next/navigation";

import { createOperadorViajesRepository } from "@/adapters/supabase/operador-viajes-repository";
import { createOperadorViajesService } from "@/application/operador";
import { CancelTripButton } from "@/components/operador/cancel-trip-button";
import {
  AppHeader,
  StatusPill,
  TabBar,
  type StatusPillVariant,
} from "@/components/design";
import type { EstadoReserva } from "@/domain/reservas";
import type { EstadoViaje } from "@/domain/viajes";
import { formatArs, formatFechaHoraAr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function tripPill(estado: EstadoViaje): {
  label: string;
  variant: StatusPillVariant;
} {
  switch (estado) {
    case "programado":
      return { label: "Programado", variant: "neutral" };
    case "recogida":
      return { label: "Recogida", variant: "pending" };
    case "en_curso":
      return { label: "En curso", variant: "ok" };
    case "completado":
      return { label: "Completado", variant: "ok" };
    case "cancelado":
      return { label: "Cancelado", variant: "danger" };
    default:
      return { label: estado, variant: "neutral" };
  }
}

function reservaPill(estado: EstadoReserva): {
  label: string;
  variant: StatusPillVariant;
} {
  switch (estado) {
    case "confirmada":
      return { label: "Confirmada", variant: "ok" };
    case "verificada":
      return { label: "Verificada", variant: "ok" };
    case "abordada":
      return { label: "Abordada", variant: "ok" };
    case "pendiente_sena":
      return { label: "Pend. seña", variant: "pending" };
    case "cancelada":
      return { label: "Cancelada", variant: "danger" };
    case "no_show":
      return { label: "No-show", variant: "danger" };
    default:
      return { label: estado, variant: "neutral" };
  }
}

const CANCELABLE: EstadoViaje[] = ["programado", "recogida", "en_curso"];

export default async function OperadorViajeDetallePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const q = await searchParams;
  const okCancelado = q.ok === "cancelado";
  const okCreado = q.ok === "creado";

  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );
  const trip = await service.getViaje(id);
  if (!trip) notFound();

  const pill = tripPill(trip.estado);
  const canCancel = CANCELABLE.includes(trip.estado);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/operador/viajes" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-heading text-[22px] font-semibold text-foreground">
              {trip.origen} → {trip.destino}
            </h1>
            <StatusPill
              label={pill.label}
              variant={pill.variant}
              className="shrink-0"
            />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {formatFechaHoraAr(trip.fechaSalida)}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {trip.conductorNombre} · {trip.patente}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {trip.ocupacion}/{trip.capacidad} · {formatArs(trip.precio)}
          </p>
        </div>

        {okCreado ? (
          <p
            className="rounded-xl bg-[#E8F5E9] px-3 py-2 text-sm font-medium text-[#1B5E20]"
            role="status"
          >
            Viaje creado. Ya figura como programado en el catálogo.
          </p>
        ) : null}

        {okCancelado || trip.estado === "cancelado" ? (
          <p
            className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
            role="status"
          >
            {okCancelado
              ? "Viaje cancelado. Revisá Devoluciones si hay señas a devolver."
              : "Este viaje está cancelado."}
          </p>
        ) : null}

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Reservas
          </h2>
          {trip.reservas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm font-medium text-muted-foreground">
              Sin reservas en este viaje.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {trip.reservas.map((r) => {
                const rp = reservaPill(r.estado);
                return (
                  <li
                    key={r.reservaId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {r.pasajeroNombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seña {formatArs(r.montoSena)}
                        {r.montoDevolucion != null && r.montoDevolucion > 0
                          ? ` · Dev. ${formatArs(r.montoDevolucion)}`
                          : ""}
                      </p>
                    </div>
                    <StatusPill
                      label={rp.label}
                      variant={rp.variant}
                      className="shrink-0"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {canCancel ? <CancelTripButton viajeId={trip.id} /> : null}

        <Link
          href={`/operador/rutas/${trip.rutaId}/paradas`}
          className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card/80"
        >
          <span>Paradas de la ruta</span>
          <span className="font-semibold text-primary">Editar</span>
        </Link>

        <Link
          href="/operador/devoluciones"
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Ir a Devoluciones
        </Link>
      </main>
      <TabBar variant="operador" active="viajes" />
    </div>
  );
}

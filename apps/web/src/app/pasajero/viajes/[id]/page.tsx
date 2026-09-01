import Link from "next/link";
import { notFound } from "next/navigation";
import { Car, UserRound } from "lucide-react";

import { createSupabaseViajesRepository } from "@/adapters/supabase/viajes-repository";
import { createViajesService } from "@/application/viajes";
import { AppHeader, InfoRow } from "@/components/design";
import { ReserveButton } from "@/components/pasajero/reserve-button";
import {
  formatArs,
  formatHoraAr,
  formatHoraLlegadaAr,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Prefer results with the same search filters; else search form. */
function buildBackHref(
  searchParams: Record<string, string | string[] | undefined>,
): { href: string; label: string } {
  const origen = first(searchParams.origen).trim();
  const destino = first(searchParams.destino).trim();
  const fecha = first(searchParams.fecha).trim();
  if (origen && destino) {
    const q = new URLSearchParams({ origen, destino });
    if (fecha) q.set("fecha", fecha);
    const hora = first(searchParams.hora_desde).trim();
    if (hora) q.set("hora_desde", hora);
    return {
      href: `/pasajero/resultados?${q.toString()}`,
      label: "Volver a resultados",
    };
  }
  return { href: "/pasajero/buscar", label: "Volver a buscar" };
}

/** Pencil P5 · Detalle — Reservar creates pendiente_sena (Slice 2B). */
export default async function ViajeDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const back = buildBackHref(query);

  const supabase = await createClient();
  const service = createViajesService(createSupabaseViajesRepository(supabase));
  const viaje = await service.getById(id);

  if (!viaje) notFound();

  const canReserve = viaje.estado === "programado" && viaje.asientosLibres > 0;
  const conductorNombre = [viaje.conductor.nombre, viaje.conductor.apellido]
    .filter(Boolean)
    .join(" ");
  const vehiculoLabel = `${viaje.vehiculo.marca} ${viaje.vehiculo.modelo} · ${viaje.vehiculo.color} · ${viaje.vehiculo.patente}`;

  const horaSalida = formatHoraAr(viaje.fechaSalida);
  const horaLlegada = formatHoraLlegadaAr(viaje.etaLlegada);
  const heroMeta = horaLlegada
    ? `${horaSalida} · ${horaLlegada}`
    : horaSalida;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref={back.href} />
      {/* Explicit Volver keeps filters when coming from results */}
      <div className="px-5 pt-1">
        <Link
          href={back.href}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ← {back.label}
        </Link>
      </div>

      <main className="flex flex-1 flex-col gap-5 px-5 pb-0 pt-3">
        <header className="flex flex-col gap-1.5">
          <h1 className="font-heading text-[28px] font-semibold leading-[1.15] tracking-tight text-foreground">
            {viaje.origen} → {viaje.destino}
          </h1>
          <p className="text-[15px] font-medium text-muted-foreground">
            {heroMeta}
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <InfoRow icon={UserRound} label="Conductor" value={conductorNombre} />
          <InfoRow icon={Car} label="Vehículo" value={vehiculoLabel} />
          <InfoRow
            label="Asientos libres"
            value={String(viaje.asientosLibres)}
          />
        </section>

        <section className="flex flex-col gap-1 pt-1">
          <h2 className="sr-only">Paradas</h2>
          <ol className="flex flex-col">
            {viaje.paradas.map((parada, index) => {
              const isFirst = index === 0;
              const isLast = index === viaje.paradas.length - 1;
              const label =
                parada.nombre.includes(parada.ciudad) ||
                parada.ciudad === parada.nombre
                  ? parada.nombre
                  : `${parada.ciudad} · ${parada.nombre}`;

              return (
                <li key={parada.id} className="flex gap-3">
                  <div
                    className={cn(
                      "flex w-4 shrink-0 flex-col items-center",
                      isLast ? "h-6" : "min-h-12",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 size-2.5 shrink-0 rounded-full",
                        isFirst ? "bg-primary" : "bg-border",
                      )}
                    />
                    {!isLast ? (
                      <span
                        className="mt-1 w-0.5 flex-1 bg-border"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-4")}>
                    <p className="text-[15px] font-medium leading-snug text-foreground">
                      {label}
                    </p>
                    <p className="text-[13px] font-normal text-muted-foreground">
                      {parada.tipo === "origen"
                        ? horaSalida
                        : parada.tipo === "destino" && horaLlegada
                          ? horaLlegada.replace("lleg. ~", "~")
                          : parada.tipo === "destino"
                            ? "Destino"
                            : "Parada"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="flex-1" aria-hidden />
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background px-5 pb-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              Total
            </span>
            <span className="font-heading text-2xl font-semibold leading-none text-foreground">
              {formatArs(viaje.precio)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <ReserveButton
              viajeId={viaje.id}
              disabled={!canReserve}
              disabledReason={
                viaje.estado !== "programado"
                  ? "Este viaje ya no se puede reservar."
                  : "Este viaje no tiene asientos disponibles."
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

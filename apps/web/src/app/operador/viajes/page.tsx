import Link from "next/link";

import { createOperadorViajesRepository } from "@/adapters/supabase/operador-viajes-repository";
import { createOperadorViajesService } from "@/application/operador";
import { OperadorNav } from "@/components/operador/operador-nav";
import {
  AppHeader,
  BtnPrimary,
  EmptyHint,
  StatusPill,
  type StatusPillVariant,
} from "@/components/design";
import type { EstadoViaje } from "@/domain/viajes";
import { formatArs, formatFechaHoraAr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

function pillFor(estado: EstadoViaje): {
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

/** Operator trip list + link to create scheduled trips (FR-10). */
export default async function OperadorViajesPage() {
  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );
  const [items, devCount] = await Promise.all([
    service.listViajes(),
    service.countDevoluciones(),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/operador" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
              Viajes
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {items.length === 0
                ? "Sin viajes cargados"
                : `${items.length} viaje${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link
            href="/operador/viajes/nuevo"
            className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Crear viaje
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
            <EmptyHint message="No hay viajes cargados. Creá el primero para que los pasajeros lo vean en el catálogo." />
            <BtnPrimary asChild>
              <Link href="/operador/viajes/nuevo">Crear viaje</Link>
            </BtnPrimary>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const pill = pillFor(item.estado);
              return (
                <li key={item.id}>
                  <Link
                    href={`/operador/viajes/${item.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)] transition-colors hover:border-primary/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <p className="font-heading text-[17px] font-semibold text-foreground">
                          {item.origen} → {item.destino}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {formatFechaHoraAr(item.fechaSalida)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.conductorNombre} · {item.patente}
                        </p>
                      </div>
                      <StatusPill label={pill.label} variant={pill.variant} />
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="font-medium text-muted-foreground">
                        {item.ocupacion}/{item.capacidad} asientos
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatArs(item.precio)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-auto">
          <OperadorNav active="viajes" devolucionesCount={devCount} />
        </div>
      </main>
    </div>
  );
}

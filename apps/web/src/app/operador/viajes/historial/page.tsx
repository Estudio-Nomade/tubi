import Link from "next/link";

import { createOperadorViajesRepository } from "@/adapters/supabase/operador-viajes-repository";
import { createOperadorViajesService } from "@/application/operador";
import {
  AppHeader,
  EmptyHint,
  StatusPill,
  TabBar,
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
    case "completado":
      return { label: "Completado", variant: "ok" };
    case "cancelado":
      return { label: "Cancelado", variant: "danger" };
    default:
      return { label: estado, variant: "neutral" };
  }
}

/** Operator trip history: cancelado + completado, most recent first. */
export default async function OperadorViajesHistorialPage() {
  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );
  const items = await service.listViajesHistorial();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/operador/viajes" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
              Historial
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {items.length === 0
                ? "Sin viajes en el historial"
                : `${items.length} viaje${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link
            href="/operador/viajes"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Activos
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
            <EmptyHint message="Todavía no hay viajes cancelados ni completados." />
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

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="operador" active="viajes" />
    </div>
  );
}

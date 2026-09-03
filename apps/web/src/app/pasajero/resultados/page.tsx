import Link from "next/link";

import { createSupabaseViajesRepository } from "@/adapters/supabase/viajes-repository";
import { createViajesService } from "@/application/viajes";
import { AppHeader, EmptyHint, TabBar, TripCard } from "@/components/design";
import { groupViajesByFechaLocal, searchViajesSchema } from "@/domain/viajes";
import { formatArs, formatHoraAr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function chipClass(active: boolean): string {
  return cn(
    "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
    active
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-muted-foreground",
  );
}

/** Pencil P4 · Resultados — días con oferta agrupados por fecha local. */
export default async function ResultadosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = searchViajesSchema.safeParse({
    origen: first(params.origen),
    destino: first(params.destino),
    fecha: first(params.fecha) || undefined,
    hora_desde: first(params.hora_desde) || undefined,
  });

  if (!parsed.success) {
    return (
      <Shell title="Resultados" subtitle="Completá la búsqueda">
        <EmptyHint message="Completá origen y destino para buscar." />
      </Shell>
    );
  }

  const { origen, destino } = parsed.data;
  const fecha =
    parsed.data.fecha && parsed.data.fecha.length > 0
      ? parsed.data.fecha
      : undefined;

  const supabase = await createClient();
  const service = createViajesService(createSupabaseViajesRepository(supabase));
  const viajes = await service.search({ origen, destino });

  const subtitle = `${origen} → ${destino}`;

  if (viajes.length === 0) {
    return (
      <Shell title="Próximos viajes" subtitle={subtitle}>
        <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <EmptyHint message="No hay viajes programados en esta ruta. Probá al revés o más tarde." />
        </div>
      </Shell>
    );
  }

  const grupos = groupViajesByFechaLocal(viajes);
  const seleccionado = fecha
    ? grupos.find((g) => g.fechaKey === fecha)
    : undefined;
  const shownGrupos = seleccionado ? [seleccionado] : grupos;
  const title = seleccionado ? seleccionado.label : "Próximos viajes";

  const baseParams = new URLSearchParams({ origen, destino });
  const returnQuery = new URLSearchParams({ origen, destino });
  if (fecha) returnQuery.set("fecha", fecha);

  return (
    <Shell title={title} subtitle={subtitle}>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {fecha ? (
          <Link
            href={`/pasajero/resultados?${baseParams.toString()}`}
            className={chipClass(false)}
          >
            Todos
          </Link>
        ) : null}
        {grupos.map((g) => (
          <Link
            key={g.fechaKey}
            href={`/pasajero/resultados?${baseParams.toString()}&fecha=${g.fechaKey}`}
            className={chipClass(fecha === g.fechaKey)}
          >
            {g.label}
          </Link>
        ))}
      </div>

      {fecha && !seleccionado ? (
        <p className="text-sm font-medium text-muted-foreground">
          No hay viajes para ese día. Te mostramos los próximos.
        </p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {shownGrupos.map((grupo) => (
          <li key={grupo.fechaKey} className="flex flex-col gap-3">
            <h2 className="font-heading text-base font-semibold text-foreground">
              {grupo.label}
            </h2>
            <ul className="flex flex-col gap-3">
              {grupo.items.map((viaje) => (
                <li key={viaje.id}>
                  <TripCard
                    origen={viaje.origen}
                    destino={viaje.destino}
                    horaLabel={formatHoraAr(viaje.fechaSalida)}
                    asientosLabel={`${viaje.asientosLibres} asientos`}
                    precioLabel={formatArs(viaje.precio)}
                    href={`/pasajero/viajes/${viaje.id}?${returnQuery.toString()}`}
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/pasajero/buscar" />
      <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[22px] font-semibold leading-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </main>
      <TabBar variant="pasajero" active="buscar" />
    </div>
  );
}

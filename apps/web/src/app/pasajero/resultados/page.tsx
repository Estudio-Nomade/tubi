import { AppHeader, EmptyHint, TabBar, TripCard } from "@/components/design";
import { createViajesService } from "@/application/viajes";
import { createSupabaseViajesRepository } from "@/adapters/supabase/viajes-repository";
import { searchViajesSchema } from "@/domain/viajes";
import {
  formatArs,
  formatFechaTituloAr,
  formatHoraAr,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Pencil P4 · Resultados — DateTitle Fraunces 22 + route subtitle + TripList gap 12 */
export default async function ResultadosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = searchViajesSchema.safeParse({
    origen: first(params.origen),
    destino: first(params.destino),
    fecha: first(params.fecha),
    hora_desde: first(params.hora_desde) || undefined,
  });

  if (!parsed.success) {
    return (
      <Shell title="Resultados" subtitle="Completá la búsqueda">
        <EmptyHint message="Completá origen, destino y fecha para buscar." />
      </Shell>
    );
  }

  const horaDesde =
    parsed.data.hora_desde && parsed.data.hora_desde.length > 0
      ? parsed.data.hora_desde
      : undefined;

  const supabase = await createClient();
  const service = createViajesService(createSupabaseViajesRepository(supabase));
  const viajes = await service.search({
    origen: parsed.data.origen,
    destino: parsed.data.destino,
    fecha: parsed.data.fecha,
    horaDesde,
  });

  const title = formatFechaTituloAr(parsed.data.fecha);
  const subtitle = `${parsed.data.origen} → ${parsed.data.destino}`;

  const returnQuery = new URLSearchParams({
    origen: parsed.data.origen,
    destino: parsed.data.destino,
    fecha: parsed.data.fecha,
  });
  if (horaDesde) returnQuery.set("hora_desde", horaDesde);

  return (
    <Shell title={title} subtitle={subtitle}>
      {viajes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <EmptyHint message="No hay viajes para esa fecha." />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {viajes.map((viaje) => (
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
      )}
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
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
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

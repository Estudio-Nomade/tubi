import Link from "next/link";

import { createOperadorSenasRepository } from "@/adapters/supabase/operador-senas-repository";
import { createOperadorSenasService } from "@/application/operador";
import {
  AppHeader,
  EmptyHint,
  StatusPill,
  TabBar,
} from "@/components/design";
import { formatArs, formatFechaHoraAr, formatHoraAr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Operator home = pending sena queue (Slice 3). Cards from Pencil O1 CardTop. */
export default async function OperadorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ok = typeof params.ok === "string" ? params.ok : null;

  const supabase = await createClient();
  const service = createOperadorSenasService(
    createOperadorSenasRepository(supabase),
  );
  const items = await service.listPending();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Señas pendientes
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {items.length === 0
              ? "Nada para revisar"
              : `${items.length} comprobante${items.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {ok === "confirmada" ? (
          <p
            className="rounded-xl bg-[#E4EDE5] px-3 py-2 text-sm font-medium text-[#5F7A61]"
            role="status"
          >
            Seña confirmada. La reserva quedó asegurada.
          </p>
        ) : null}
        {ok === "rechazada" ? (
          <p
            className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
            role="status"
          >
            Seña rechazada. El pasajero puede reenviar el comprobante.
          </p>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
            <EmptyHint message="No hay señas pendientes de confirmar." />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.pagoId}>
                <Link
                  href={`/operador/confirmar/${item.pagoId}`}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)] transition-colors hover:border-primary/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 flex-col gap-1">
                      <p className="text-[17px] font-semibold text-foreground">
                        {item.pasajeroNombre}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatHoraAr(item.fechaSalida)} · {item.origen} →{" "}
                        {item.destino}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFechaHoraAr(item.createdAt)}
                      </p>
                    </div>
                    <StatusPill label="Pendiente" variant="pending" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Seña
                    </span>
                    <span className="text-base font-semibold tabular-nums text-foreground">
                      {formatArs(item.monto)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="operador" active="senas" />
    </div>
  );
}

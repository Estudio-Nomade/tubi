import { createOperadorViajesRepository } from "@/adapters/supabase/operador-viajes-repository";
import { createOperadorViajesService } from "@/application/operador";
import { MarkRefundDoneButton } from "@/components/operador/mark-refund-done-button";
import { OperadorNav } from "@/components/operador/operador-nav";
import { AppHeader, EmptyHint } from "@/components/design";
import { formatArs, formatFechaHoraAr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperadorDevolucionesPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const ok = typeof params.ok === "string" ? params.ok : null;

  const supabase = await createClient();
  const service = createOperadorViajesService(
    createOperadorViajesRepository(supabase),
  );
  const items = await service.listDevoluciones();

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/operador" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Devoluciones
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Señas a transferir fuera de la app
          </p>
        </div>

        {ok === "saldada" ? (
          <p
            className="rounded-xl bg-[#E4EDE5] px-3 py-2 text-sm font-medium text-[#5F7A61]"
            role="status"
          >
            Devolución marcada como transferida.
          </p>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
            <EmptyHint message="No hay devoluciones pendientes." />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.reservaId}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-[17px] font-semibold text-foreground">
                    {item.pasajeroNombre}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.origen} → {item.destino}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Viaje {formatFechaHoraAr(item.fechaSalida)}
                    {item.canceladaEn
                      ? ` · Cancel. ${formatFechaHoraAr(item.canceladaEn)}`
                      : ""}
                  </p>
                  {item.pasajeroTelefono ? (
                    <p className="text-xs font-medium text-muted-foreground">
                      Contacto {item.pasajeroTelefono}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    A devolver
                  </span>
                  <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
                    {formatArs(item.montoDevolucion)}
                  </span>
                </div>
                <MarkRefundDoneButton reservaId={item.reservaId} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          <OperadorNav
            active="devoluciones"
            devolucionesCount={items.length}
          />
        </div>
      </main>
    </div>
  );
}

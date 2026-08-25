import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { createReservasService } from "@/application/reservas";
import {
  AppHeader,
  BtnPrimary,
  EmptyHint,
  StatusPill,
  type StatusPillVariant,
  TabBar,
} from "@/components/design";
import { CancelReservaButton } from "@/components/pasajero/cancel-reserva-button";
import {
  canCancelReserva,
  formatRefundHint,
  previewRefund,
  type EstadoReserva,
  type ReservaListItem,
} from "@/domain/reservas";
import { formatArs, formatFechaHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function statusForEstado(estado: EstadoReserva): {
  label: string;
  variant: StatusPillVariant;
} {
  switch (estado) {
    case "confirmada":
      return { label: "Confirmada", variant: "ok" };
    case "verificada":
      return { label: "Verificada", variant: "ok" };
    case "abordada":
      return { label: "A bordo", variant: "ok" };
    case "pendiente_sena":
      return { label: "Pendiente de seña", variant: "pending" };
    case "cancelada":
      return { label: "Cancelada", variant: "danger" };
    case "no_show":
      return { label: "No show", variant: "danger" };
    default:
      return { label: estado, variant: "pending" };
  }
}

function hrefForItem(item: ReservaListItem): string | null {
  if (item.estado === "confirmada") {
    return `/pasajero/pase/${item.reservaId}`;
  }
  if (item.estado === "pendiente_sena") {
    return `/pasajero/reservas/${item.reservaId}/sena`;
  }
  return null;
}

function cancelPreview(item: ReservaListItem): {
  hint: string;
  monto: number;
} | null {
  if (!canCancelReserva(item.estado)) return null;
  if (!item.politicaCancelacion) {
    if (item.estado === "pendiente_sena") {
      return {
        hint: "Si cancelás ahora, no hay devolución (la seña no se confirmó).",
        monto: 0,
      };
    }
    return {
      hint: "Esta acción no se puede deshacer. El asiento se libera.",
      monto: 0,
    };
  }
  const preview = previewRefund({
    estado: item.estado,
    now: new Date(),
    fechaSalida: new Date(item.fechaSalida),
    montoSena: item.montoSena,
    politica: item.politicaCancelacion,
  });
  return {
    hint: formatRefundHint(preview),
    monto: preview.monto,
  };
}

/** Passenger reservation history — Pencil P7 card style. */
export default async function PasajeroReservasPage({ searchParams }: PageProps) {
  const profile = await requireProfile(["pasajero", "operador"]);
  const params = await searchParams;
  const ok = first(params.ok);

  const supabase = await createClient();
  const reservas = createReservasService(
    createSupabaseReservasRepository(supabase),
  );
  const list = await reservas.listForPassenger(profile.id);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/pasajero" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-2">
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Mis reservas
        </h1>

        {ok === "cancelada" ? (
          <p
            className="rounded-xl border border-border bg-card px-3 py-2 text-center text-sm font-medium text-foreground"
            role="status"
          >
            Reserva cancelada.
          </p>
        ) : null}

        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="w-full rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
              <EmptyHint message="Todavía no tenés reservas" />
            </div>
            <BtnPrimary asChild>
              <Link href="/pasajero/buscar">Buscar viaje</Link>
            </BtnPrimary>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((item) => {
              const status = statusForEstado(item.estado);
              const href = hrefForItem(item);
              const cancel = cancelPreview(item);
              const body = (
                <>
                  <StatusPill
                    label={status.label}
                    variant={status.variant}
                    className="self-start"
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="font-heading text-[22px] font-semibold leading-tight text-foreground">
                        {item.origen} → {item.destino}
                      </p>
                      <p className="text-sm font-normal text-muted-foreground">
                        {formatFechaHoraAr(item.fechaSalida)}
                      </p>
                      {item.estado === "pendiente_sena" ? (
                        <p className="text-sm font-medium text-muted-foreground">
                          Seña {formatArs(item.montoSena)}
                          {item.precioViaje != null
                            ? ` · Viaje ${formatArs(item.precioViaje)}`
                            : null}
                        </p>
                      ) : item.precioViaje != null ? (
                        <p className="text-sm font-medium text-muted-foreground">
                          Viaje {formatArs(item.precioViaje)}
                        </p>
                      ) : null}
                    </div>
                    {href ? (
                      <ChevronRight
                        className="size-5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </>
              );

              return (
                <li key={item.reservaId} className="flex flex-col gap-2">
                  {href ? (
                    <Link
                      href={href}
                      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)] transition-colors hover:bg-card/80"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
                      {body}
                    </div>
                  )}
                  {cancel ? (
                    <CancelReservaButton
                      reservaId={item.reservaId}
                      variant="button"
                      refundHint={cancel.hint}
                      refundMonto={cancel.monto}
                      className="h-11 text-base"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <TabBar variant="pasajero" active="inicio" />
    </div>
  );
}

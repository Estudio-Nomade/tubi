import Link from "next/link";
import { ChevronRight, User } from "lucide-react";

import { StatusPill, type StatusPillVariant } from "@/components/design";
import type { EstadoReserva } from "@/domain/reservas";
import { cn } from "@/lib/utils";

type Props = {
  nombre: string;
  paradaLabel: string;
  estado: EstadoReserva;
  /** When set and estado is verificada, row links to C7. */
  cobrarHref?: string;
  /** When set and estado is confirmada|verificada, secondary link to C5. */
  recogidaHref?: string;
  dense?: boolean;
};

function pillFor(estado: EstadoReserva): {
  label: string;
  variant: StatusPillVariant;
} {
  switch (estado) {
    case "verificada":
      return { label: "Verificada", variant: "ok" };
    case "abordada":
      return { label: "Abordada", variant: "ok" };
    case "no_show":
      return { label: "No-show", variant: "danger" };
    case "confirmada":
    default:
      return { label: "Confirmada", variant: "pending" };
  }
}

export function PassengerRow({
  nombre,
  paradaLabel,
  estado,
  cobrarHref,
  recogidaHref,
  dense = false,
}: Props) {
  const pill = pillFor(estado);
  const showCobrar = estado === "verificada" && !!cobrarHref;
  const showRecogida =
    !!recogidaHref &&
    (estado === "confirmada" || estado === "verificada");

  const body = (
    <>
      <User
        className={cn(
          "shrink-0 text-muted-foreground",
          dense ? "size-4" : "size-5",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className={cn(
            "truncate font-medium text-foreground",
            dense ? "text-sm" : "text-[15px]",
          )}
        >
          {nombre}
        </p>
        <p
          className={cn(
            "truncate font-normal text-muted-foreground",
            dense ? "text-xs" : "text-[13px]",
          )}
        >
          {paradaLabel}
          {showCobrar ? " · Cobrar saldo" : null}
          {!showCobrar && showRecogida && estado === "confirmada"
            ? " · Recogida"
            : null}
        </p>
      </div>
      <StatusPill
        label={pill.label}
        variant={pill.variant}
        className="shrink-0"
      />
      {showCobrar || (showRecogida && estado === "confirmada") ? (
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      ) : null}
    </>
  );

  const className = cn(
    "flex items-center rounded-xl bg-card shadow-[0_4px_16px_rgba(28,25,23,0.06)]",
    dense ? "gap-2 px-3 py-2" : "gap-2.5 px-3.5 py-3",
  );

  if (showCobrar && cobrarHref) {
    return (
      <div className="flex flex-col gap-1">
        <Link
          href={cobrarHref}
          className={cn(className, "transition-colors hover:bg-card/80")}
        >
          {body}
        </Link>
        {showRecogida && recogidaHref ? (
          <Link
            href={recogidaHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#FCEBEA] text-sm font-semibold text-[#B42318]"
          >
            No llegó
          </Link>
        ) : null}
      </div>
    );
  }

  if (showRecogida && recogidaHref && estado === "confirmada") {
    return (
      <Link
        href={recogidaHref}
        className={cn(className, "transition-colors hover:bg-card/80")}
      >
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

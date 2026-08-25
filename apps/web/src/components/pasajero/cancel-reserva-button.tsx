"use client";

import { useState, useTransition } from "react";

import { cancelReservaAction } from "@/application/reservas";
import { BtnDanger, BtnSecondary } from "@/components/design";
import { formatArs } from "@/lib/format";

type Variant = "link" | "button";

type Props = {
  reservaId: string;
  /** Optional preview lines for confirm dialog. */
  refundHint?: string;
  refundMonto?: number;
  variant?: Variant;
  className?: string;
};

export function CancelReservaButton({
  reservaId,
  refundHint,
  refundMonto,
  variant = "button",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelReservaAction(reservaId);
      if (result?.error) {
        setError(result.error);
        return;
      }
    });
  }

  const trigger =
    variant === "link" ? (
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className={
          className ??
          "text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        }
      >
        Cancelar reserva
      </button>
    ) : (
      <BtnDanger
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className={className}
      >
        Cancelar
      </BtnDanger>
    );

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {trigger}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`cancel-title-${reservaId}`}
        >
          <div className="flex w-full max-w-[343px] flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_32px_rgba(28,25,23,0.12)]">
            <div className="flex flex-col gap-2">
              <h2
                id={`cancel-title-${reservaId}`}
                className="font-heading text-lg font-semibold text-foreground"
              >
                ¿Cancelar reserva?
              </h2>
              <p className="text-sm leading-snug text-muted-foreground">
                {refundHint ??
                  "Esta acción no se puede deshacer. El asiento se libera."}
              </p>
              {refundMonto != null && refundMonto > 0 ? (
                <p className="text-sm font-medium text-foreground">
                  Devolución estimada: {formatArs(refundMonto)} (la gestiona el
                  operador).
                </p>
              ) : null}
            </div>

            {error ? (
              <p
                className="text-center text-xs font-medium text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <BtnDanger
                type="button"
                disabled={pending}
                onClick={confirmCancel}
              >
                {pending ? "Cancelando…" : "Sí, cancelar"}
              </BtnDanger>
              <BtnSecondary
                type="button"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
              >
                Volver
              </BtnSecondary>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

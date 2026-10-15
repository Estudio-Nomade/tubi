"use client";

import { useState, useTransition } from "react";

import { createReservaAction } from "@/application/reservas";
import { solicitarAsientoAction } from "@/application/reservas/request-actions";
import { BtnPrimary } from "@/components/design";
import type { RecogidaInput } from "@/domain/reservas";

type ReserveButtonProps = {
  viajeId: string;
  /** peer = request seat; tubi_operated = instant book */
  mode?: "book" | "request";
  pickup?: RecogidaInput | null;
  cuponUsuarioId?: string | null;
  disabled?: boolean;
  disabledReason?: string;
};

export function ReserveButton({
  viajeId,
  mode = "book",
  pickup = null,
  cuponUsuarioId = null,
  disabled = false,
  disabledReason,
}: ReserveButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isRequest = mode === "request";

  function onClick() {
    setError(null);
    startTransition(async () => {
      if (isRequest) {
        const result = await solicitarAsientoAction(viajeId, pickup ?? null);
        if (result?.error) setError(result.error);
        return;
      }

      const result = await createReservaAction(
        viajeId,
        pickup ?? undefined,
        cuponUsuarioId || null,
      );
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <BtnPrimary
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        title={disabled ? disabledReason : undefined}
      >
        {pending
          ? isRequest
            ? "Enviando…"
            : "Reservando…"
          : isRequest
            ? "Solicitar asiento"
            : "Reservar"}
      </BtnPrimary>
      {error ? (
        <p
          className="text-center text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : disabled && disabledReason ? (
        <p className="text-center text-xs font-medium text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}
    </div>
  );
}

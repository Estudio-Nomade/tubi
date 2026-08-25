"use client";

import { useState, useTransition } from "react";

import { createReservaAction } from "@/application/reservas";
import { BtnPrimary } from "@/components/design";

type ReserveButtonProps = {
  viajeId: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function ReserveButton({
  viajeId,
  disabled = false,
  disabledReason,
}: ReserveButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await createReservaAction(viajeId);
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
        {pending ? "Reservando…" : "Reservar"}
      </BtnPrimary>
      {error ? (
        <p className="text-center text-xs font-medium text-destructive" role="alert">
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

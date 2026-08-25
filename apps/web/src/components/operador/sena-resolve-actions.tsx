"use client";

import { useState, useTransition } from "react";

import {
  confirmSenaAction,
  rejectSenaAction,
} from "@/application/operador";
import { BtnDanger, BtnPrimary } from "@/components/design";

type Props = {
  pagoId: string;
  disabled?: boolean;
};

export function SenaResolveActions({ pagoId, disabled = false }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(accion: "confirmar" | "rechazar") {
    setError(null);
    startTransition(async () => {
      const result =
        accion === "confirmar"
          ? await confirmSenaAction(pagoId)
          : await rejectSenaAction(pagoId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full gap-3">
        <BtnDanger
          type="button"
          className="flex-1"
          disabled={disabled || pending}
          onClick={() => run("rechazar")}
        >
          {pending ? "…" : "Rechazar"}
        </BtnDanger>
        <BtnPrimary
          type="button"
          className="flex-1"
          disabled={disabled || pending}
          onClick={() => run("confirmar")}
        >
          {pending ? "…" : "Confirmar"}
        </BtnPrimary>
      </div>
      {error ? (
        <p className="text-center text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

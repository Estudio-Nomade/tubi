"use client";

import { useState, useTransition } from "react";

import { completeTripAction } from "@/application/conductor";
import { BtnPrimary } from "@/components/design";

type Props = {
  viajeId: string;
};

export function CompleteTripButton({ viajeId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      {error ? (
        <div className="rounded-xl bg-[#FCEBEA] px-3.5 py-3" role="alert">
          <p className="text-sm font-semibold text-[#B42318]">{error}</p>
        </div>
      ) : null}
      <BtnPrimary
        type="button"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            "¿Confirmás que llegaron a destino y el viaje terminó bien?",
          );
          if (!ok) return;
          setError(null);
          startTransition(async () => {
            const res = await completeTripAction(viajeId);
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending ? "Finalizando…" : "Finalizar viaje"}
      </BtnPrimary>
    </div>
  );
}

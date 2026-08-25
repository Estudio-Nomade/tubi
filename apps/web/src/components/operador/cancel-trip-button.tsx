"use client";

import { useState, useTransition } from "react";

import { cancelarViajeAction } from "@/application/operador";
import { BtnDanger } from "@/components/design";

type Props = {
  viajeId: string;
};

export function CancelTripButton({ viajeId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      {error ? (
        <div className="rounded-xl bg-[#FCEBEA] px-3.5 py-3" role="alert">
          <p className="text-sm font-semibold text-[#B42318]">{error}</p>
        </div>
      ) : null}
      <BtnDanger
        type="button"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            "¿Cancelar este viaje? Se cancelan las reservas abiertas y se registra devolución 100% de señas confirmadas. La plata la transferís vos después desde Devoluciones.",
          );
          if (!ok) return;
          setError(null);
          startTransition(async () => {
            const res = await cancelarViajeAction(viajeId);
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending ? "Cancelando…" : "Cancelar viaje"}
      </BtnDanger>
    </div>
  );
}

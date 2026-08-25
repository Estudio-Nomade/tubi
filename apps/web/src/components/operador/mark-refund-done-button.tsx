"use client";

import { useState, useTransition } from "react";

import { marcarDevolucionSaldadaAction } from "@/application/operador";
import { BtnSecondary } from "@/components/design";

type Props = {
  reservaId: string;
};

export function MarkRefundDoneButton({ reservaId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      {error ? (
        <div className="rounded-xl bg-[#FCEBEA] px-3.5 py-3" role="alert">
          <p className="text-sm font-semibold text-[#B42318]">{error}</p>
        </div>
      ) : null}
      <BtnSecondary
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await marcarDevolucionSaldadaAction(reservaId);
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending ? "Guardando…" : "Marqué como transferida"}
      </BtnSecondary>
    </div>
  );
}

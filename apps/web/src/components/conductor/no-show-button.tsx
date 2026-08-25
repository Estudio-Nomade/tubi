"use client";

import { useState, useTransition } from "react";

import { marcarNoShowAction } from "@/application/conductor";
import { BtnDanger } from "@/components/design";

type Props = {
  viajeId: string;
  reservaId: string;
  /** When false, confirm before marking early. */
  timerDone: boolean;
};

/** Pencil C5 — Marcar no-show (early needs confirm). */
export function NoShowButton({ viajeId, reservaId, timerDone }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function markNoShow() {
    setError(null);
    if (!timerDone) {
      const ok = window.confirm(
        "¿Marcar no-show antes de que termine la espera? La seña se retiene.",
      );
      if (!ok) return;
    }
    startTransition(async () => {
      const res = await marcarNoShowAction(viajeId, reservaId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {error ? (
        <div className="rounded-xl bg-[#FCEBEA] px-3.5 py-3" role="alert">
          <p className="text-sm font-semibold text-[#B42318]">{error}</p>
        </div>
      ) : null}
      <BtnDanger type="button" disabled={pending} onClick={markNoShow}>
        {pending ? "Marcando…" : "Marcar no-show"}
      </BtnDanger>
    </div>
  );
}

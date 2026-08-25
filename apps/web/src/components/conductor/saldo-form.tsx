"use client";

import { useState, useTransition } from "react";

import { registerSaldoAction } from "@/application/conductor";
import { BtnPrimary, Segmented } from "@/components/design";
import type { MetodoPago } from "@/domain/pagos";

type Props = {
  viajeId: string;
  reservaId: string;
};

const OPTIONS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
];

export function SaldoForm({ viajeId, reservaId }: Props) {
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex w-full flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await registerSaldoAction(viajeId, reservaId, metodo);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <Segmented
        value={metodo}
        options={OPTIONS}
        onChange={setMetodo}
        disabled={pending}
      />

      {error ? (
        <div className="rounded-xl bg-[#FCEBEA] px-3.5 py-3" role="alert">
          <p className="text-sm font-semibold text-[#B42318]">{error}</p>
        </div>
      ) : null}

      <BtnPrimary type="submit" disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar abordado"}
      </BtnPrimary>
    </form>
  );
}

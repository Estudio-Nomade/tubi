"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { canjearCuponAction } from "@/application/cupones";
import { BtnPrimary, Field } from "@/components/design";

export function CanjearCuponForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const value = codigo.trim();
    if (!value) {
      setError("Ingresá el código del cupón.");
      return;
    }
    startTransition(async () => {
      const result = await canjearCuponAction(value);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setCodigo("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field
        label="Código de cupón"
        name="codigo"
        value={codigo}
        onChange={(e) => {
          setCodigo(e.target.value);
          setError(null);
        }}
        placeholder="Ej. TUBI10"
        autoComplete="off"
        autoCapitalize="characters"
        disabled={pending}
        error={error ?? undefined}
      />
      <BtnPrimary type="submit" disabled={pending} className="h-11 text-base">
        {pending ? "Canjeando…" : "Canjear"}
      </BtnPrimary>
    </form>
  );
}

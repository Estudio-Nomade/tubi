"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

import { BtnPrimary, Field } from "@/components/design";

type SearchFormProps = {
  defaultOrigen?: string;
  defaultDestino?: string;
};

export function SearchForm({
  defaultOrigen = "Tandil",
  defaultDestino = "Buenos Aires",
}: SearchFormProps) {
  const router = useRouter();
  const [origen, setOrigen] = useState(defaultOrigen);
  const [destino, setDestino] = useState(defaultDestino);

  function swap() {
    setOrigen(destino);
    setDestino(origen);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      origen: origen.trim(),
      destino: destino.trim(),
    });
    router.push(`/pasajero/resultados?${params.toString()}`);
  }

  return (
    <form
      action="/pasajero/resultados"
      method="get"
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <Field
          label="Origen"
          name="origen"
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
          required
          autoComplete="off"
        />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={swap}
            className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-foreground"
            aria-label="Intercambiar origen y destino"
          >
            <ArrowUpDown className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <Field
          label="Destino"
          name="destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          required
          autoComplete="off"
        />
      </div>

      <BtnPrimary type="submit">Ver viajes</BtnPrimary>
      <p className="text-center text-xs font-medium text-muted-foreground">
        Vas a ver los días con viajes cargados por Tubi.
      </p>
    </form>
  );
}

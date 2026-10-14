"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

import { BtnPrimary } from "@/components/design";
import { CityField } from "@/components/pasajero/city-field";

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
  const [error, setError] = useState<string | null>(null);

  function swap() {
    setOrigen(destino);
    setDestino(origen);
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const o = origen.trim();
    const d = destino.trim();
    if (!o || !d) {
      setError("Elegí origen y destino de la lista.");
      return;
    }
    if (o.toLowerCase() === d.toLowerCase()) {
      setError("Origen y destino tienen que ser distintos.");
      return;
    }
    setError(null);
    const params = new URLSearchParams({ origen: o, destino: d });
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
        <CityField
          label="Origen"
          name="origen"
          value={origen}
          onChange={setOrigen}
          required
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
        <CityField
          label="Destino"
          name="destino"
          value={destino}
          onChange={setDestino}
          required
        />
      </div>

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <BtnPrimary type="submit">Ver viajes</BtnPrimary>
      <p className="text-center text-xs font-medium text-muted-foreground">
        Escribí unas letras y elegí la ciudad de la lista.
      </p>
    </form>
  );
}

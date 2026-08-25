"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

import { BtnPrimary, Field } from "@/components/design";
import { addDaysLocal, toIsoDateLocal } from "@/lib/format";
import { cn } from "@/lib/utils";

type Chip = { label: string; value: string };

type SearchFormProps = {
  defaultOrigen?: string;
  defaultDestino?: string;
};

export function SearchForm({
  defaultOrigen = "Tandil",
  defaultDestino = "Buenos Aires",
}: SearchFormProps) {
  const router = useRouter();
  const chips = useMemo<Chip[]>(() => {
    const today = new Date();
    return [
      { label: "Hoy", value: toIsoDateLocal(today) },
      { label: "Mañana", value: toIsoDateLocal(addDaysLocal(today, 1)) },
      { label: "+2 días", value: toIsoDateLocal(addDaysLocal(today, 2)) },
    ];
  }, []);

  const [origen, setOrigen] = useState(defaultOrigen);
  const [destino, setDestino] = useState(defaultDestino);
  const [fecha, setFecha] = useState(chips[1]?.value ?? chips[0]!.value);
  const [horaDesde, setHoraDesde] = useState("");

  function swap() {
    setOrigen(destino);
    setDestino(origen);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      origen: origen.trim(),
      destino: destino.trim(),
      fecha,
    });
    if (horaDesde) params.set("hora_desde", horaDesde);
    router.push(`/pasajero/resultados?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
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

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Fecha</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = chip.value === fecha;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setFecha(chip.value)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label="Horario desde (opcional)"
        name="hora_desde"
        type="time"
        value={horaDesde}
        onChange={(e) => setHoraDesde(e.target.value)}
      />

      <BtnPrimary type="submit">Buscar</BtnPrimary>
    </form>
  );
}

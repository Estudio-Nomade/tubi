"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { crearCampaniaAction } from "@/application/cupones";
import { BtnPrimary, Field } from "@/components/design";

export function CampaniaForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const desde = String(fd.get("vigenciaDesde") ?? "").trim();
    const hasta = String(fd.get("vigenciaHasta") ?? "").trim();
    if (desde) fd.set("vigenciaDesde", `${desde}T00:00:00`);
    if (hasta) fd.set("vigenciaHasta", `${hasta}T23:59:59`);
    startTransition(async () => {
      const result = await crearCampaniaAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error ? (
        <p
          className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Field
        label="Código"
        name="codigo"
        placeholder="Ej. PLAZA"
        autoComplete="off"
        autoCapitalize="characters"
        required
        disabled={pending}
      />
      <Field
        label="Monto de descuento (ARS)"
        name="montoDescuento"
        type="number"
        inputMode="decimal"
        min={1}
        step={1}
        placeholder="5000"
        required
        disabled={pending}
      />
      <Field
        label="Cupos totales (vacío = ilimitado)"
        name="cuposTotales"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        placeholder="Opcional"
        disabled={pending}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Vigencia desde"
          name="vigenciaDesde"
          type="date"
          required
          disabled={pending}
        />
        <Field
          label="Vigencia hasta"
          name="vigenciaHasta"
          type="date"
          required
          disabled={pending}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Días post canje"
          name="validoDiasPostCanje"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={14}
          required
          disabled={pending}
        />
        <Field
          label="Máx. por usuario"
          name="maxPorUsuario"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={1}
          required
          disabled={pending}
        />
      </div>

      <BtnPrimary type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear campaña"}
      </BtnPrimary>
    </form>
  );
}

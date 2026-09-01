"use client";

import { useActionState } from "react";

import {
  actualizarVehiculoPropioAction,
  type CrearVehiculoPropioActionResult,
} from "@/application/conductor/vehiculos-actions";
import { BtnPrimary, Field } from "@/components/design";
import type { ConductorVehiculoRow } from "@/domain/conductor";

type Props = {
  vehiculo: ConductorVehiculoRow;
};

export function EditarVehiculoPropioForm({ vehiculo }: Props) {
  const [state, formAction, pending] = useActionState(
    actualizarVehiculoPropioAction,
    undefined as CrearVehiculoPropioActionResult | void,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error ? (
        <p
          className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <input type="hidden" name="vehiculoId" value={vehiculo.id} />

      <Field
        name="patente"
        label="Patente"
        required
        autoCapitalize="characters"
        autoComplete="off"
        defaultValue={vehiculo.patente}
        error={state?.fieldErrors?.patente}
      />

      <Field
        name="marca"
        label="Marca"
        required
        autoComplete="off"
        defaultValue={vehiculo.marca}
        error={state?.fieldErrors?.marca}
      />

      <Field
        name="modelo"
        label="Modelo"
        required
        autoComplete="off"
        defaultValue={vehiculo.modelo}
        error={state?.fieldErrors?.modelo}
      />

      <Field
        name="color"
        label="Color"
        required
        autoComplete="off"
        defaultValue={vehiculo.color}
        error={state?.fieldErrors?.color}
      />

      <Field
        name="capacidad"
        label="Capacidad (asientos)"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        required
        defaultValue={String(vehiculo.capacidad)}
        error={state?.fieldErrors?.capacidad}
      />

      <BtnPrimary type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </BtnPrimary>
    </form>
  );
}

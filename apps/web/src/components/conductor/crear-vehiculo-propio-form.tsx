"use client";

import { useActionState, useState } from "react";

import {
  crearVehiculoPropioAction,
  type CrearVehiculoPropioActionResult,
} from "@/application/conductor/vehiculos-actions";
import { BtnPrimary, BtnSecondary, Field } from "@/components/design";

type Props = {
  hasVehiculos: boolean;
};

export function CrearVehiculoPropioForm({ hasVehiculos }: Props) {
  const [state, formAction, pending] = useActionState(
    crearVehiculoPropioAction,
    undefined as CrearVehiculoPropioActionResult | void,
  );
  const [open, setOpen] = useState(!hasVehiculos);

  if (!open) {
    return (
      <BtnSecondary type="button" onClick={() => setOpen(true)}>
        Agregar vehículo
      </BtnSecondary>
    );
  }

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

      <Field
        name="patente"
        label="Patente"
        required
        autoCapitalize="characters"
        autoComplete="off"
        placeholder="AB 123 CD"
        error={state?.fieldErrors?.patente}
      />

      <Field
        name="marca"
        label="Marca"
        required
        autoComplete="off"
        placeholder="Toyota"
        error={state?.fieldErrors?.marca}
      />

      <Field
        name="modelo"
        label="Modelo"
        required
        autoComplete="off"
        placeholder="Corolla"
        error={state?.fieldErrors?.modelo}
      />

      <Field
        name="color"
        label="Color"
        required
        autoComplete="off"
        placeholder="Blanco"
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
        defaultValue="4"
        error={state?.fieldErrors?.capacidad}
      />

      <BtnPrimary type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar vehículo"}
      </BtnPrimary>
    </form>
  );
}

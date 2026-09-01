"use client";

import { useActionState } from "react";

import {
  crearVehiculoAction,
  type CrearVehiculoActionResult,
} from "@/application/operador/vehiculos-actions";
import { BtnPrimary, Field } from "@/components/design";
import type { ConductorCatalogoRow } from "@/domain/operador";
import { cn } from "@/lib/utils";

type Props = {
  conductores: ConductorCatalogoRow[];
  initialConductorId?: string;
};

const selectClass =
  "h-13 w-full min-w-0 rounded-xl border border-border bg-muted px-3.5 text-base font-medium text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function SelectField({
  name,
  label,
  error,
  children,
  ...props
}: React.ComponentProps<"select"> & {
  label: string;
  error?: string;
}) {
  const id = props.id ?? name;
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(selectClass)}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CrearVehiculoForm({ conductores, initialConductorId }: Props) {
  const [state, formAction, pending] = useActionState(
    crearVehiculoAction,
    undefined as CrearVehiculoActionResult | void,
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

      <SelectField
        name="conductorId"
        label="Conductor"
        required
        defaultValue={initialConductorId ?? conductores[0]?.id ?? ""}
        error={state?.fieldErrors?.conductorId}
        disabled={conductores.length === 0}
      >
        {conductores.length === 0 ? (
          <option value="">No hay conductores</option>
        ) : (
          conductores.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.nombre, c.apellido].filter(Boolean).join(" ") || "Conductor"}
            </option>
          ))
        )}
      </SelectField>

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

      <BtnPrimary type="submit" disabled={pending || conductores.length === 0}>
        {pending ? "Guardando…" : "Registrar vehículo"}
      </BtnPrimary>
    </form>
  );
}

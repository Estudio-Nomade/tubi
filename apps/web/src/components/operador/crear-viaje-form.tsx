"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import {
  crearViajeAction,
  type CrearViajeActionResult,
} from "@/application/operador/viajes-actions";
import { BtnPrimary } from "@/components/design";
import type {
  ConductorCatalogoRow,
  RutaCatalogoRow,
} from "@/domain/operador";
import { formatPersonaNombre } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  rutas: RutaCatalogoRow[];
  conductores: ConductorCatalogoRow[];
  defaultPrecio: string;
  defaultFecha: string;
  minFecha: string;
  defaultHora: string;
  initialConductorId?: string;
  initialVehiculoId?: string;
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

function InputField({
  name,
  label,
  error,
  ...props
}: React.ComponentProps<"input"> & {
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
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(selectClass)}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CrearViajeForm({
  rutas,
  conductores,
  defaultPrecio,
  defaultFecha,
  minFecha,
  defaultHora,
  initialConductorId,
  initialVehiculoId,
}: Props) {
  const [state, formAction, pending] = useActionState(
    crearViajeAction,
    undefined as CrearViajeActionResult | void,
  );

  const [conductorId, setConductorId] = useState(
    initialConductorId ?? conductores[0]?.id ?? "",
  );

  const vehiculos = useMemo(() => {
    const c = conductores.find((x) => x.id === conductorId);
    return c?.vehiculos ?? [];
  }, [conductores, conductorId]);

  const selectedVehiculoId = useMemo(() => {
    if (initialVehiculoId && vehiculos.some((v) => v.id === initialVehiculoId)) {
      return initialVehiculoId;
    }
    return vehiculos[0]?.id ?? "";
  }, [initialVehiculoId, vehiculos]);

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
        name="rutaId"
        label="Ruta"
        required
        defaultValue={rutas[0]?.id ?? ""}
        error={state?.fieldErrors?.rutaId}
        disabled={rutas.length === 0}
      >
        {rutas.length === 0 ? (
          <option value="">No hay rutas cargadas</option>
        ) : (
          rutas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.origen} → {r.destino}
            </option>
          ))
        )}
      </SelectField>

      <SelectField
        name="conductorId"
        label="Conductor"
        required
        value={conductorId}
        onChange={(e) => setConductorId(e.target.value)}
        error={state?.fieldErrors?.conductorId}
        disabled={conductores.length === 0}
      >
        {conductores.length === 0 ? (
          <option value="">No hay conductores</option>
        ) : (
          conductores.map((c) => (
            <option key={c.id} value={c.id}>
              {formatPersonaNombre(c.nombre, c.apellido) || "Conductor"}
            </option>
          ))
        )}
      </SelectField>

      <SelectField
        key={`${conductorId}-${selectedVehiculoId}`}
        name="vehiculoId"
        label="Vehículo"
        required
        defaultValue={selectedVehiculoId}
        error={state?.fieldErrors?.vehiculoId}
        disabled={vehiculos.length === 0}
      >
        {vehiculos.length === 0 ? (
          <option value="">No hay vehículos para este conductor</option>
        ) : (
          vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.patente} · {v.marca} {v.modelo} · {v.capacidad} asientos
            </option>
          ))
        )}
      </SelectField>

      {vehiculos.length === 0 && conductorId ? (
        <div className="rounded-xl bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
          Este conductor no tiene vehículo.{" "}
          <Link
            href={`/operador/viajes/vehiculos/nuevo?conductorId=${conductorId}`}
            className="font-semibold text-primary underline underline-offset-2"
          >
            Registrar vehículo
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <InputField
          name="fecha"
          label="Fecha"
          type="date"
          required
          min={minFecha}
          defaultValue={defaultFecha}
          error={state?.fieldErrors?.fecha}
        />
        <InputField
          name="hora"
          label="Hora"
          type="time"
          required
          defaultValue={defaultHora}
          error={state?.fieldErrors?.hora}
        />
      </div>

      <InputField
        name="precio"
        label="Precio (ARS)"
        type="number"
        inputMode="decimal"
        min={1}
        step={1}
        defaultValue={defaultPrecio}
        placeholder={defaultPrecio ? undefined : "Definí tarifa o ingresá precio"}
        error={state?.fieldErrors?.precio}
        autoComplete="off"
      />

      <BtnPrimary
        type="submit"
        disabled={
          pending ||
          rutas.length === 0 ||
          conductores.length === 0 ||
          vehiculos.length === 0
        }
      >
        {pending ? "Creando…" : "Crear viaje"}
      </BtnPrimary>
    </form>
  );
}

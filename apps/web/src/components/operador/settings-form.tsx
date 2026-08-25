"use client";

import { useActionState } from "react";

import {
  updateOperadorSettingsAction,
  type UpdateSettingsResult,
} from "@/application/operador/settings-actions";
import { BtnPrimary, Field } from "@/components/design";
import {
  EDITABLE_FIELD_META,
  type EditableFieldMeta,
  type Setting,
} from "@/domain/settings";

type Props = {
  initial: ReadonlyMap<string, Setting>;
};

const GROUP_LABELS: Record<EditableFieldMeta["group"], string> = {
  tarifa: "Tarifa",
  reserva: "Reserva",
  pagos: "Pagos transferencia",
  flags: "Flags",
};

const GROUPS: EditableFieldMeta["group"][] = [
  "tarifa",
  "reserva",
  "pagos",
  "flags",
];

function initialString(settings: ReadonlyMap<string, Setting>, clave: string): string {
  const row = settings.get(clave);
  if (!row) return "";
  const v = row.valor;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return JSON.stringify(v);
}

function isChecked(settings: ReadonlyMap<string, Setting>, clave: string): boolean {
  const row = settings.get(clave);
  if (!row) return false;
  return row.valor === true || row.valor === "true";
}

function fieldInputMode(meta: EditableFieldMeta): "decimal" | undefined {
  if (meta.tipo === "number") return "decimal";
  return undefined;
}

function fieldType(meta: EditableFieldMeta): string {
  if (meta.tipo === "number") return "number";
  return "text";
}

function fieldStep(meta: EditableFieldMeta): string | undefined {
  if (meta.unit === "pct") return "0.01";
  if (meta.tipo === "number") return "1";
  return undefined;
}

function fieldMin(meta: EditableFieldMeta): number | undefined {
  if (meta.tipo === "number") return 0;
  return undefined;
}

function fieldMax(meta: EditableFieldMeta): number | undefined {
  if (meta.clave === "comision.plataforma_pct") return 15;
  if (meta.unit === "pct") return 100;
  if (meta.clave === "reserva.espera_max_min") return 180;
  return undefined;
}

export function OperadorSettingsForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(
    updateOperadorSettingsAction,
    undefined as UpdateSettingsResult | void,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error ? (
        <p
          className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {GROUPS.map((group) => {
        const fields = EDITABLE_FIELD_META.filter((f) => f.group === group);
        if (fields.length === 0) return null;
        return (
          <section key={group} className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              {GROUP_LABELS[group]}
            </h2>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
              {fields.map((meta) => {
                if (meta.tipo === "boolean") {
                  return (
                    <label
                      key={meta.clave}
                      className="flex items-center justify-between gap-3 py-1"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {meta.label}
                        </span>
                        {meta.caption ? (
                          <span className="text-xs text-muted-foreground">
                            {meta.caption}
                          </span>
                        ) : null}
                      </span>
                      <input
                        type="checkbox"
                        name={meta.clave}
                        value="true"
                        defaultChecked={isChecked(initial, meta.clave)}
                        className="size-5 shrink-0 rounded border-border accent-primary"
                      />
                    </label>
                  );
                }

                const err = state?.fieldErrors?.[meta.clave];
                return (
                  <Field
                    key={meta.clave}
                    name={meta.clave}
                    label={
                      meta.caption
                        ? `${meta.label} · ${meta.caption}`
                        : meta.label
                    }
                    type={fieldType(meta)}
                    inputMode={fieldInputMode(meta)}
                    step={fieldStep(meta)}
                    min={fieldMin(meta)}
                    max={fieldMax(meta)}
                    defaultValue={initialString(initial, meta.clave)}
                    error={err}
                    required
                    autoComplete="off"
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <BtnPrimary type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </BtnPrimary>
    </form>
  );
}

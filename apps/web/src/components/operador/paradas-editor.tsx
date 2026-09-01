"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  actualizarParadaAction,
  crearParadaIntermediaAction,
  eliminarParadaIntermediaAction,
  reordenarParadasAction,
  type ParadaActionResult,
} from "@/application/operador/paradas-actions";
import { BtnPrimary, BtnSecondary, Field, StatusPill } from "@/components/design";
import { moveParada } from "@/domain/operador";
import type { ParadaRow, RutaParadasInfo } from "@/domain/operador";

import { ParadaGeoSearch } from "./parada-geo-search";

type Props = {
  ruta: RutaParadasInfo;
  paradas: ParadaRow[];
};

const TIPO_META: Record<
  ParadaRow["tipo"],
  { label: string; variant: "neutral" | "pending" | "ok" }
> = {
  origen: { label: "Origen", variant: "neutral" },
  intermedio: { label: "Parada", variant: "pending" },
  destino: { label: "Destino", variant: "ok" },
};

type ParadaFormProps = {
  rutaId: string;
  paradaId?: string;
  initial?: { nombre: string; ciudad: string; lat: number; lng: number };
  submitLabel: string;
  action: (
    prev: ParadaActionResult | void,
    formData: FormData,
  ) => Promise<ParadaActionResult | void>;
  onDone: () => void;
  onCancel: () => void;
};

function ParadaForm({
  rutaId,
  paradaId,
  initial,
  submitLabel,
  action,
  onDone,
  onCancel,
}: ParadaFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [ciudad, setCiudad] = useState(initial?.ciudad ?? "");
  const [lat, setLat] = useState(initial ? String(initial.lat) : "");
  const [lng, setLng] = useState(initial ? String(initial.lng) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(undefined, fd);
      if (res?.error) {
        setError(res.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="rutaId" value={rutaId} />
      {paradaId ? <input type="hidden" name="paradaId" value={paradaId} /> : null}

      <ParadaGeoSearch
        onSelect={(r) => {
          setNombre(r.label);
          setLat(String(r.lat));
          setLng(String(r.lng));
        }}
      />

      <Field
        label="Nombre"
        name="nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <Field
        label="Ciudad"
        name="ciudad"
        value={ciudad}
        onChange={(e) => setCiudad(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Latitud"
          name="lat"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          inputMode="decimal"
          required
        />
        <Field
          label="Longitud"
          name="lng"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          inputMode="decimal"
          required
        />
      </div>

      {error ? (
        <p
          className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <BtnPrimary type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </BtnPrimary>
        <BtnSecondary type="button" onClick={onCancel}>
          Cancelar
        </BtnSecondary>
      </div>
    </form>
  );
}

export function ParadasEditor({ ruta, paradas }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function move(index: number, delta: 1 | -1) {
    const ids = paradas.map((p) => p.id);
    const target = index + delta;
    if (target < 1 || target > ids.length - 2) return;
    const next = moveParada(ids, index, delta);
    startTransition(async () => {
      setError(null);
      const res = await reordenarParadasAction(ruta.id, next);
      if (res?.error) setError(res.error);
      else refresh();
    });
  }

  function remove(paradaId: string) {
    startTransition(async () => {
      setError(null);
      const res = await eliminarParadaIntermediaAction(paradaId, ruta.id);
      if (res?.error) setError(res.error);
      else refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-[#EFE8DC] px-3 py-2 text-sm font-medium text-[#1C1917]">
        Paradas de la ruta {ruta.origen} ↔ {ruta.destino} — aplica a todos los
        viajes de esta ruta.
      </p>

      {error ? (
        <p
          className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {paradas.map((p, index) => {
          const meta = TIPO_META[p.tipo];
          const isIntermedio = p.tipo === "intermedio";
          const isEditing = editingId === p.id;

          return (
            <li
              key={p.id}
              className="rounded-xl border border-border bg-card px-3 py-3"
            >
              {isEditing ? (
                <ParadaForm
                  rutaId={ruta.id}
                  paradaId={p.id}
                  initial={{
                    nombre: p.nombre,
                    ciudad: p.ciudad,
                    lat: p.lat,
                    lng: p.lng,
                  }}
                  submitLabel="Guardar"
                  action={actualizarParadaAction}
                  onDone={() => {
                    setEditingId(null);
                    refresh();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <StatusPill
                        label={meta.label}
                        variant={meta.variant}
                        className="shrink-0"
                      />
                      <p className="truncate text-sm font-semibold text-foreground">
                        {p.nombre}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {p.ciudad} · {p.lat}, {p.lng}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {isIntermedio ? (
                      <>
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={pending || index <= 1}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
                          aria-label="Subir"
                        >
                          <ArrowUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={pending || index >= paradas.length - 2}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
                          aria-label="Bajar"
                        >
                          <ArrowDown className="size-4" />
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditingId(p.id)}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    {isIntermedio ? (
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        disabled={pending}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-destructive hover:bg-muted disabled:opacity-40"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="rounded-xl border border-border bg-card px-3 py-3">
          <ParadaForm
            rutaId={ruta.id}
            submitLabel="Agregar parada"
            action={crearParadaIntermediaAction}
            onDone={() => {
              setAdding(false);
              refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <BtnSecondary
          type="button"
          onClick={() => setAdding(true)}
          className="gap-2"
        >
          <Plus className="size-4" aria-hidden />
          Agregar parada intermedia
        </BtnSecondary>
      )}
    </div>
  );
}

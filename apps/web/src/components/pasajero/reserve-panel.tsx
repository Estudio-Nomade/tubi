"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";

import type { PickupMode } from "@/domain/geo";
import { computeSaldo } from "@/domain/pagos/saldo";
import type { RecogidaInput } from "@/domain/reservas";
import { formatArs } from "@/lib/format";

import { PickupPlacePicker } from "./pickup-place-picker";
import { ReserveButton } from "./reserve-button";

export type ReserveCuponOption = {
  id: string;
  label: string;
  montoDescuento: number;
};

type Props = {
  viajeId: string;
  pickupMode: PickupMode;
  /** Trip origin city — drives free-pickup copy and geocode bias. */
  origenCiudad: string;
  fixedLabel: string | null;
  precio: number;
  montoSena: number;
  /** peer trips use request flow; tubi uses instant book */
  bookMode?: "book" | "request";
  cupones?: ReserveCuponOption[];
  disabled: boolean;
  disabledReason?: string;
};

/** Trip detail footer: pickup + coupon + reserve/request CTA. */
export function ReservePanel({
  viajeId,
  pickupMode,
  origenCiudad,
  fixedLabel,
  precio,
  montoSena,
  bookMode = "book",
  cupones = [],
  disabled,
  disabledReason,
}: Props) {
  const [pickup, setPickup] = useState<RecogidaInput | null>(null);
  const [cuponId, setCuponId] = useState("");
  const city = origenCiudad.trim() || "Tandil";
  const isFreePickup = pickupMode === "libre_tandil";
  const needPickup = isFreePickup && !pickup;
  const reserveDisabled = disabled || needPickup;
  const reason = disabled
    ? disabledReason
    : needPickup
      ? `Elegí o escribí dónde te buscamos en ${city}.`
      : undefined;

  const descuento = useMemo(() => {
    if (!cuponId) return 0;
    return cupones.find((c) => c.id === cuponId)?.montoDescuento ?? 0;
  }, [cuponId, cupones]);

  const saldo = computeSaldo(precio, montoSena, descuento);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          ¿Dónde te buscamos?
        </p>
        {isFreePickup ? (
          <PickupPlacePicker
            value={pickup}
            onChange={setPickup}
            city={city}
          />
        ) : (
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm font-medium text-foreground">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            <span>{fixedLabel ?? `Punto de recogida en ${city}`}</span>
          </p>
        )}
      </div>

      {cupones.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Cupón</p>
          <div
            role="radiogroup"
            aria-label="Cupón de descuento"
            className="flex flex-col gap-1.5"
          >
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground">
              <input
                type="radio"
                name="cupon"
                value=""
                checked={cuponId === ""}
                onChange={() => setCuponId("")}
                className="size-4 accent-primary"
              />
              <span>Sin cupón</span>
            </label>
            {cupones.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground"
              >
                <input
                  type="radio"
                  name="cupon"
                  value={c.id}
                  checked={cuponId === c.id}
                  onChange={() => setCuponId(c.id)}
                  className="size-4 accent-primary"
                />
                <span className="min-w-0 flex-1">{c.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs font-normal leading-relaxed text-muted-foreground">
            La seña no cambia; el descuento se descuenta del saldo al subir.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5 rounded-xl bg-muted/50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Precio viaje</span>
          <span className="font-medium tabular-nums text-foreground">
            {formatArs(precio)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Seña</span>
          <span className="font-medium tabular-nums text-foreground">
            {formatArs(montoSena)}
          </span>
        </div>
        {descuento > 0 ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Descuento cupón</span>
            <span className="font-medium tabular-nums text-foreground">
              −{formatArs(descuento)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-1.5 text-sm">
          <span className="font-medium text-foreground">Saldo al subir</span>
          <span className="font-heading text-lg font-semibold tabular-nums leading-none text-foreground">
            {formatArs(saldo)}
          </span>
        </div>
      </div>

      <ReserveButton
        viajeId={viajeId}
        mode={bookMode}
        pickup={isFreePickup ? pickup : null}
        cuponUsuarioId={bookMode === "book" ? cuponId || null : null}
        disabled={reserveDisabled}
        disabledReason={reason}
      />
    </div>
  );
}

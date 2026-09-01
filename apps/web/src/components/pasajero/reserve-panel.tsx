"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import type { PickupMode } from "@/domain/geo";
import type { RecogidaInput } from "@/domain/reservas";
import { formatArs } from "@/lib/format";

import { PickupPlacePicker } from "./pickup-place-picker";
import { ReserveButton } from "./reserve-button";

type Props = {
  viajeId: string;
  pickupMode: PickupMode;
  fixedLabel: string | null;
  precio: number;
  disabled: boolean;
  disabledReason?: string;
};

/** Footer del detalle de viaje: recogida (Tandil libre / CABA fijo) + reserva. */
export function ReservePanel({
  viajeId,
  pickupMode,
  fixedLabel,
  precio,
  disabled,
  disabledReason,
}: Props) {
  const [pickup, setPickup] = useState<RecogidaInput | null>(null);
  const isTandil = pickupMode === "libre_tandil";
  const needPickup = isTandil && !pickup;
  const reserveDisabled = disabled || needPickup;
  const reason = disabled
    ? disabledReason
    : needPickup
      ? "Elegí dónde te buscamos en Tandil."
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          ¿Dónde te buscamos?
        </p>
        {isTandil ? (
          <PickupPlacePicker value={pickup} onChange={setPickup} />
        ) : (
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm font-medium text-foreground">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            <span>{fixedLabel ?? "Punto de recogida de la ruta"}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex shrink-0 flex-col gap-0.5">
          <span className="text-xs font-medium text-muted-foreground">
            Total
          </span>
          <span className="font-heading text-2xl font-semibold leading-none text-foreground">
            {formatArs(precio)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <ReserveButton
            viajeId={viajeId}
            pickup={isTandil ? pickup : null}
            disabled={reserveDisabled}
            disabledReason={reason}
          />
        </div>
      </div>
    </div>
  );
}

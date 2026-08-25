"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { NoShowButton } from "@/components/conductor/no-show-button";
import { WaitTimer } from "@/components/conductor/wait-timer";
import { BtnPrimary } from "@/components/design";

type Props = {
  viajeId: string;
  reservaId: string;
  esperaMaxMin: number;
  nextParadaLabel: string | null;
};

/** C5 body under passenger meta: timer + scan + no-show. */
export function PickupActions({
  viajeId,
  reservaId,
  esperaMaxMin,
  nextParadaLabel,
}: Props) {
  const [timerDone, setTimerDone] = useState(esperaMaxMin <= 0);
  const onExpired = useCallback(() => setTimerDone(true), []);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex w-full flex-col items-center py-6">
        <WaitTimer
          maxMinutes={esperaMaxMin}
          storageKey={`tubi:wait:${reservaId}`}
          onExpired={onExpired}
        />
      </div>

      <div className="mt-auto flex w-full flex-col gap-3">
        {timerDone ? (
          <p
            className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-center text-sm font-semibold text-[#B42318]"
            role="status"
          >
            Se acabó la espera. Si no está, marcá “No llegó” y seguí.
          </p>
        ) : null}
        <BtnPrimary asChild>
          <Link href={`/conductor/viajes/${viajeId}/escanear`}>
            Escanear QR
          </Link>
        </BtnPrimary>
        <NoShowButton
          viajeId={viajeId}
          reservaId={reservaId}
          timerDone={timerDone}
        />
        {nextParadaLabel ? (
          <p className="text-center text-[13px] font-medium text-muted-foreground">
            Siguiente · {nextParadaLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

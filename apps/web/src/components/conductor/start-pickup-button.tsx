"use client";

import { useState, useTransition } from "react";

import { startPickupAction } from "@/application/conductor";
import { BtnPrimary } from "@/components/design";

type Props = {
  viajeId: string;
  label?: string;
};

export function StartPickupButton({
  viajeId,
  label = "Empezar recogida",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      <BtnPrimary
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await startPickupAction(viajeId);
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending ? "Abriendo…" : label}
      </BtnPrimary>
      {error ? (
        <p className="text-center text-sm font-medium text-[#B42318]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

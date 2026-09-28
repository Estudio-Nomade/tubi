"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setCampaniaActivaAction } from "@/application/cupones";
import { BtnSecondary } from "@/components/design";

type Props = {
  id: string;
  activa: boolean;
};

export function CampaniaActivaToggle({ id, activa }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      {error ? (
        <p className="text-xs font-medium text-[#B42318]" role="alert">
          {error}
        </p>
      ) : null}
      <BtnSecondary
        type="button"
        className="h-10 text-sm"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await setCampaniaActivaAction(id, !activa);
            if ("error" in res && res.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Guardando…" : activa ? "Desactivar" : "Activar"}
      </BtnSecondary>
    </div>
  );
}

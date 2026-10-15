"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setUiModeAction } from "@/application/auth/set-ui-mode-action";
import { Segmented } from "@/components/design";
import type { UiMode } from "@/domain/auth";

const OPTIONS: { value: UiMode; label: string }[] = [
  { value: "travel", label: "Viajar" },
  { value: "drive", label: "Conducir" },
];

type ModeSwitchProps = {
  mode: UiMode;
  /** True when driver KYC is verified (can enter /conductor). */
  canDriveMode: boolean;
};

/**
 * Always-visible dual-mode control (spec: no long-press).
 * Drive without KYC → /conductor/kyc placeholder (Fase 1).
 */
export function ModeSwitch({ mode, canDriveMode }: ModeSwitchProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: UiMode) {
    if (next === mode || pending) return;
    startTransition(async () => {
      if (next === "drive" && !canDriveMode) {
        await setUiModeAction("drive");
        router.push("/conductor/kyc");
        router.refresh();
        return;
      }
      await setUiModeAction(next);
      router.push(next === "drive" ? "/conductor" : "/pasajero");
      router.refresh();
    });
  }

  return (
    <div className="px-5 pt-3" role="group" aria-label="Modo Viajar o Conducir">
      <Segmented
        value={mode}
        options={OPTIONS}
        onChange={onChange}
        disabled={pending}
      />
    </div>
  );
}

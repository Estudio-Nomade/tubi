"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  /** Total wait window in minutes (from settings). */
  maxMinutes: number;
  /** Fires once when countdown reaches zero. */
  onExpired?: () => void;
  className?: string;
};

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** Pencil WaitTimer WqVkL — client countdown from mount. */
export function WaitTimer({ maxMinutes, onExpired, className }: Props) {
  const totalSeconds = useMemo(
    () => Math.max(0, Math.round(maxMinutes * 60)),
    [maxMinutes],
  );
  const [remaining, setRemaining] = useState(totalSeconds);
  const [expiredFired, setExpiredFired] = useState(false);

  useEffect(() => {
    setRemaining(totalSeconds);
    setExpiredFired(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!expiredFired) {
        setExpiredFired(true);
        onExpired?.();
      }
      return;
    }
    const id = window.setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [remaining, expiredFired, onExpired]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1",
        className,
      )}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="font-heading text-[40px] font-semibold tabular-nums leading-none text-foreground">
        {formatMmSs(remaining)}
      </p>
      <p className="text-xs font-medium text-muted-foreground">
        tiempo de espera
      </p>
    </div>
  );
}

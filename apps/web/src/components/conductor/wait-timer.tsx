"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  maxMinutes: number;
  storageKey: string;
  onExpired?: () => void;
  className?: string;
};

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function computeRemaining(startedAt: number, maxMinutes: number, now: number): number {
  const maxMs = Math.max(0, maxMinutes) * 60 * 1000;
  return Math.max(0, Math.floor((startedAt + maxMs - now) / 1000));
}

function readStartedAt(storageKey: string): number {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw != null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  } catch {
    /* sessionStorage unavailable */
  }
  const now = Date.now();
  try {
    sessionStorage.setItem(storageKey, String(now));
  } catch {
    /* ignore */
  }
  return now;
}

/** Pencil WaitTimer WqVkL — client countdown anchored to sessionStorage. */
export function WaitTimer({ maxMinutes, storageKey, onExpired, className }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const expiredFired = useRef(false);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    expiredFired.current = false;
    const startedAt = readStartedAt(storageKey);

    const tick = () => {
      const next = computeRemaining(startedAt, maxMinutes, Date.now());
      setRemaining(next);
      if (next <= 0 && !expiredFired.current) {
        expiredFired.current = true;
        onExpiredRef.current?.();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [storageKey, maxMinutes]);

  const display = remaining ?? Math.max(0, Math.round(maxMinutes * 60));
  const isExpired = remaining !== null && remaining === 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1",
        isExpired && "rounded-2xl bg-[#FCEBEA] px-4 py-6",
        className,
      )}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <p
        className={cn(
          "font-heading text-[40px] font-semibold tabular-nums leading-none",
          isExpired ? "text-[#B42318]" : "text-foreground",
        )}
      >
        {formatMmSs(display)}
      </p>
      <p
        className={cn(
          "text-xs font-medium",
          isExpired ? "text-[#B42318]" : "text-muted-foreground",
        )}
      >
        {isExpired ? "tiempo agotado" : "tiempo de espera"}
      </p>
    </div>
  );
}

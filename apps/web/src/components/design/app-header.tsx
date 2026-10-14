"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"

const backControlClass =
  "inline-flex size-11 items-center justify-center rounded-xl bg-muted text-foreground transition-colors hover:bg-muted/80"

type AppHeaderProps = {
  showBack?: boolean
  /** Link target when back is navigation (default `/`). */
  backHref?: string
  /** If set, back is a button (e.g. previous wizard step) instead of a link. */
  onBack?: () => void
  /** Accessible name for the back control. */
  backLabel?: string
  roleLabel?: string
  className?: string
}

/** Pencil zJbea — wordmark Tubi, optional back (44) + role chip. */
export function AppHeader({
  showBack = false,
  backHref = "/",
  onBack,
  backLabel = "Volver",
  roleLabel,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "z-40 flex shrink-0 items-center justify-between gap-2 bg-background px-5 pb-2 pt-4",
        className
      )}
    >
      <div className="flex w-11 shrink-0 items-center justify-start">
        {showBack ? (
          onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={backControlClass}
              aria-label={backLabel}
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : (
            <Link
              href={backHref}
              className={backControlClass}
              aria-label={backLabel}
            >
              <ChevronLeft className="size-5" />
            </Link>
          )
        ) : (
          <span className="size-11" aria-hidden />
        )}
      </div>

      <p className="font-heading flex-1 text-center text-xl font-semibold tracking-tight text-foreground">
        Tubi
      </p>

      <div className="flex min-w-11 shrink-0 items-center justify-end">
        {roleLabel ? (
          <span className="rounded-full bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
            {roleLabel}
          </span>
        ) : (
          <span className="size-11" aria-hidden />
        )}
      </div>
    </header>
  )
}

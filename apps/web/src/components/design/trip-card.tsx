import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type TripCardProps = {
  origen: string
  destino: string
  horaLabel: string
  asientosLabel: string
  precioLabel: string
  href: string
  className?: string
}

/**
 * Pencil TripCard — route Fraunces 18 · meta DM 14 · price emphasized · soft hover.
 */
export function TripCard({
  origen,
  destino,
  horaLabel,
  asientosLabel,
  precioLabel,
  href,
  className,
}: TripCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full flex-col gap-2.5 rounded-2xl border border-border bg-card p-4",
        "shadow-[0_4px_16px_rgba(28,25,23,0.06)]",
        "transition-[border-color,box-shadow,transform] duration-150",
        "hover:border-primary/30 hover:shadow-[0_6px_20px_rgba(28,25,23,0.09)]",
        "active:translate-y-px",
        className
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <p className="font-heading min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight text-foreground">
          {origen} → {destino}
        </p>
        <ChevronRight
          className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="min-w-0 text-sm font-medium leading-none text-muted-foreground">
          <span>{horaLabel}</span>
          <span className="mx-1.5 font-normal" aria-hidden>
            ·
          </span>
          <span>{asientosLabel}</span>
        </p>
        <p className="shrink-0 text-right text-base font-semibold leading-none tabular-nums text-foreground">
          {precioLabel}
        </p>
      </div>
    </Link>
  )
}

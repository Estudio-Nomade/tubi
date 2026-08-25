import type { ComponentType } from "react"

import { cn } from "@/lib/utils"

type InfoRowProps = {
  label: string
  value: string
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>
  className?: string
}

/**
 * Pencil InfoRow (AcU21):
 * horizontal · gap 12 · icon 20 muted · label 12 · value 15 medium
 */
export function InfoRow({ label, value, icon: Icon, className }: InfoRowProps) {
  return (
    <div className={cn("flex w-full items-center gap-3", className)}>
      {Icon ? (
        <Icon
          className="size-5 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-[15px] font-medium leading-snug text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

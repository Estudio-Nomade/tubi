import { cn } from "@/lib/utils"

const VARIANT_CLASS = {
  ok: "bg-[#E4EDE5] text-[#5F7A61]",
  /** Pencil accent-soft + accent — pendiente seña */
  pending: "bg-[#F3E0D4] text-[#C45C26]",
  neutral: "bg-[#EFE8DC] text-[#1C1917]",
  danger: "bg-[#FCEBEA] text-[#B42318]",
} as const

export type StatusPillVariant = keyof typeof VARIANT_CLASS


type StatusPillProps = {
  label: string
  variant?: StatusPillVariant
  className?: string
}

/** Pencil StatusPill — DM Sans 12/600, pill 999. */
export function StatusPill({
  label,
  variant = "neutral",
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        VARIANT_CLASS[variant],
        className
      )}
    >
      {label}
    </span>
  )
}

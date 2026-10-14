import { cn } from "@/lib/utils"

const VARIANT_CLASS = {
  ok: "bg-[#E8F5E9] text-[#1B5E20]",
  pending: "bg-[#EEEEEE] text-[#000000]",
  neutral: "bg-[#EEEEEE] text-[#000000]",
  danger: "bg-[#FCE8E6] text-[#E11900]",
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

"use client"

import { cn } from "@/lib/utils"

export type SegmentedOption<T extends string> = {
  value: T
  label: string
}

type SegmentedProps<T extends string> = {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  className?: string
  disabled?: boolean
}

/** Pencil Segmented UT2Ac — h44 surface-2 r12 pad4 gap4. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  disabled,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "flex h-11 w-full items-center gap-1 rounded-xl bg-[#EFE8DC] p-1",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex h-full flex-1 items-center justify-center rounded-lg text-sm transition-colors",
              active
                ? "bg-[#FFFCF7] font-semibold text-foreground shadow-sm"
                : "font-medium text-muted-foreground hover:text-foreground",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type BtnDangerProps = React.ComponentProps<"button"> & {
  asChild?: boolean
}

/** Pencil BtnDanger ygW4c — h 52, danger-soft fill, danger text. */
export function BtnDanger({
  className,
  asChild = false,
  type = "button",
  ...props
}: BtnDangerProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="btn-danger"
      type={asChild ? undefined : type}
      className={cn(
        "inline-flex h-13 w-full shrink-0 items-center justify-center rounded-[14px] bg-[#FCEBEA] px-4 text-[17px] font-semibold text-[#B42318] transition-all outline-none select-none hover:bg-[#FCEBEA]/85 focus-visible:ring-3 focus-visible:ring-destructive/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type BtnSecondaryProps = React.ComponentProps<"button"> & {
  asChild?: boolean
}

export function BtnSecondary({
  className,
  asChild = false,
  type = "button",
  ...props
}: BtnSecondaryProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="btn-secondary"
      type={asChild ? undefined : type}
      className={cn(
        "inline-flex h-13 w-full shrink-0 items-center justify-center rounded-[14px] border border-border bg-transparent px-4 text-[17px] font-semibold text-foreground transition-all outline-none select-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type BtnPrimaryProps = React.ComponentProps<"button"> & {
  asChild?: boolean
}

export function BtnPrimary({
  className,
  asChild = false,
  type = "button",
  ...props
}: BtnPrimaryProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="btn-primary"
      type={asChild ? undefined : type}
      className={cn(
        "inline-flex h-13 w-full shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all outline-none select-none hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

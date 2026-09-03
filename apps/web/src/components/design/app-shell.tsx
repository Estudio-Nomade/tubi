import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppShellProps = {
  children: ReactNode
  className?: string
  /** Prefer dvh; landing may pass min-h-screen. */
  minHeightClassName?: string
}

/** Full-bleed on phones; centered column on wider viewports (max 28rem). */
export function AppShell({
  children,
  className,
  minHeightClassName = "min-h-dvh",
}: AppShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col bg-background",
        minHeightClassName,
        className,
      )}
    >
      {children}
    </div>
  )
}

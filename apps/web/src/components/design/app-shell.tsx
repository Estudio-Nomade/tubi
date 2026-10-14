import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppShellProps = {
  children: ReactNode
  className?: string
  /** Prefer h-dvh max-h-dvh; landing may override. */
  minHeightClassName?: string
}

/** Full-bleed on phones; centered column on wider viewports (max 28rem).
 * Locks to the viewport so browser chrome rubber-band doesn't lift the tab bar.
 */
export function AppShell({
  children,
  className,
  minHeightClassName = "h-dvh max-h-dvh",
}: AppShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col overflow-hidden bg-background",
        minHeightClassName,
        className,
      )}
    >
      {children}
    </div>
  )
}

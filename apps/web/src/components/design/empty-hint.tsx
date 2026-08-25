import { CalendarX } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyHintProps = {
  message: string
  className?: string
}

/** Pencil WDdyn — centered muted icon + message. */
export function EmptyHint({ message, className }: EmptyHintProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 py-6",
        className
      )}
    >
      <CalendarX
        className="size-7 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <p className="max-w-[300px] text-center text-sm font-medium text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

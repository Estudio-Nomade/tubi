import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"

type AppHeaderProps = {
  showBack?: boolean
  backHref?: string
  roleLabel?: string
  className?: string
}

export function AppHeader({
  showBack = false,
  backHref = "/",
  roleLabel,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background px-5",
        className
      )}
    >
      <div className="flex w-10 shrink-0 items-center justify-start">
        {showBack ? (
          <Link
            href={backHref}
            className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
            aria-label="Volver"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : null}
      </div>

      <p className="font-heading flex-1 text-center text-xl font-semibold tracking-tight text-foreground">
        Tubi
      </p>

      <div className="flex w-10 shrink-0 items-center justify-end">
        {roleLabel ? (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {roleLabel}
          </span>
        ) : null}
      </div>
    </header>
  )
}

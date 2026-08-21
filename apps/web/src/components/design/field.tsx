import * as React from "react"

import { cn } from "@/lib/utils"

type FieldProps = React.ComponentProps<"input"> & {
  label: string
  error?: string
}

export function Field({
  label,
  error,
  id,
  className,
  ...props
}: FieldProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={inputId}
        data-slot="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "h-13 w-full min-w-0 rounded-xl border border-border bg-muted px-3.5 text-base font-medium text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

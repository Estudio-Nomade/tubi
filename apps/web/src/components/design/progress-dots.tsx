import { cn } from "@/lib/utils"

type ProgressDotsProps = {
  step: number
  total: number
  className?: string
}

export function ProgressDots({ step, total, className }: ProgressDotsProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Paso ${step} de ${total}`}
    >
      {Array.from({ length: total }, (_, index) => {
        const active = index + 1 === step
        return (
          <span
            key={index}
            className={cn(
              "size-2 rounded-full",
              active ? "bg-primary" : "bg-border"
            )}
          />
        )
      })}
    </div>
  )
}

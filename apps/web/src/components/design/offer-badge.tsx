import { cn } from "@/lib/utils"

import type { OfferSource } from "@/domain/viajes/types"

type OfferBadgeProps = {
  offerSource: OfferSource
  className?: string
}

/**
 * Spec badge: only tubi_operated shows "Operado por Tubi".
 * Peer trips stay unlabeled (particular verificado is implied by KYC elsewhere).
 */
export function OfferBadge({ offerSource, className }: OfferBadgeProps) {
  if (offerSource !== "tubi_operated") return null
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary",
        className,
      )}
    >
      Operado por Tubi
    </span>
  )
}

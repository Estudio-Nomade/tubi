"use client"

import { QRCodeSVG } from "qrcode.react"

import { StatusPill } from "@/components/design/status-pill"
import { cn } from "@/lib/utils"

export type QRPassProps = {
  route: string
  metaLine: string
  qrToken: string
  conductorName?: string
  vehicleLabel?: string
  className?: string
}

/** Pencil QRPass `itlkI` — boarding pass with opaque qr_token. */
export function QRPass({
  route,
  metaLine,
  qrToken,
  conductorName,
  vehicleLabel,
  className,
}: QRPassProps) {
  const tripExtra = [conductorName, vehicleLabel].filter(Boolean).join(" · ")

  return (
    <article
      className={cn(
        "flex w-full max-w-[335px] flex-col items-center gap-4 rounded-2xl bg-[#FFFCF7] p-5 shadow-[0_4px_16px_rgba(28,25,23,0.06)]",
        className
      )}
    >
      <StatusPill label="Confirmada" variant="ok" />

      <p className="font-heading text-center text-[22px] font-semibold leading-tight text-foreground">
        {route}
      </p>

      <p className="text-center text-sm font-medium text-muted-foreground">
        {metaLine}
      </p>

      {tripExtra ? (
        <p className="max-w-[280px] text-center text-[13px] font-medium leading-snug text-muted-foreground">
          {tripExtra}
        </p>
      ) : null}

      <div className="flex size-[200px] items-center justify-center rounded-xl bg-[#EFE8DC]">
        <QRCodeSVG
          value={qrToken}
          size={180}
          level="M"
          bgColor="#EFE8DC"
          fgColor="#1C1917"
          marginSize={1}
          title="Código QR de abordaje"
        />
      </div>

      <p className="max-w-[280px] text-center text-xs font-medium text-muted-foreground">
        Mostralo al conductor. No compartas esta pantalla.
      </p>
    </article>
  )
}

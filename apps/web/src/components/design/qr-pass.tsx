"use client"

import { QRCodeSVG } from "qrcode.react"

import { cn } from "@/lib/utils"

export type QRPassProps = {
  route: string
  metaLine: string
  qrToken: string
  conductorName?: string
  vehicleLabel?: string
  className?: string
}

/** Pencil QRPass `itlkI` — boarding pass, opaque qr_token. */
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
        "flex w-full max-w-[335px] flex-col items-center gap-4 rounded-2xl border border-border/60 bg-[#FFFCF7] px-5 py-5 shadow-[0_4px_16px_rgba(28,25,23,0.06)]",
        className
      )}
    >
      <span className="inline-flex items-center justify-center rounded-full bg-[#E4EDE5] px-2.5 py-1.5 text-xs font-semibold tracking-wide text-[#5F7A61]">
        Confirmada
      </span>

      <div className="flex w-full flex-col items-center gap-1.5">
        <p className="font-heading text-center text-[22px] font-semibold leading-tight tracking-tight text-foreground">
          {route}
        </p>
        <p className="text-center text-sm font-medium leading-snug text-muted-foreground">
          {metaLine}
        </p>
        {tripExtra ? (
          <p className="max-w-[280px] text-center text-[13px] font-normal leading-snug text-muted-foreground/90">
            {tripExtra}
          </p>
        ) : null}
      </div>

      <div className="flex size-[200px] shrink-0 items-center justify-center rounded-xl bg-[#EFE8DC] p-2.5">
        <QRCodeSVG
          value={qrToken}
          size={180}
          level="M"
          bgColor="#EFE8DC"
          fgColor="#1C1917"
          marginSize={0}
          title="Código QR de abordaje"
          className="size-full max-h-[180px] max-w-[180px]"
        />
      </div>

      <p className="max-w-[280px] text-center text-xs font-medium leading-relaxed text-muted-foreground">
        Mostralo al conductor. No compartas esta pantalla.
      </p>
    </article>
  )
}

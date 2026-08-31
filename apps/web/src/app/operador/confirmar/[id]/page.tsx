import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageIcon, Wallet } from "lucide-react";

import { createOperadorSenasRepository } from "@/adapters/supabase/operador-senas-repository";
import { createOperadorSenasService } from "@/application/operador";
import {
  AppHeader,
  InfoRow,
  StatusPill,
  TabBar,
} from "@/components/design";
import { SenaResolveActions } from "@/components/operador/sena-resolve-actions";
import { formatArs, formatHoraAr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Pencil O1 · Confirmar seña */
export default async function ConfirmarSenaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const service = createOperadorSenasService(
    createOperadorSenasRepository(supabase),
  );
  const detail = await service.getReview(id);

  if (!detail) notFound();

  const isPending = detail.pagoEstado === "pendiente";
  const tripLine = `${formatHoraAr(detail.fechaSalida)} · ${detail.origen} → ${detail.destino}`;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/operador" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-2">
        <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
          Confirmar seña
        </h1>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 flex-col gap-1">
              <p className="text-[17px] font-semibold text-foreground">
                {detail.pasajeroNombre}
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                {tripLine}
              </p>
            </div>
            <StatusPill
              label={
                detail.pagoEstado === "pendiente"
                  ? "Pendiente"
                  : detail.pagoEstado === "confirmado"
                    ? "Confirmada"
                    : "Rechazada"
              }
              variant={
                detail.pagoEstado === "pendiente"
                  ? "pending"
                  : detail.pagoEstado === "confirmado"
                    ? "ok"
                    : "danger"
              }
            />
          </div>
          <InfoRow
            icon={Wallet}
            label="Monto de seña"
            value={formatArs(detail.monto)}
          />
        </section>

        {/* Comprobante preview — Pencil h 160 surface-2 */}
        <section className="flex min-h-40 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-[#EFE8DC]">
          {detail.signedComprobanteUrl && detail.comprobanteIsImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={detail.signedComprobanteUrl}
              alt="Comprobante de transferencia"
              className="max-h-56 w-full object-contain"
            />
          ) : detail.signedComprobanteUrl ? (
            <a
              href={detail.signedComprobanteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Abrir comprobante (PDF)
            </a>
          ) : (
            <>
              <ImageIcon
                className="size-8 text-muted-foreground"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="text-sm font-medium text-muted-foreground">
                Comprobante
              </p>
            </>
          )}
        </section>

        <div className="mt-auto flex flex-col gap-3">
          {isPending ? (
            <SenaResolveActions pagoId={detail.pagoId} />
          ) : (
            <Link
              href="/operador"
              className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Volver a la lista
            </Link>
          )}
        </div>
      </main>
      <TabBar variant="operador" active="senas" />
    </div>
  );
}

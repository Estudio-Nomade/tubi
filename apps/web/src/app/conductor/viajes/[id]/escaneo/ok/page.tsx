import Link from "next/link";
import { Check, MapPin } from "lucide-react";

import {
  AppHeader,
  BtnPrimary,
  InfoRow,
  StatusPill,
} from "@/components/design";
import { formatFechaHoraAr, formatHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Pencil C9 · Escaneo OK → CTA Cobrar saldo */
export default async function ConductorEscaneoOkPage({
  params,
  searchParams,
}: PageProps) {
  await requireProfile(["conductor", "operador"]);
  const { id } = await params;
  const q = await searchParams;

  const reservaId = typeof q.reserva === "string" ? q.reserva : "";
  const nombre = typeof q.nombre === "string" ? q.nombre : "Pasajero";
  const origen = typeof q.origen === "string" ? q.origen : "";
  const destino = typeof q.destino === "string" ? q.destino : "";
  const fecha = typeof q.fecha === "string" ? q.fecha : "";

  const meta = [
    fecha ? formatHoraAr(fecha) : null,
    origen && destino ? `${origen} → ${destino}` : null,
    "seña OK",
  ]
    .filter(Boolean)
    .join(" · ");

  const cobrarHref = reservaId
    ? `/conductor/viajes/${id}/saldo/${reservaId}`
    : `/conductor/viajes/${id}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader
        showBack
        backHref={`/conductor/viajes/${id}`}
        roleLabel="Conductor"
      />
      <main className="flex flex-1 flex-col items-center gap-5 px-5 pb-8 pt-4">
        <div className="flex size-[72px] items-center justify-center rounded-full bg-[#E4EDE5] shadow-[0_0_0_8px_rgba(228,237,229,0.55)]">
          <Check className="size-8 text-[#5F7A61]" strokeWidth={2.5} />
        </div>

        <div className="flex flex-col items-center gap-2.5">
          <h1 className="font-heading text-center text-[28px] font-semibold leading-tight text-foreground">
            Reserva válida
          </h1>
          <StatusPill label="Verificada" variant="ok" />
        </div>

        <section className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <p className="font-heading text-[22px] font-semibold leading-tight text-foreground">
            {nombre}
          </p>
          <InfoRow icon={MapPin} label="Parada" value={origen || "—"} />
          {meta ? (
            <p className="text-[13px] font-medium text-muted-foreground">
              {meta}
            </p>
          ) : null}
          {fecha ? (
            <p className="sr-only">{formatFechaHoraAr(fecha)}</p>
          ) : null}
        </section>

        <div className="mt-auto flex w-full flex-col gap-3 pt-4">
          <BtnPrimary asChild>
            <Link href={cobrarHref}>Cobrar saldo</Link>
          </BtnPrimary>
          <p className="text-center text-xs font-medium text-muted-foreground">
            Registrá el pago y marcá al pasajero como abordado.
          </p>
        </div>
      </main>
    </div>
  );
}

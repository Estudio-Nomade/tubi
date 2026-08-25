import Link from "next/link";
import { X } from "lucide-react";

import {
  AppHeader,
  BtnPrimary,
  BtnSecondary,
} from "@/components/design";
import { verifyErrorUserMessage } from "@/domain/conductor";
import type { VerifyQrFailureCode } from "@/domain/conductor";
import { requireProfile } from "@/lib/auth/require-profile";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asCode(raw: string | undefined): VerifyQrFailureCode {
  if (
    raw === "QR_YA_VERIFICADO" ||
    raw === "NO_AUTORIZADO" ||
    raw === "NO_ENCONTRADO" ||
    raw === "NO_AUTENTICADO"
  ) {
    return raw;
  }
  return "QR_INVALIDO";
}

/** Pencil C10 · Escaneo inválido */
export default async function ConductorEscaneoErrorPage({
  params,
  searchParams,
}: PageProps) {
  await requireProfile(["conductor", "operador"]);
  const { id } = await params;
  const q = await searchParams;
  const code = asCode(typeof q.code === "string" ? q.code : undefined);
  const isAlready = code === "QR_YA_VERIFICADO";

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader
        showBack
        backHref={`/conductor/viajes/${id}`}
        roleLabel="Conductor"
      />
      <main className="flex flex-1 flex-col items-center gap-5 px-5 pb-8 pt-4">
        <div className="flex size-[72px] items-center justify-center rounded-full bg-[#FCEBEA] shadow-[0_0_0_8px_rgba(252,235,234,0.55)]">
          <X className="size-8 text-[#B42318]" strokeWidth={2.5} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="font-heading text-center text-[28px] font-semibold leading-tight text-foreground">
            {isAlready ? "Ya verificado" : "QR inválido"}
          </h1>
          <p className="max-w-[300px] text-center text-sm font-normal leading-relaxed text-muted-foreground">
            {verifyErrorUserMessage(code)}
          </p>
        </div>

        <div className="flex w-full flex-col gap-1 rounded-xl bg-[#FCEBEA] p-3.5">
          <p className="text-sm font-semibold text-[#B42318]">
            {isAlready ? "Sin cambios" : "No autorizado"}
          </p>
          <p className="text-[13px] font-normal leading-snug text-[#B42318]">
            {isAlready
              ? "Este pasajero ya figura como verificado en el viaje."
              : "Pedile que abra el QR de esta reserva en Tubi."}
          </p>
        </div>

        <div className="mt-auto flex w-full flex-col gap-3 pt-4">
          <BtnPrimary asChild>
            <Link href={`/conductor/viajes/${id}/escanear`}>
              Escanear de nuevo
            </Link>
          </BtnPrimary>
          <BtnSecondary asChild>
            <Link href={`/conductor/viajes/${id}`}>Volver a la lista</Link>
          </BtnSecondary>
        </div>
      </main>
    </div>
  );
}

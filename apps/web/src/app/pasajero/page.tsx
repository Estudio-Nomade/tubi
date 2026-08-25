import Link from "next/link";

import { createSupabasePagosRepository } from "@/adapters/supabase/pagos-repository";
import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { createPagosService } from "@/application/pagos";
import { createReservasService } from "@/application/reservas";
import {
  AppHeader,
  BtnPrimary,
  EmptyHint,
  StatusPill,
  TabBar,
} from "@/components/design";
import { formatArs, formatFechaHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Pencil P2 empty / P7 with active reservation. */
export default async function PasajeroPage({ searchParams }: PageProps) {
  const profile = await requireProfile(["pasajero", "operador"]);
  const params = await searchParams;
  const justCreated =
    typeof params.reserva === "string" && params.reserva.length > 0;

  const supabase = await createClient();
  const reservas = createReservasService(
    createSupabaseReservasRepository(supabase),
  );
  const pagos = createPagosService(createSupabasePagosRepository(supabase));
  const active = await reservas.getLatestActive(profile.id);
  const senaPago = active
    ? await pagos.getSenaByReserva(active.reserva.id)
    : null;

  const isConfirmada = active?.reserva.estado === "confirmada";
  const isVerificada = active?.reserva.estado === "verificada";
  const isAbordada = active?.reserva.estado === "abordada";
  const isPendienteSena = active?.reserva.estado === "pendiente_sena";
  const senaRechazada = senaPago?.estado === "rechazado";
  const senaEnRevision = senaPago?.estado === "pendiente";
  const hasConfirmedPass = await reservas.hasConfirmedBoardingPass(profile.id);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-5 px-5 pt-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Hola, {profile.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">Tu próximo viaje</p>
        </div>

        {justCreated ? (
          <p
            className="rounded-xl bg-[#E4EDE5] px-3 py-2 text-sm font-medium text-[#5F7A61]"
            role="status"
          >
            Reserva creada. Pendiente de seña.
          </p>
        ) : null}

        {active ? (
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
            <StatusPill
              label={
                isAbordada
                  ? "A bordo"
                  : isVerificada
                    ? "Verificada"
                    : isConfirmada
                      ? "Confirmada"
                      : senaRechazada
                        ? "Seña rechazada"
                        : senaEnRevision
                          ? "Seña en revisión"
                          : "Pendiente de seña"
              }
              variant={
                isAbordada || isVerificada || isConfirmada
                  ? "ok"
                  : senaRechazada
                    ? "danger"
                    : "pending"
              }
              className="self-start"
            />

            <div className="flex flex-col gap-1">
              <p className="font-heading text-[22px] font-semibold leading-tight text-foreground">
                {active.origen} → {active.destino}
              </p>
              <p className="text-sm font-normal text-muted-foreground">
                {formatFechaHoraAr(active.fechaSalida)}
              </p>
            </div>

            {isPendienteSena ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F3E0D4]/70 px-3 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-[#C45C26]">
                    {senaEnRevision
                      ? "Seña enviada"
                      : senaRechazada
                        ? "Seña a reenviar"
                        : "Seña a transferir"}
                  </span>
                  <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
                    {formatArs(active.reserva.montoSena)}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Viaje {formatArs(active.precioViaje)}
                </span>
              </div>
            ) : null}

            {senaRechazada ? (
              <p className="text-sm font-medium text-muted-foreground">
                El comprobante no fue aceptado. Podés transferir de nuevo y
                reenviar.
              </p>
            ) : null}

            {isAbordada ? (
              <p className="text-sm font-medium text-muted-foreground">
                Ya estás a bordo. Buen viaje.
              </p>
            ) : null}

            {isVerificada ? (
              <p className="text-sm font-medium text-muted-foreground">
                El conductor ya escaneó tu QR. Pagá el saldo al subir.
              </p>
            ) : null}

            {hasConfirmedPass && !isAbordada ? (
              <BtnPrimary asChild>
                <Link href="/pasajero/pase">Ver mi QR</Link>
              </BtnPrimary>
            ) : null}

            {isPendienteSena && !senaEnRevision ? (
              <BtnPrimary asChild>
                <Link href={`/pasajero/reservas/${active.reserva.id}/sena`}>
                  {senaRechazada ? "Reenviar comprobante" : "Completar seña"}
                </Link>
              </BtnPrimary>
            ) : null}

            {senaEnRevision ? (
              <BtnPrimary asChild>
                <Link
                  href={`/pasajero/reservas/${active.reserva.id}/en-revision`}
                >
                  Ver estado de seña
                </Link>
              </BtnPrimary>
            ) : null}
          </section>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
              <EmptyHint message="Todavía no tenés un viaje" />
            </div>
            <BtnPrimary asChild>
              <Link href="/pasajero/buscar">Buscar viaje</Link>
            </BtnPrimary>
          </>
        )}

        <Link
          href="/pasajero/reservas"
          className="inline-flex h-11 w-full items-center justify-center rounded-[14px] border border-border bg-card text-sm font-semibold text-foreground"
        >
          Mis reservas
        </Link>

        {active ? (
          <Link
            href="/pasajero/buscar"
            className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Buscar otro viaje
          </Link>
        ) : null}

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="pasajero" active="inicio" />
    </div>
  );
}

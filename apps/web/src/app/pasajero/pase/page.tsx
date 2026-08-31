import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { createSupabaseReservasRepository } from "@/adapters/supabase/reservas-repository";
import { createReservasService } from "@/application/reservas";
import {
  AppHeader,
  BtnPrimary,
  EmptyHint,
  TabBar,
} from "@/components/design";
import { formatFechaHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

/** Index: 0 empty · 1 redirect · N list of confirmed boarding passes. */
export default async function PasajeroPaseIndexPage() {
  const profile = await requireProfile(["pasajero"]);
  const supabase = await createClient();
  const reservas = createReservasService(
    createSupabaseReservasRepository(supabase),
  );
  const list = await reservas.listConfirmedBoardingSummaries(profile.id);

  if (list.length === 1) {
    redirect(`/pasajero/pase/${list[0].reservaId}`);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/pasajero" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-2">
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Tu pase
        </h1>

        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="w-full rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
              <EmptyHint message="Todavía no tenés un pase de abordaje. Se habilita cuando la seña está confirmada." />
            </div>
            <BtnPrimary asChild>
              <Link href="/pasajero/reservas">Ver mis reservas</Link>
            </BtnPrimary>
            <Link
              href="/pasajero/buscar"
              className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Buscar viaje
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((item) => (
              <li key={item.reservaId}>
                <Link
                  href={`/pasajero/pase/${item.reservaId}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)] transition-colors hover:bg-card/80"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-heading text-lg font-semibold leading-tight text-foreground">
                      {item.origen} → {item.destino}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      {formatFechaHoraAr(item.fechaSalida)}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <TabBar variant="pasajero" active="qr" />
    </div>
  );
}

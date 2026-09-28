import { createSupabaseCuponesRepository } from "@/adapters/supabase/cupones-repository";
import { createCuponesService } from "@/application/cupones";
import {
  AppHeader,
  EmptyHint,
  StatusPill,
  type StatusPillVariant,
  TabBar,
} from "@/components/design";
import { CanjearCuponForm } from "@/components/pasajero/canjear-cupon-form";
import type { CuponUsuario, EstadoCuponUsuario } from "@/domain/cupones";
import { formatArs, formatFechaHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

function statusForEstado(estado: EstadoCuponUsuario): {
  label: string;
  variant: StatusPillVariant;
} {
  switch (estado) {
    case "disponible":
      return { label: "Disponible", variant: "ok" };
    case "reservado":
      return { label: "Reservado", variant: "pending" };
    case "usado":
      return { label: "Usado", variant: "pending" };
    case "vencido":
      return { label: "Vencido", variant: "danger" };
    case "anulado":
      return { label: "Anulado", variant: "danger" };
    default:
      return { label: estado, variant: "pending" };
  }
}

function sortMine(list: CuponUsuario[]): CuponUsuario[] {
  return [...list].sort((a, b) => {
    const aDisp = a.estado === "disponible" ? 0 : 1;
    const bDisp = b.estado === "disponible" ? 0 : 1;
    if (aDisp !== bDisp) return aDisp - bDisp;
    return a.venceEn.localeCompare(b.venceEn);
  });
}

export default async function PasajeroCuponesPage() {
  const profile = await requireProfile(["pasajero"]);

  const supabase = await createClient();
  const cupones = createCuponesService(
    createSupabaseCuponesRepository(supabase),
  );
  const list = sortMine(await cupones.listMine(profile.id));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/pasajero" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-2">
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Mis cupones
        </h1>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <p className="text-sm font-medium text-muted-foreground">
            ¿Tenés un código? Canjealo acá.
          </p>
          <CanjearCuponForm />
        </section>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
            <EmptyHint message="Todavía no tenés cupones. Canjeá un código para empezar." />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((item) => {
              const status = statusForEstado(item.estado);
              return (
                <li key={item.id}>
                  <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
                    <StatusPill
                      label={status.label}
                      variant={status.variant}
                      className="self-start"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="font-heading text-[22px] font-semibold leading-tight text-foreground">
                        {formatArs(item.montoDescuento)}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {item.codigoCampania}
                      </p>
                      <p className="text-sm font-normal text-muted-foreground">
                        Vence {formatFechaHoraAr(item.venceEn)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <TabBar variant="pasajero" active="inicio" />
    </div>
  );
}

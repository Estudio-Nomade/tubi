import { createSupabaseCuponesRepository } from "@/adapters/supabase/cupones-repository";
import { createCuponesService } from "@/application/cupones";
import {
  AppHeader,
  EmptyHint,
  StatusPill,
  TabBar,
} from "@/components/design";
import { CampaniaActivaToggle } from "@/components/operador/campania-activa-toggle";
import { CampaniaForm } from "@/components/operador/campania-form";
import type { CuponCampania } from "@/domain/cupones";
import { formatArs, formatFechaHoraAr } from "@/lib/format";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

function cuposLabel(c: CuponCampania): string {
  if (c.cuposTotales == null) {
    return `${c.cuposUsados} usados · ilimitado`;
  }
  return `${c.cuposUsados}/${c.cuposTotales} cupos`;
}

export default async function OperadorCuponesPage() {
  await requireProfile(["operador"]);

  const supabase = await createClient();
  const service = createCuponesService(
    createSupabaseCuponesRepository(supabase),
  );
  const campanias = await service.listCampanias();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/operador" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-4 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Cupones
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {campanias.length === 0
              ? "Sin campañas"
              : `${campanias.length} campaña${campanias.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
          <h2 className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Nueva campaña
          </h2>
          <CampaniaForm />
        </section>

        {campanias.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
            <EmptyHint message="No hay campañas. Creá una con un código y un monto." />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {campanias.map((c) => (
              <li key={c.id}>
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <p className="font-heading text-[17px] font-semibold text-foreground">
                        {c.codigo}
                      </p>
                      <p className="text-base font-semibold tabular-nums text-foreground">
                        {formatArs(c.montoDescuento)}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {cuposLabel(c)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFechaHoraAr(c.vigenciaDesde)} →{" "}
                        {formatFechaHoraAr(c.vigenciaHasta)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.validoDiasPostCanje} días post canje · máx.{" "}
                        {c.maxPorUsuario}/usuario
                      </p>
                    </div>
                    <StatusPill
                      label={c.activa ? "Activa" : "Inactiva"}
                      variant={c.activa ? "ok" : "neutral"}
                    />
                  </div>
                  <div className="border-t border-border pt-3">
                    <CampaniaActivaToggle id={c.id} activa={c.activa} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="operador" active="settings" />
    </div>
  );
}

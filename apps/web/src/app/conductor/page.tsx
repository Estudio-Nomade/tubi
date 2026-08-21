import { AppHeader, BtnSecondary, EmptyHint, TabBar } from "@/components/design";
import { requireProfile } from "@/lib/auth/require-profile";

/** Pencil C2 · Home empty (Slice 1 stub — no viajes assigned yet). */
export default async function ConductorPage() {
  const profile = await requireProfile(["conductor", "operador"]);
  const displayName = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-5 px-5 pt-4">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Hola, {displayName || profile.nombre}
          </h1>
          <span className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            Conductor
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-sm">
          <EmptyHint message="No hay viajes asignados hoy" />
        </div>

        <p className="text-sm text-muted-foreground">
          Coordiná con el operador si creés que falta uno
        </p>

        <BtnSecondary disabled title="Próximamente">
          Ver agenda
        </BtnSecondary>

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="conductor" active="inicio" />
    </div>
  );
}

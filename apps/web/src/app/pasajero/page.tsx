import { AppHeader, BtnPrimary, EmptyHint, TabBar } from "@/components/design";
import { requireProfile } from "@/lib/auth/require-profile";

/** Pencil P2 · Home empty (Slice 1 stub — no reservas yet). */
export default async function PasajeroPage() {
  const profile = await requireProfile(["pasajero", "operador"]);

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

        <div className="rounded-2xl border border-border bg-card px-4 py-2 shadow-sm">
          <EmptyHint message="Todavía no tenés un viaje" />
        </div>

        <BtnPrimary disabled title="Próximamente">
          Buscar viaje
        </BtnPrimary>

        <div className="flex-1" aria-hidden />
      </main>
      <TabBar variant="pasajero" active="inicio" />
    </div>
  );
}

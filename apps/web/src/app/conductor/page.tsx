import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";
import { AppHeader } from "@/components/design";

export default async function ConductorPage() {
  const profile = await requireProfile(["conductor", "operador"]);
  const displayName = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex min-h-screen max-w-[375px] flex-col bg-background">
      <AppHeader roleLabel="Conductor" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Hola, {displayName}
          </h1>
          <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Conductor
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            No tenés viajes programados por ahora
          </p>
        </div>

        <Link
          href="/cuenta"
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Tu cuenta
        </Link>
      </main>
    </div>
  );
}

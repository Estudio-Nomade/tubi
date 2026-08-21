import Link from "next/link";

import { AppHeader } from "@/components/design";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function OperadorPage() {
  await requireProfile(["operador"]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pt-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Panel operador
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Herramientas de operación
          </p>
        </div>

        <Link
          href="/dev/settings"
          className="rounded-2xl border border-border bg-card p-5 text-sm font-medium text-primary shadow-sm"
        >
          Ver settings (dev)
        </Link>

        <Link
          href="/cuenta"
          className="text-center text-sm font-medium text-primary"
        >
          Tu cuenta
        </Link>
      </main>
    </div>
  );
}

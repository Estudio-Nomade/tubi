import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";
import { AppHeader } from "@/components/design";

export default async function OperadorPage() {
  await requireProfile(["operador"]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[375px] flex-col bg-background">
      <AppHeader roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Panel operador
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Herramientas de operación
          </p>
        </div>

        <Link
          href="/dev/settings"
          className="rounded-2xl border border-border bg-card p-5 text-sm font-medium text-primary shadow-sm underline-offset-4 hover:underline"
        >
          Ver settings (dev)
        </Link>

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

import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile, homePathForRol } from "@/application/auth";
import { AppHeader, BtnPrimary } from "@/components/design";

export default async function Home() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(homePathForRol(profile.rol));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[375px] flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
            Tubi
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Viajes compartidos interurbanos · Tandil ↔ Buenos Aires
          </p>
        </div>

        <div className="mt-auto flex flex-col items-center gap-4">
          <BtnPrimary asChild>
            <Link href="/login">Ingresar</Link>
          </BtnPrimary>
          <Link
            href="/registro"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Crear cuenta
          </Link>
        </div>
      </main>
    </div>
  );
}

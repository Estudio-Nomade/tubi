import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile, homePathForRol } from "@/application/auth";
import { BtnPrimary, BtnSecondary } from "@/components/design";

const TRUST_CHIPS = [
  "Viajes programados",
  "Seña de compromiso",
  "Identificación con QR",
] as const;

export default async function Home() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(homePathForRol(profile.rol));
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <main className="flex flex-1 flex-col px-5 pb-8 pt-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-5">
            <Image
              src="/brand/logo.png"
              alt="Tubi"
              width={160}
              height={133}
              priority
              className="h-auto w-[160px]"
            />
            <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Tubi
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 text-center">
            <h1 className="font-heading text-[26px] font-semibold leading-tight text-foreground">
              Viajes compartidos Tandil ↔ Buenos Aires
            </h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Salí con horario, conductor y lugar de encuentro claros. Reservá
              con seña y viajá con tu pase QR.
            </p>
          </div>

          <ul className="flex w-full flex-wrap items-center justify-center gap-2">
            {TRUST_CHIPS.map((label) => (
              <li
                key={label}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex w-full flex-col gap-3">
          <BtnPrimary asChild>
            <Link href="/login">Ingresar</Link>
          </BtnPrimary>
          <BtnSecondary asChild>
            <Link href="/registro">Crear cuenta</Link>
          </BtnSecondary>
          <Link
            href="/login?rol=operador"
            className="text-center text-xs font-medium text-muted-foreground"
          >
            Soy operador
          </Link>
        </div>
      </main>
    </div>
  );
}

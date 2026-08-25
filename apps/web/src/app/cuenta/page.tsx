import Link from "next/link";

import { homePathForRol, signOutAction } from "@/application/auth";
import {
  AppHeader,
  BtnSecondary,
  TabBar,
} from "@/components/design";
import type { Rol } from "@/domain/auth";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

const ROL_LABEL: Record<Rol, string> = {
  pasajero: "Pasajero",
  conductor: "Conductor",
  operador: "Operador",
};

/** Pencil P12 / C11 — avatar, data card, logout, TabBar when passenger/driver. */
export default async function CuentaPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");
  const initial = (profile.nombre.trim().charAt(0) || "?").toUpperCase();
  const email = user?.email ?? null;
  const backHref = homePathForRol(profile.rol);

  const rows: { label: string; value: string }[] = [];
  if (profile.rol === "pasajero" && profile.dni) {
    rows.push({ label: "DNI", value: profile.dni });
  }
  if (profile.telefono) {
    rows.push({ label: "Contacto", value: profile.telefono });
  }
  if (email) {
    rows.push({ label: "Email", value: email });
  }

  const showTabBar =
    profile.rol === "pasajero" || profile.rol === "conductor";
  const tabVariant = profile.rol === "conductor" ? "conductor" : "pasajero";

  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref={backHref} />
      <main className="flex flex-1 flex-col gap-5 px-5 py-4">
        <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
          Tu cuenta
        </h1>

        <div className="flex items-center gap-3.5">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-[22px] font-semibold text-primary"
            aria-hidden
          >
            {initial}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-[17px] font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-[13px] font-medium text-muted-foreground">
              {ROL_LABEL[profile.rol]}
            </p>
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-sm">
            {rows.map((row, i) => (
              <div key={row.label}>
                {i > 0 ? (
                  <div className="mx-4 h-px bg-border" aria-hidden />
                ) : null}
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <span className="text-sm font-medium text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground">
                    {row.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex-1" aria-hidden />

        {profile.rol === "pasajero" || profile.rol === "operador" ? (
          <Link
            href="/pasajero/reservas"
            className="inline-flex h-11 w-full items-center justify-center rounded-[14px] border border-border bg-card text-sm font-semibold text-foreground"
          >
            Mis reservas
          </Link>
        ) : null}

        <form action={signOutAction}>
          <BtnSecondary type="submit">Cerrar sesión</BtnSecondary>
        </form>
      </main>
      {showTabBar ? <TabBar variant={tabVariant} active="cuenta" /> : null}
    </div>
  );
}

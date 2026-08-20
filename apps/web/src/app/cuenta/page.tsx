import { homePathForRol, signOutAction } from "@/application/auth";
import { AppHeader, BtnSecondary } from "@/components/design";
import type { Rol } from "@/domain/auth";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

const ROL_LABEL: Record<Rol, string> = {
  pasajero: "Pasajero",
  conductor: "Conductor",
  operador: "Operador",
};

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
    rows.push({ label: "Teléfono", value: profile.telefono });
  }
  if (email) {
    rows.push({ label: "Email", value: email });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref={backHref} />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
          Tu cuenta
        </h1>

        <div className="flex items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
            aria-hidden
          >
            {initial}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-base font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              {ROL_LABEL[profile.rol]}
            </p>
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={
                  i > 0
                    ? "flex items-center justify-between gap-3 border-t border-border px-4 py-3.5"
                    : "flex items-center justify-between gap-3 px-4 py-3.5"
                }
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="truncate text-sm font-medium text-foreground">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-auto">
          <form action={signOutAction}>
            <BtnSecondary type="submit">Cerrar sesión</BtnSecondary>
          </form>
        </div>
      </main>
    </div>
  );
}

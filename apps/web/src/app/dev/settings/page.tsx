/**
 * Temporary smoke page for Slice 0.5 — remove once settings are used in real UI.
 * Requires NEXT_PUBLIC_SUPABASE_* and migrations applied (0001 + 0002).
 */

import { getSettings } from "@/application/settings";
import { SETTING_KEYS, type Setting } from "@/domain/settings";

export const dynamic = "force-dynamic";

export default async function DevSettingsPage() {
  let settings: Setting[] = [];
  let errorMessage: string | null = null;

  try {
    settings = await getSettings();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  const sena = settings.find((s) => s.clave === SETTING_KEYS.RESERVA_SENA_MONTO);

  return (
    <main className="mx-auto max-w-[375px] space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Dev · settings</h1>
      <p className="text-sm text-muted-foreground">
        Smoke test del lector de settings (AD-5). No es una pantalla de producto.
      </p>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="font-medium">No se pudieron leer settings</p>
          <p className="mt-1 break-words">{errorMessage}</p>
          <p className="mt-2 text-muted-foreground">
            Verificá .env.local, migraciones aplicadas y políticas RLS de lectura.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm">
            Filas: <strong>{settings.length}</strong>
            {sena ? (
              <>
                {" "}
                · seña ({SETTING_KEYS.RESERVA_SENA_MONTO}):{" "}
                <strong>{String(sena.valor)}</strong>
              </>
            ) : null}
          </p>
          <ul className="space-y-2 text-sm">
            {settings.map((item) => (
              <li
                key={item.clave}
                className="rounded-lg border border-border px-3 py-2"
              >
                <div className="font-medium">{item.clave}</div>
                <div className="text-muted-foreground">
                  {item.tipo}: {JSON.stringify(item.valor)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

import { getSettings } from "@/application/settings";
import { OperadorSettingsForm } from "@/components/operador/settings-form";
import { AppHeader, TabBar } from "@/components/design";
import type { Setting } from "@/domain/settings";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperadorSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ok = typeof params.ok === "string" ? params.ok : null;

  let settings: Setting[] = [];
  let loadError: string | null = null;
  try {
    settings = await getSettings();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Error al cargar settings.";
  }

  const map = new Map(settings.map((s) => [s.clave, s]));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/operador" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-4 px-5 pb-4 pt-3">
        <h1 className="font-heading text-[22px] font-semibold leading-tight text-foreground">
          Configuración
        </h1>

        {ok === "1" ? (
          <p
            className="rounded-xl bg-[#E4EDE5] px-3 py-2 text-sm font-medium text-[#5F7A61]"
            role="status"
          >
            Cambios guardados.
          </p>
        ) : null}

        {loadError ? (
          <p
            className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-sm font-medium text-[#B42318]"
            role="alert"
          >
            No se pudieron cargar los parámetros. {loadError}
          </p>
        ) : (
          <OperadorSettingsForm initial={map} />
        )}
      </main>
      <TabBar variant="operador" active="settings" />
    </div>
  );
}

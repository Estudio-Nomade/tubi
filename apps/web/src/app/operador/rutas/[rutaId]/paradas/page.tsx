import { notFound } from "next/navigation";

import { createOperadorParadasRepository } from "@/adapters/supabase/operador-paradas-repository";
import { createOperadorParadasService } from "@/application/operador";
import { AppHeader, TabBar } from "@/components/design";
import { ParadasEditor } from "@/components/operador/paradas-editor";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ rutaId: string }>;
};

export default async function OperadorRutaParadasPage({ params }: PageProps) {
  const { rutaId } = await params;

  const supabase = await createClient();
  const service = createOperadorParadasService(
    createOperadorParadasRepository(supabase),
  );

  const ruta = await service.getRuta(rutaId);
  if (!ruta) notFound();
  const paradas = await service.listParadas(rutaId);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/operador/viajes" roleLabel="Operador" />
      <main className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[22px] font-semibold text-foreground">
            Paradas de la ruta
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {ruta.origen} → {ruta.destino}
          </p>
        </div>

        <ParadasEditor ruta={ruta} paradas={paradas} />
      </main>
      <TabBar variant="operador" active="viajes" />
    </div>
  );
}

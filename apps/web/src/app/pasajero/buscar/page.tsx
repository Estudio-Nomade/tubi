import { AppHeader, TabBar } from "@/components/design";
import { SearchForm } from "@/components/pasajero/search-form";

/** Pencil P3 · Búsqueda */
export default function BuscarPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/pasajero" />
      <main className="flex flex-1 flex-col gap-6 px-5 pt-2 pb-4">
        <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
          ¿A dónde vas?
        </h1>
        <SearchForm />
      </main>
      <TabBar variant="pasajero" active="buscar" />
    </div>
  );
}

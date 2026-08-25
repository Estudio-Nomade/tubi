import Link from "next/link";

type Props = {
  active?: "senas" | "viajes" | "devoluciones" | "settings";
  devolucionesCount?: number;
};

const linkClass =
  "text-sm font-medium text-primary underline-offset-4 hover:underline";
const mutedClass =
  "text-sm font-medium text-muted-foreground underline-offset-4 hover:underline";

export function OperadorNav({ active, devolucionesCount = 0 }: Props) {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
      aria-label="Secciones operador"
    >
      <Link
        href="/operador"
        className={active === "senas" ? linkClass : mutedClass}
      >
        Señas
      </Link>
      <Link
        href="/operador/viajes"
        className={active === "viajes" ? linkClass : mutedClass}
      >
        Viajes
      </Link>
      <Link
        href="/operador/devoluciones"
        className={active === "devoluciones" ? linkClass : mutedClass}
      >
        Devoluciones
        {devolucionesCount > 0 ? ` (${devolucionesCount})` : ""}
      </Link>
      <Link
        href="/operador/settings"
        className={active === "settings" ? linkClass : mutedClass}
      >
        Settings
      </Link>
      <Link href="/cuenta" className={mutedClass}>
        Tu cuenta
      </Link>
    </nav>
  );
}

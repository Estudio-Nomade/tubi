import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { AppHeader } from "@/components/design";

export const metadata: Metadata = {
  title: "Ingresar",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Pencil P10 · Login */
export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rol = first(params.rol);
  const backHref =
    rol === "conductor"
      ? "/registro/conductor"
      : rol === "operador"
        ? "/registro/operador"
        : rol === "pasajero"
          ? "/registro"
          : "/";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref={backHref} />
      <LoginForm rol={rol} />
    </div>
  );
}

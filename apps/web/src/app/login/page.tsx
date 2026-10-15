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

/** Unified login — role query ignored for UX (deep links still land here). */
export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const authError = first(params.error);

  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
      <AppHeader showBack backHref="/" backLabel="Ir al inicio" />
      <LoginForm authError={authError} />
    </div>
  );
}

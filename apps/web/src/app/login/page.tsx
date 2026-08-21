import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { AppHeader } from "@/components/design";

export const metadata: Metadata = {
  title: "Ingresar",
};

/** Pencil P10 · Login */
export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/" />
      <LoginForm />
    </div>
  );
}

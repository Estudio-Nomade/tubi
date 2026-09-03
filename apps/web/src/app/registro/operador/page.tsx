import type { Metadata } from "next";

import { RegisterOperadorWizard } from "@/components/auth/register-operador-wizard";
import { AppHeader } from "@/components/design";

export const metadata: Metadata = {
  title: "Registro operador",
};

/** Alta de cuenta de operador (self-service, gated por setting). */
export default function RegistroOperadorPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/login?rol=operador" />
      <RegisterOperadorWizard />
    </div>
  );
}

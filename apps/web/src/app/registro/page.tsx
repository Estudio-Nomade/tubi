import type { Metadata } from "next";

import { RegisterPasajeroWizard } from "@/components/auth/register-pasajero-wizard";
import { AppHeader } from "@/components/design";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegistroPasajeroPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[375px] flex-col bg-background">
      <AppHeader showBack backHref="/login" />
      <RegisterPasajeroWizard />
    </div>
  );
}

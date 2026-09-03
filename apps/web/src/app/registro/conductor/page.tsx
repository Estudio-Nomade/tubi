import type { Metadata } from "next";

import { RegisterConductorWizard } from "@/components/auth/register-conductor-wizard";
import { AppHeader } from "@/components/design";

export const metadata: Metadata = {
  title: "Registro conductor",
};

/** Pencil C1 · Registro conductor */
export default function RegistroConductorPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AppHeader showBack backHref="/login?rol=conductor" />
      <RegisterConductorWizard />
    </div>
  );
}

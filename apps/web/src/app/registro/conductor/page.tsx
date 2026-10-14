import type { Metadata } from "next";

import { RegisterConductorWizard } from "@/components/auth/register-conductor-wizard";

export const metadata: Metadata = {
  title: "Registro conductor",
};

/** Pencil C1 · Registro conductor */
export default function RegistroConductorPage() {
  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
      <RegisterConductorWizard />
    </div>
  );
}

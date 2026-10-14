import type { Metadata } from "next";

import { RegisterPasajeroWizard } from "@/components/auth/register-pasajero-wizard";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

/** Pencil P1 · Registro pasajero */
export default function RegistroPasajeroPage() {
  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
      <RegisterPasajeroWizard />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Registro operador",
};

/** Public operator self-signup is closed. Login only: /login?rol=operador */
export default function RegistroOperadorPage() {
  redirect("/");
}

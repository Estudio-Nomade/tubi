import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Registro",
};

/** Conductor-only self-signup deprecated — F0 public signup is passenger only. */
export default function RegistroConductorPage() {
  redirect("/registro");
}

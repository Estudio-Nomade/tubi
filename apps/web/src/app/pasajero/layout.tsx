import { requireProfile } from "@/lib/auth/require-profile";

export default async function PasajeroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile(["pasajero", "operador"]);
  return children;
}

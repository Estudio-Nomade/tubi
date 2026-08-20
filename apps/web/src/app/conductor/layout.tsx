import { requireProfile } from "@/lib/auth/require-profile";

export default async function ConductorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile(["conductor", "operador"]);
  return children;
}

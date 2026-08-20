import { requireProfile } from "@/lib/auth/require-profile";

export default async function OperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile(["operador"]);
  return children;
}

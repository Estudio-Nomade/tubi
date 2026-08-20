import { requireProfile } from "@/lib/auth/require-profile";

export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile();
  return children;
}

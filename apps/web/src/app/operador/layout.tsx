import { SessionProvider } from "@/components/auth/session-provider";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function OperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile(["operador"]);
  return (
    <SessionProvider key={profile.id} profile={profile}>
      {children}
    </SessionProvider>
  );
}

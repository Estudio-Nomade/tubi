import { SessionProvider } from "@/components/auth/session-provider";
import { ModeSwitchHost } from "@/components/shell/mode-switch-host";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile({ area: "any" });
  return (
    <SessionProvider key={profile.id} profile={profile}>
      <ModeSwitchHost profile={profile} />
      {children}
    </SessionProvider>
  );
}

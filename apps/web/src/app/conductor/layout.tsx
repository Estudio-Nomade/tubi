import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SessionProvider } from "@/components/auth/session-provider";
import { ModeSwitchHost } from "@/components/shell/mode-switch-host";
import { canDrive } from "@/domain/auth";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function ConductorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile({ area: "any" });
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isKycRoute =
    pathname === "/conductor/kyc" || pathname.startsWith("/conductor/kyc/");

  if (!isKycRoute && !canDrive(profile)) {
    redirect("/conductor/kyc");
  }

  return (
    <SessionProvider key={profile.id} profile={profile}>
      <ModeSwitchHost profile={profile} forcedMode="drive" />
      {children}
    </SessionProvider>
  );
}

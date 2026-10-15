import { cookies } from "next/headers";

import { parseUiModeCookie, UI_MODE_COOKIE } from "@/application/auth";
import { canDrive } from "@/domain/auth";
import type { Profile, UiMode } from "@/domain/auth";

import { ModeSwitch } from "./mode-switch";

type ModeSwitchHostProps = {
  profile: Profile;
  /** Force mode when layout is area-specific (optional). */
  forcedMode?: UiMode;
};

export async function ModeSwitchHost({
  profile,
  forcedMode,
}: ModeSwitchHostProps) {
  const jar = await cookies();
  const fromCookie = parseUiModeCookie(jar.get(UI_MODE_COOKIE)?.value);
  const mode = forcedMode ?? fromCookie;
  return (
    <ModeSwitch mode={mode} canDriveMode={canDrive(profile)} />
  );
}

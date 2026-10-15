"use server";

import { cookies } from "next/headers";

import type { UiMode } from "@/domain/auth";

import { UI_MODE_COOKIE } from "./post-login-path";

/**
 * Persist UI mode (Viajar | Conducir) for post-login and shell.
 * Next.js 16: cookies() is async in Server Actions.
 */
export async function setUiModeAction(mode: UiMode): Promise<void> {
  if (mode !== "travel" && mode !== "drive") return;
  const jar = await cookies();
  jar.set(UI_MODE_COOKIE, mode, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
}

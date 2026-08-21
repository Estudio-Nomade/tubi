"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Profile } from "@/domain/auth";
import { createClient } from "@/lib/supabase/client";

export type SessionSnapshot = {
  profile: Profile | null;
  /** Always false after first paint — profile is seeded from the server. */
  isLoading: boolean;
};

const SessionContext = createContext<SessionSnapshot | null>(null);

/**
 * Minimal client session bridge.
 * Profile is loaded on the server (requireProfile / getCurrentProfile) and
 * passed in as a serializable prop — no client fetch on mount, so SSR HTML
 * and hydration match. Remount via key={profile.id} when the server profile changes.
 */
export function SessionProvider({
  profile: initialProfile,
  children,
}: {
  profile: Profile | null;
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<SessionSnapshot>(
    () => ({ profile, isLoading: false }),
    [profile],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/**
 * Current profile from SessionProvider (server-seeded).
 * Must be called under a protected layout that mounts SessionProvider.
 */
export function useCurrentProfile(): SessionSnapshot {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error(
      "useCurrentProfile() requires SessionProvider — use it inside a protected layout",
    );
  }
  return ctx;
}

"use client";

import { createContext, useContext, useMemo } from "react";

import type { Setting } from "@/domain/settings";

export type SettingsSnapshot = {
  items: Setting[];
  byKey: Record<string, Setting>;
  loaded: boolean;
  error: string | null;
};

const emptySnapshot: SettingsSnapshot = {
  items: [],
  byKey: {},
  loaded: false,
  error: null,
};

const SettingsContext = createContext<SettingsSnapshot>(emptySnapshot);

export function SettingsProvider({
  items,
  error = null,
  children,
}: {
  items: Setting[];
  error?: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo<SettingsSnapshot>(() => {
    const byKey: Record<string, Setting> = {};
    for (const item of items) {
      byKey[item.clave] = item;
    }
    return {
      items,
      byKey,
      loaded: error === null,
      error,
    };
  }, [items, error]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsSnapshot {
  return useContext(SettingsContext);
}

export function useSetting(clave: string): Setting | null {
  const { byKey } = useSettings();
  return byKey[clave] ?? null;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces } from "next/font/google";

import { getSettings } from "@/application/settings";
import { PwaRegister } from "@/components/pwa-register";
import { SettingsProvider } from "@/components/settings-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Setting } from "@/domain/settings";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tubi",
    template: "%s · Tubi",
  },
  description: "Viajes compartidos interurbanos Tandil ↔ Buenos Aires.",
  applicationName: "Tubi",
  appleWebApp: {
    capable: true,
    title: "Tubi",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

async function loadSettingsForLayout(): Promise<{
  items: Setting[];
  error: string | null;
}> {
  try {
    const items = await getSettings();
    return { items, error: null };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : "No se pudieron cargar settings",
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { items, error } = await loadSettingsForLayout();

  return (
    <html
      lang="es-AR"
      suppressHydrationWarning
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SettingsProvider items={items} error={error}>
            {children}
            <PwaRegister />
            <Toaster />
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

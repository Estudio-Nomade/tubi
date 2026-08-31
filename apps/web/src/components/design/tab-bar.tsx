"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import {
  Banknote,
  Bus,
  House,
  QrCode,
  Search,
  Settings,
  Undo2,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"

type TabItem = {
  key: string
  label: string
  href: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
}

const PASAJERO_TABS: TabItem[] = [
  { key: "inicio", label: "Inicio", href: "/pasajero", icon: House },
  { key: "buscar", label: "Buscar", href: "/pasajero/buscar", icon: Search },
  { key: "qr", label: "QR", href: "/pasajero/pase", icon: QrCode },
  { key: "cuenta", label: "Cuenta", href: "/cuenta", icon: User },
]

const CONDUCTOR_TABS: TabItem[] = [
  { key: "inicio", label: "Inicio", href: "/conductor", icon: House },
  { key: "viajes", label: "Viajes", href: "/conductor", icon: Bus },
  { key: "cuenta", label: "Cuenta", href: "/cuenta", icon: User },
]

const OPERADOR_TABS: TabItem[] = [
  { key: "senas", label: "Señas", href: "/operador", icon: Banknote },
  { key: "viajes", label: "Viajes", href: "/operador/viajes", icon: Bus },
  {
    key: "devoluciones",
    label: "Devol.",
    href: "/operador/devoluciones",
    icon: Undo2,
  },
  {
    key: "settings",
    label: "Ajustes",
    href: "/operador/settings",
    icon: Settings,
  },
  { key: "cuenta", label: "Cuenta", href: "/cuenta", icon: User },
]

type TabBarProps = {
  variant: "pasajero" | "conductor" | "operador"
  active: string
  className?: string
  /** Conductor "viajes" tab target; defaults to `/conductor`. */
  viajesHref?: string
}

/** Pencil alqrj — 64px bar, top border, icon 22 + label 11. */
export function TabBar({ variant, active, className, viajesHref }: TabBarProps) {
  const tabs =
    variant === "pasajero"
      ? PASAJERO_TABS
      : variant === "operador"
        ? OPERADOR_TABS
        : CONDUCTOR_TABS.map((tab) =>
            tab.key === "viajes" && viajesHref
              ? { ...tab, href: viajesHref }
              : tab
          )

  const compact = variant === "operador"

  return (
    <nav
      className={cn(
        "sticky bottom-0 z-40 flex h-16 w-full flex-col border-t border-border bg-card",
        className
      )}
      aria-label="Navegación principal"
    >
      <div className="flex h-full items-center justify-around px-1 py-2">
        {tabs.map((tab) => {
          const isActive = tab.key === active
          const Icon = tab.icon
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5",
                compact
                  ? "min-w-0 flex-1 px-0.5"
                  : "w-20",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              title={
                tab.key === "devoluciones"
                  ? "Devoluciones"
                  : tab.key === "settings"
                    ? "Configuración"
                    : tab.label
              }
            >
              <Icon className="size-[22px] shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
              <span
                className={cn(
                  "max-w-full truncate leading-none",
                  compact ? "text-[10px]" : "text-[11px]",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

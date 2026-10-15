# Marketplace de viajes compartidos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-10-14-marketplace-viajes-compartidos-design.md`  
> **Commits:** GPG-signed (`git commit -S`). Agent suggests message; human runs commit if agent lacks TTY for GPG.

**Goal:** Convertir Tubi de “operador vende asientos” a marketplace mínimo: una persona / capabilities, solicitud→aceptación, oferta peer vs Operado por Tubi, seña % tramo, comisión peer con waterfall, chat in-app único, rutas por places (sin mapas/GPS), detective y notificaciones.

**Architecture:** Extender el monorepo actual (`apps/web` Next App Router + Supabase). Capas `domain/` → `application/` → `adapters/supabase`. `profiles.rol` único se reemplaza por **capabilities** (`passenger` default, `driver` post-KYC, `operator` staff). `viaje.offer_source` distingue peer vs tubi_operated. Chat es el único canal post-seña. Sin UI de mapa ni GPS background.

**Tech Stack:** Next.js App Router · React · Supabase (Auth, Postgres, RLS, Realtime para chat) · Zod · Tailwind · bun/turbo · `IdentityVerifier` (Didit) · Web Push / in-app notifications · places server-side (sin MapLibre UI).

**Regla:** valores de negocio solo en `settings`. No hardcodear comisión, seña %, timeouts. Providers detrás de interfaces.

---

## Descomposición (planes por fase)

Este marketplace son **subsistemas independientes encadenados**. No implementar todo en un solo PR monstruo.

| Fase | Entrega testeable | Plan detallado |
|---|---|---|
| **0** | Auth unificada + capabilities + switch Viajar/Conducir | **Este archivo (abajo)** |
| **1** | KYC conductor (`IdentityVerifier` / Didit) + gate publicar/asignar | Plan hijo al cerrar Fase 0 |
| **2** | `offer_source` + badge + publicar peer / operador asigna | Plan hijo |
| **3** | Solicitud → aceptación + holds + timeouts + seña % | Plan hijo |
| **4** | Waterfall comisión peer + liquidación UX | Plan hijo |
| **5** | Places / paradas ordenadas + búsqueda A→B (sin mapa) | Plan hijo |
| **6** | Chat in-app post-seña (único canal) + filtros bypass | Plan hijo |
| **7** | Notificaciones PWA + detective mínimo + confiabilidad | Plan hijo |
| **8** | Migración cuentas legacy + flag `marketplace.enabled` + cleanup | Plan hijo |

**Orden estricto 0→1→2…** Cada fase deja `type-check` + tests verdes y un commit lógico (o serie de commits por task).

---

## Contexto de codebase (hoy)

| Pieza | Path |
|---|---|
| Rol único en perfil | `apps/web/src/domain/auth/types.ts` — `Rol = "pasajero" \| "conductor" \| "operador"` |
| Login por rol | `apps/web/src/components/auth/login-form.tsx` — `?rol=conductor\|pasajero` |
| Actions auth | `apps/web/src/application/auth/actions.ts` — `signInAction`, `signUpPasajeroAction`, signup conductor |
| Profiles repo | `apps/web/src/adapters/supabase/profiles-repository.ts` |
| Home por rol | `homePathForRol` en `application/auth/auth-service.ts` |
| Rutas app | `/pasajero/*`, `/conductor/*`, `/operador/*`, `/login`, `/registro`, `/registro/conductor` |
| Viajes | `domain/viajes`, tablas `viaje`, `ruta`, `reserva` |
| Settings | `domain/settings` + tabla settings |
| Migraciones | `supabase/migrations/00xx_*.sql` |

---

## Fase 0 — Auth unificada + capabilities + switch

### Objetivo de fase
Una sola cuenta. Signup crea persona con capability **passenger**. Capability **driver** se agrega después (Fase 1 KYC; en Fase 0 puede existir flag `driver_status=unverified` sin poder operar). Switch UI **Viajar | Conducir** siempre visible. Login único sin `?rol=`. Rutas legacy redirigen.

### Modelo de datos (Fase 0)

```sql
-- Conceptual; SQL real en Task 1
-- profiles: dejar de usar rol como único discriminador
-- capabilities: array o tabla user_capabilities
-- ui_mode preference: client-only cookie/localStorage OK en F0; opcional columna last_ui_mode
```

**Decisión F0 (mínima fricción):**

- Agregar columnas a `profiles`:
  - `is_passenger boolean not null default true`
  - `is_driver boolean not null default false`
  - `is_operator boolean not null default false`
  - `driver_kyc_status text not null default 'unverified'`  
    check in (`unverified`,`pending_kyc`,`verified`,`rejected`,`suspended`)
- Migrar filas existentes:
  - `rol=pasajero` → `is_passenger=true`
  - `rol=conductor` → `is_passenger=true`, `is_driver=true`, `driver_kyc_status='unverified'` (Fase 1 obliga KYC)
  - `rol=operador` → `is_operator=true`, `is_passenger=true`
- Mantener columna `rol` **deprecated** (generada o sincronizada) durante transición para no romper RLS de un golpe: trigger o vista que exponga `rol` legacy = primary role for old policies:
  - si `is_operator` → `operador`
  - else si `is_driver` → `conductor`
  - else → `pasajero`
- Nuevas policies y código leen flags; al final de Fase 8 se puede dropear `rol`.

### Mapa de archivos Fase 0

| Acción | Path | Responsabilidad |
|---|---|---|
| Create | `supabase/migrations/0037_unified_identity_capabilities.sql` | columnas + backfill + sync rol |
| Modify | `apps/web/src/domain/auth/types.ts` | `Profile` con capabilities |
| Modify | `apps/web/src/domain/auth/ports.ts` (o index) | `ProfilesRepository` |
| Modify | `apps/web/src/adapters/supabase/profiles-repository.ts` | mapear flags |
| Modify | `apps/web/src/application/auth/auth-service.ts` | `homePathForProfile`, mode |
| Modify | `apps/web/src/application/auth/actions.ts` | login único; signup solo passenger |
| Modify | `apps/web/src/components/auth/login-form.tsx` | sin rol en URL |
| Create | `apps/web/src/components/shell/mode-switch.tsx` | Viajar \| Conducir |
| Modify | layouts `/pasajero` y `/conductor` | montar ModeSwitch (no app-shell nuevo en F0) |
| Modify | `apps/web/src/app/login/page.tsx` | login unificado |
| Modify | `apps/web/src/app/registro/**` | un solo registro persona |
| Modify | `apps/web/src/middleware.ts` | auth por sesión; capabilities en redirects |
| Create | `apps/web/src/domain/auth/capabilities.ts` | helpers `canDrive`, `canOperate` |
| Test | `apps/web/src/domain/auth/capabilities.test.ts` | unit tests puro |

### Invariantes a respetar (spec)
- I1–I10 §4 del design doc
- Switch siempre visible; **prohibido** long-press como único path
- Signup = passenger; driver se gana con KYC (Fase 1)
- Operator = capability staff

---

### Task 0.1: Domain types + capability helpers (TDD)

**Files:**
- Create: `apps/web/src/domain/auth/capabilities.ts`
- Create: `apps/web/src/domain/auth/capabilities.test.ts`
- Modify: `apps/web/src/domain/auth/types.ts`
- Modify: `apps/web/src/domain/auth/index.ts` (export)

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/src/domain/auth/capabilities.test.ts
// Repo uses bun test + node:test (see dni.test.ts) — NOT vitest
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canDrive,
  canOperate,
  canTravel,
  legacyRolFromCapabilities,
  primaryHomePath,
} from "./capabilities";
import type { Profile } from "./types";

function base(overrides: Partial<Profile> = {}): Profile {
  const isPassenger = overrides.isPassenger ?? true;
  const isDriver = overrides.isDriver ?? false;
  const isOperator = overrides.isOperator ?? false;
  const driverKycStatus = overrides.driverKycStatus ?? "unverified";
  return {
    id: overrides.id ?? "u1",
    nombre: overrides.nombre ?? "Ada",
    apellido: overrides.apellido ?? "Lovelace",
    telefono: overrides.telefono ?? "1100000000",
    dni: overrides.dni ?? "30111222",
    dniVerificado: overrides.dniVerificado ?? false,
    isPassenger,
    isDriver,
    isOperator,
    driverKycStatus,
    rol: legacyRolFromCapabilities({ isPassenger, isDriver, isOperator }),
  };
}

describe("capabilities", () => {
  it("passenger can travel", () => {
    assert.equal(canTravel(base()), true);
  });

  it("driver cannot operate trips until kyc verified", () => {
    assert.equal(
      canDrive(base({ isDriver: true, driverKycStatus: "unverified" })),
      false,
    );
    assert.equal(
      canDrive(base({ isDriver: true, driverKycStatus: "verified" })),
      true,
    );
  });

  it("operator capability", () => {
    assert.equal(canOperate(base({ isOperator: true })), true);
  });

  it("legacy rol mapping for transition", () => {
    assert.equal(legacyRolFromCapabilities(base({ isOperator: true })), "operador");
    assert.equal(
      legacyRolFromCapabilities(
        base({ isDriver: true, driverKycStatus: "verified" }),
      ),
      "conductor",
    );
    assert.equal(legacyRolFromCapabilities(base()), "pasajero");
  });

  it("primary home path prefers last ui mode when allowed", () => {
    assert.equal(primaryHomePath(base(), "travel"), "/pasajero");
    assert.equal(
      primaryHomePath(
        base({ isDriver: true, driverKycStatus: "verified" }),
        "drive",
      ),
      "/conductor",
    );
    assert.equal(
      primaryHomePath(
        base({ isDriver: true, driverKycStatus: "unverified" }),
        "drive",
      ),
      "/pasajero",
    );
  });

  it("operator reaches operador home when not in drive-as-driver", () => {
    // F0: staff shell is /operador; Viajar follows passenger if is_passenger
    assert.equal(
      primaryHomePath(base({ isOperator: true, isPassenger: true }), "travel"),
      "/pasajero",
    );
    assert.equal(
      primaryHomePath(
        base({ isOperator: true, isPassenger: false, isDriver: false }),
        "travel",
      ),
      "/operador",
    );
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/web && bun test src/domain/auth/capabilities.test.ts
```

Expected: fail module not found / exports missing.

- [ ] **Step 3: Implement types + helpers**

```typescript
// types.ts — reemplazar Rol-only Profile
export type DriverKycStatus =
  | "unverified"
  | "pending_kyc"
  | "verified"
  | "rejected"
  | "suspended";

/** @deprecated transition only — prefer capabilities */
export type Rol = "pasajero" | "conductor" | "operador";

export type UiMode = "travel" | "drive";

export type Profile = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string | null;
  dniVerificado: boolean;
  isPassenger: boolean;
  isDriver: boolean;
  isOperator: boolean;
  driverKycStatus: DriverKycStatus;
  /** derived for legacy callers during migration */
  rol: Rol;
};

export type ProfileInsert = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string | null;
  isPassenger?: boolean;
  isDriver?: boolean;
  isOperator?: boolean;
  driverKycStatus?: DriverKycStatus;
};
```

```typescript
// capabilities.ts
import type { DriverKycStatus, Profile, Rol, UiMode } from "./types";

export function canTravel(p: Profile): boolean {
  return p.isPassenger;
}

export function canDrive(p: Profile): boolean {
  return p.isDriver && p.driverKycStatus === "verified";
}

export function canOperate(p: Profile): boolean {
  return p.isOperator;
}

export function legacyRolFromCapabilities(
  p: Pick<Profile, "isPassenger" | "isDriver" | "isOperator">,
): Rol {
  if (p.isOperator) return "operador";
  if (p.isDriver) return "conductor";
  return "pasajero";
}

export function primaryHomePath(p: Profile, mode: UiMode): string {
  // Drive mode only if KYC-verified driver
  if (mode === "drive" && canDrive(p)) return "/conductor";
  // Travel: passenger home when they can travel
  if (canTravel(p)) return "/pasajero";
  // Staff-only accounts (no passenger flag)
  if (canOperate(p)) return "/operador";
  return "/pasajero";
}

export function assertDriverKycStatus(s: string): DriverKycStatus {
  const ok = [
    "unverified",
    "pending_kyc",
    "verified",
    "rejected",
    "suspended",
  ] as const;
  if ((ok as readonly string[]).includes(s)) return s as DriverKycStatus;
  return "unverified";
}
```

Also set `rol: legacyRolFromCapabilities(...)` when mapping profile in repository (Task 0.2).

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/web && bun test src/domain/auth/capabilities.test.ts
```

- [ ] **Step 5: Commit** (human GPG if agent cannot sign)

```bash
git add apps/web/src/domain/auth/
git commit -S -m "feat(auth): add capability helpers for unified identity"
```

---

### Task 0.2: Migration SQL capabilities + backfill

**Files:**
- Create: `supabase/migrations/0037_unified_identity_capabilities.sql`

- [ ] **Step 1: Write migration**

```sql
-- 0037_unified_identity_capabilities.sql
alter table public.profiles
  add column if not exists is_passenger boolean not null default true,
  add column if not exists is_driver boolean not null default false,
  add column if not exists is_operator boolean not null default false,
  add column if not exists driver_kyc_status text not null default 'unverified';

alter table public.profiles
  drop constraint if exists profiles_driver_kyc_status_check;

alter table public.profiles
  add constraint profiles_driver_kyc_status_check
  check (driver_kyc_status in (
    'unverified', 'pending_kyc', 'verified', 'rejected', 'suspended'
  ));

-- backfill from legacy rol
update public.profiles set
  is_passenger = true,
  is_driver = (rol = 'conductor'),
  is_operator = (rol = 'operador'),
  driver_kyc_status = case
    when rol = 'conductor' then 'unverified'
    else 'unverified'
  end;

-- keep rol in sync for legacy RLS (trigger)
create or replace function public.profiles_sync_legacy_rol()
returns trigger
language plpgsql
as $$
begin
  if new.is_operator then
    new.rol := 'operador';
  elsif new.is_driver then
    new.rol := 'conductor';
  else
    new.rol := 'pasajero';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_legacy_rol on public.profiles;
create trigger trg_profiles_sync_legacy_rol
  before insert or update of is_passenger, is_driver, is_operator
  on public.profiles
  for each row execute function public.profiles_sync_legacy_rol();

-- one-shot sync
update public.profiles set is_passenger = is_passenger;
```

- [ ] **Step 2: Apply locally**

```bash
# según workflow del repo
supabase db reset   # o migration up en entorno dev
```

Expected: profiles tienen flags; conductores legacy `is_driver=true`, `driver_kyc_status=unverified`.

- [ ] **Step 3: Regenerate types if project does**

```bash
# si existe script
bun run supabase:types
# o documentar update manual de apps/web/src/lib/supabase/types.ts
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0037_unified_identity_capabilities.sql
git commit -S -m "feat(db): add profile capabilities for unified identity"
```

---

### Task 0.3: Profiles repository maps capabilities

**Files:**
- Modify: `apps/web/src/adapters/supabase/profiles-repository.ts`
- Modify: any `ProfilesRepository` port

- [ ] **Step 1: Extend select columns and `toProfile`**

```typescript
const PROFILE_COLUMNS =
  "id, rol, nombre, apellido, telefono, dni, dni_verificado, is_passenger, is_driver, is_operator, driver_kyc_status" as const;

// in toProfile:
return {
  id: row.id,
  nombre: row.nombre,
  apellido: row.apellido,
  telefono: row.telefono,
  dni: row.dni,
  dniVerificado: row.dni_verificado,
  isPassenger: row.is_passenger,
  isDriver: row.is_driver,
  isOperator: row.is_operator,
  driverKycStatus: assertDriverKycStatus(row.driver_kyc_status),
  rol: legacyRolFromCapabilities({
    isPassenger: row.is_passenger,
    isDriver: row.is_driver,
    isOperator: row.is_operator,
  }),
};
```

- [ ] **Step 2: `insert` defaults passenger-only**

```typescript
.insert({
  id: profile.id,
  nombre: profile.nombre,
  apellido: profile.apellido,
  telefono: profile.telefono,
  dni: profile.dni,
  is_passenger: profile.isPassenger ?? true,
  is_driver: profile.isDriver ?? false,
  is_operator: profile.isOperator ?? false,
  driver_kyc_status: profile.driverKycStatus ?? "unverified",
  // rol filled by trigger
})
```

- [ ] **Step 3: type-check**

```bash
cd apps/web && bun run type-check
```

Fix all `profile.rol` call sites that break: prefer `canDrive` / `canOperate` / `profile.rol` legacy still works if mapped.

- [ ] **Step 4: Commit**

```bash
git commit -S -m "feat(auth): map profile capabilities in supabase adapter"
```

---

### Task 0.4: Unify signup único + login sin rol

**Files:**
- Modify: `apps/web/src/application/auth/actions.ts`
- Modify: `apps/web/src/components/auth/login-form.tsx`
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/app/registro/page.tsx` (wizard persona)
- Deprecate route: `/registro/conductor` → redirect a `/registro` + CTA “más adelante podés ofrecer viajes”

- [ ] **Step 1: `signUpPasajeroAction` → `signUpAction` (passenger only)**

Always insert `isPassenger: true`, `isDriver: false`. Remove creating conductor-only profiles from public signup.

- [ ] **Step 2: `signInAction` redirect**

```typescript
import { primaryHomePath } from "@/domain/auth/capabilities";
// after load profile:
const mode = (cookies().get("tubi_ui_mode")?.value as UiMode) ?? "travel";
redirect(primaryHomePath(profile, mode));
```

- [ ] **Step 3: LoginForm** — remove `rol` prop, single subtitle “Email y contraseña”, single “Crear cuenta” → `/registro`.

- [ ] **Step 4: `/registro/conductor`**

```typescript
// page.tsx
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/registro");
}
```

- [ ] **Step 5: Manual smoke**
  - Register new user → lands `/pasajero`
  - Login old conductor → still reaches app (kyc unverified; conductor home may show “completá verificación” placeholder linking Fase 1)

- [ ] **Step 6: Commit**

```bash
git commit -S -m "feat(auth): unified signup/login without role split"
```

---

### Task 0.5: Mode switch shell (Viajar | Conducir)

**Files:**
- Create: `apps/web/src/components/shell/mode-switch.tsx`
- Create: `apps/web/src/components/shell/set-ui-mode-action.ts` (server action sets cookie `tubi_ui_mode`)
- Modify: passenger + conductor layouts to include switch always visible under header

- [ ] **Step 1: ModeSwitch UI**

```tsx
// mode-switch.tsx — segmented control always visible
"use client";
import { useRouter } from "next/navigation";
import { setUiModeAction } from "./set-ui-mode-action";

export function ModeSwitch({
  mode,
  canDriveMode,
}: {
  mode: "travel" | "drive";
  canDriveMode: boolean;
}) {
  const router = useRouter();
  async function select(next: "travel" | "drive") {
    if (next === "drive" && !canDriveMode) {
      router.push("/conductor/kyc"); // placeholder route F0 → real KYC F1
      return;
    }
    await setUiModeAction(next);
    router.push(next === "drive" ? "/conductor" : "/pasajero");
    router.refresh();
  }
  return (
    <div
      role="tablist"
      aria-label="Modo"
      className="mx-5 flex rounded-xl border border-border bg-surface-2 p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "travel"}
        className={/* active styles */}
        onClick={() => select("travel")}
      >
        Viajar
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "drive"}
        className={/* active styles */}
        onClick={() => select("drive")}
      >
        Conducir
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Cookie action**

```typescript
"use server";
import { cookies } from "next/headers";
export async function setUiModeAction(mode: "travel" | "drive") {
  const jar = await cookies();
  jar.set("tubi_ui_mode", mode, {
    path: "/",
    sameSite: "lax",
    httpOnly: false, // readable if needed client-side; or httpOnly true + only server
    maxAge: 60 * 60 * 24 * 365,
  });
}
```

- [ ] **Step 3: Mount in layouts** for `/pasajero` and `/conductor` (and `/cuenta` if shared).

- [ ] **Step 4: Visual check 375px** — switch always visible, no long-press.

- [ ] **Step 5: Commit**

```bash
git commit -S -m "feat(ui): add Viajar/Conducir mode switch"
```

---

### Task 0.6: Middleware / guards by capability

**Files:**
- Modify: `apps/web/src/middleware.ts`
- Modify: layout guards that check `rol === 'conductor'`

- [ ] **Step 1:** Replace strict rol checks:
  - `/conductor/**` requires session; if `!canDrive(profile)` allow only `/conductor/kyc` (and static onboarding), else redirect travel + banner
  - `/operador/**` requires `canOperate`
  - `/pasajero/**` requires session + `canTravel`

- [ ] **Step 2: type-check + lint**

```bash
cd apps/web && bun run type-check && bun run lint
```

- [ ] **Step 3: Commit**

```bash
git commit -S -m "feat(auth): gate routes by capabilities instead of single rol"
```

---

### Task 0.7: Fase 0 verification checklist

- [ ] New user: one register, one login, switch visible, default Viajar
- [ ] Legacy passenger: login OK
- [ ] Legacy driver: `is_driver=true`, kyc unverified, Conducir → KYC placeholder
- [ ] Legacy operator: `is_operator=true`, `/operador` works
- [ ] No `?rol=` required on `/login`
- [ ] `/registro/conductor` redirects
- [ ] `bun run type-check` green
- [ ] Capability unit tests green

- [ ] **Commit docs status** (optional)

```bash
# add short status note under docs/ if repo pattern uses slice status files
git commit -S -m "docs(marketplace): phase 0 auth unified done"
```

---

## Fases 1–8 — contratos (detalle en planes hijos)

### Fase 1 — KYC
- Port `IdentityVerifier` + adapter Didit
- Funnel `/conductor/kyc`
- On verified: `is_driver=true`, `driver_kyc_status=verified`
- Block assign/publish until verified
- **Secrets:**
  - **Didit:** el humano pone las envs (`DIDIT_*` / las que defina el adapter). El agente **no** inventa ni hardcodea keys Didit; solo deja placeholders en `.env.example` y cablea el código para leerlas.
  - **Web Push (VAPID):** el agente **genera** el par VAPID con confianza, escribe la pública en config/example y la privada solo en `.env` local/server (nunca commit de la privada). Keys:
    - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
    - `VAPID_PRIVATE_KEY`
    - `VAPID_SUBJECT` (ej. `mailto:ops@tubi…`)

### Fase 2 — offer_source
- `viaje.offer_source` check (`peer` | `tubi_operated`)
- Badge component “Operado por Tubi”
- Peer publish flow (draft)
- Operator create trip + assign verified driver → tubi_operated
- Feature flag `marketplace.enabled` hides peer publish if off

### Fase 3 — Solicitud
- States: `requested|accepted|deposit_pending|deposit_confirmed|…`
- Accept/reject + `request.accept_timeout` + `deposit.pay_timeout`
- Hold seats on accept
- `deposit.pct` replaces fixed sena default
- Same flow for tubi_operated

### Fase 4 — Comisión waterfall
- `CommissionObligation` rows
- Formula §6 spec: Tubi ends with `C`, driver `P-C`, settle `C-S` or credit `S-C`
- UX “Tu parte $X”
- Block publish if overdue

### Fase 5 — Places
- `places` table or external geocode server-side
- Trip stops ordered `place_id`
- Search A→B match stops sequence
- **No map UI, no GPS**

### Fase 6 — Chat
- Threads per accepted+deposit_confirmed pair
- Realtime messages
- Phone pattern filter + report bypass
- **No phone reveal**

### Fase 7 — Notifs + detective
- Event outbox → push + in-app
- Detective queue signals (dup cancel, cancel rate, bypass report, commission overdue)
- Operator UI 5–10 rows

### Fase 8 — Migration cleanup
- Merge duplicate emails/phones if any
- Drop deprecated login paths
- Optional drop `profiles.rol` when RLS fully migrated
- Document operator runbook

---

## Settings to seed (across phases)

| Key | Default | Phase |
|---|---|---|
| `marketplace.enabled` | false until F2 ready | 2 |
| `commission.peer_pct` | 15 | 4 |
| `commission.on_noshow` | false | 4 |
| `deposit.pct` | (operator picks, e.g. 15–25) | 3 |
| `deposit.floor` / `ceiling` | optional null | 3 |
| `deposit.pay_timeout_minutes` | 60 | 3 |
| `request.accept_timeout_minutes` | 180 | 3 |
| `schedule.conflict_margin_minutes` | 60 | 3 |
| `reliability.cancel_rate_threshold` | e.g. 0.4 | 7 |
| `detective.pair_cancel_window_days` | 14 | 7 |

---

## Spec coverage matrix

| Spec section | Phase |
|---|---|
| §3 offer model / badge | 2 |
| §4 identity / switch | **0** (+1 KYC) |
| §5 request/accept | 3 |
| §6 money waterfall | 3–4 |
| §7 anti-bypass / detective | 6–7 |
| §8 routes places no maps | 5 |
| §9 notifications | 7 |
| §10 settings | 2–7 |
| Chat only channel | 6 |
| No maps/GPS | 5 + explicit non-goals all phases |

---

## Self-review (plan)

1. **Spec coverage:** all major sections mapped to a phase; F0 fully tasked.
2. **Placeholders:** F1–F8 are contracts for child plans (intentional); F0 has concrete files/SQL/tests.
3. **Types:** `Profile` capabilities + `DriverKycStatus` + `UiMode` consistent across F0 tasks.
4. **YAGNI:** no MapLibre, no escrow, no long-press, no second login.
5. **Risk:** legacy `rol` kept in sync via trigger so existing RLS does not explode on day 1.

### Plan review consolidation (2026-10-14)

**Controller self-review + subagent plan review — fixes applied before implementation:**

| Issue | Fix |
|---|---|
| Tests used `vitest`; repo uses `bun test` + `node:test` | Snippets aligned to `dni.test.ts` pattern |
| `base()` fixture missing required `rol` | Fixture derives `rol` via `legacyRolFromCapabilities` |
| `primaryHomePath` had empty operator branch | Explicit: drive→conductor if canDrive; else travel→pasajero if canTravel; else operador |
| `app-shell.tsx` listed but never tasked | Removed from file map; F0 mounts `ModeSwitch` in existing layouts |
| Test command `bun run test --` | Use `bun test src/domain/auth/capabilities.test.ts` |

**Status after fixes:** Approved for Fase 0 implementation.

---

## Execution handoff

**Plan saved to** `docs/superpowers/plans/2026-10-14-marketplace-viajes-compartidos.md`.

**Fase 0** is ready to implement. Fases 1–8 get their own detailed plans when F0 is done (same pattern as historical slice plans).

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per F0 task, review between tasks  
2. **Inline Execution** — execute F0 tasks in this session with checkpoints  

**Which approach?**

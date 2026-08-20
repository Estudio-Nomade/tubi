# Slice 1 — Auth + Login + Roles · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auth real con Supabase (email+password MVP), perfiles con rol (`pasajero` | `conductor` | `operador`), login/registro fieles a Pencil “Ruta de la siesta”, y rutas protegidas por rol.

**Architecture:** Supabase Auth es la fuente de sesión; `profiles` extiende `auth.users` con rol y datos de dominio. Server Actions + clients existentes (`src/lib/supabase/{client,server,middleware}`). UI copia tokens y componentes del `.pen` (no inventar layouts). Middleware/proxy refresca sesión y redirige por rol. Capas: `domain/auth` + `application/auth` + `adapters/supabase` (mismo patrón que settings).

**Tech Stack:** Next.js 16 App Router · React 19 · `@supabase/ssr` · Zod · Tailwind 4 · componentes shadcn existentes + design tokens Ruta de la siesta · Pencil `design-artifacts/tubi-wireframes.pen`.

**Regla UI (no negociable):** antes de crear/modificar cualquier página o componente visual, consultar Pencil con MCP (`get_app_state` / `execute` Get) y extraer estructura, copy, tipografía y colores. No inventar estilos.

---

## Contexto ya existente (Slice 0.5)

| Pieza | Path |
|---|---|
| Browser client | `apps/web/src/lib/supabase/client.ts` |
| Server client | `apps/web/src/lib/supabase/server.ts` |
| `updateSession` | `apps/web/src/lib/supabase/middleware.ts` |
| Edge entry | `apps/web/src/middleware.ts` |
| Settings layers | `domain/settings`, `application/settings`, `adapters/supabase/settings-repository.ts` |
| Schema `profiles` | `supabase/migrations/0001_init.sql` (sin trigger ni RLS policies de profiles) |
| Seed settings | `0002` + policies/grants `0003`–`0004` |

## Pantallas Pencil a usar (IDs)

| ID canvas | Frame | Uso en Slice 1 |
|---|---|---|
| `Gsfap` | **P10 · Login** | `/login` |
| `f0028` | **P1 · Registro** (pasajero) | `/registro` wizard pasajero |
| `f0221` | **C1 · Registro** (conductor) | `/registro/conductor` wizard conductor |
| `C6xRqs` / `o8buXe` | **P7 / P2 · Home** pasajero | home post-login pasajero (stub mínimo) |
| `DOGMp` / `ewfc2` | **C3 / C2 · Home** conductor | home post-login conductor (stub mínimo) |
| `i1eIX` / `dpoE4` | **P12 / C11 · Cuenta** | logout + datos perfil |
| `zJbea` | AppHeader | header reutilizable |
| `iFTuH` | Field | inputs |
| `TXQO6` / `W0u7k` | BtnPrimary / BtnSecondary | CTAs |
| `AQYhJ` | ProgressDots | wizard |
| `alqrj` | TabBar | homes (opcional en stub) |

## Tokens Ruta de la siesta (Pencil variables)

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#F7F3EC` | fondo pantalla |
| `surface` / `card` | `#FFFCF7` | cards |
| `surface-2` | `#EFE8DC` | input fill |
| `ink` | `#1C1917` | texto |
| `muted` / `ink-muted` | `#78716C` | secundario |
| `border` | `#E7E0D4` | bordes |
| `accent` | `#C45C26` | CTA / links / foco |
| `on-accent` | `#FFFCF7` | texto sobre accent |
| `accent-soft` | `#F3E0D4` | chips suaves |
| `sage` / `sage-soft` | `#5F7A61` / `#E4EDE5` | OK |
| `danger` / `danger-soft` | `#B42318` / `#FCEBEA` | error |

**Tipografía:** Fraunces 600 (títulos 28) · DM Sans 400/500/600 (body 14, buttons 17).  
**Layout:** 375px, padding horizontal 20, gap secciones 24, Field h 52, BtnPrimary h 52, radius controles 12 / cards 16.

## Gap diseño ↔ MVP técnico (decisión cerrada en este plan)

| Pencil | MVP código | Resolución |
|---|---|---|
| Login: un solo Field “email o teléfono” + Continuar | Auth email+password (`PROMPT-IMPLEMENTACION`) | Login: **email + password** con 2× `Field` + mismo layout P10 (título/sub/CTA/link). Teléfono queda en perfil, no como identity del MVP. |
| Registro wizard muestra solo paso “nombre” | Pasajero: nombre → DNI → contacto; Conductor: nombre → apellido → teléfono | Wizard multi-step con `ProgressDots`; último paso pide **email + password** (cuenta Supabase) antes de crear perfil. |
| Operador sin pantalla registro | Rol `operador` | Solo seed SQL / dashboard; no self-signup de operador en MVP. |

## Mapa de rutas

| Ruta | Auth | Rol | Pencil |
|---|---|---|---|
| `/login` | público | — | P10 |
| `/registro` | público | crea `pasajero` | P1 |
| `/registro/conductor` | público | crea `conductor` | C1 |
| `/` o `/pasajero` | sesión | pasajero | P2/P7 stub |
| `/conductor` | sesión | conductor | C2/C3 stub |
| `/operador` | sesión | operador | (sin UI full; redirect placeholder) |
| `/cuenta` | sesión | dueño | P12 / C11 según rol |
| `/auth/callback` | público | — | (sin UI; route handler OAuth/confirm si hace falta) |
| `/dev/settings` | dev | opcional: autenticado | — |

---

## File structure (crear / tocar)

```
apps/web/src/
  app/
    login/page.tsx
    registro/page.tsx              # pasajero wizard
    registro/conductor/page.tsx
    cuenta/page.tsx
    pasajero/page.tsx              # home stub
    conductor/page.tsx             # home stub (ya protegida por middleware)
    operador/page.tsx              # stub
    auth/callback/route.ts
    layout.tsx                     # + fonts Fraunces/DM Sans + tokens CSS
    globals.css                    # tokens Ruta de la siesta
  components/
    auth/                          # forms client
    design/                        # AppHeader, Field, Btn*, ProgressDots (desde Pencil)
  domain/auth/                     # Rol, Profile types, validation schemas puros
  application/auth/                # signIn, signUp, signOut, getSessionProfile
  adapters/supabase/profiles-repository.ts
  lib/supabase/middleware.ts       # devolver user (ya) + opcional profile claim later
  middleware.ts                    # rutas por rol
supabase/migrations/
  0005_profiles_auth.sql           # trigger handle_new_user + RLS profiles
```

---

### Task 0: Inventario Pencil obligatorio (antes de cualquier UI)

**Files:** none (solo lectura)

- [ ] **Step 0.1:** Abrir `design-artifacts/tubi-wireframes.pen` con Pencil MCP.

```
get_app_state({ include_schema: true, include_canvas_design: true })
execute: Get P10 Gsfap, P1 f0028, C1 f0221, P12 i1eIX, C11 dpoE4
execute: GetVariables() → tokens
execute: Get components zJbea, iFTuH, TXQO6, W0u7k, AQYhJ, alqrj (depth 3)
```

- [ ] **Step 0.2:** Anotar copy exacto y estructura en el checklist de implementación:
  - Login: “Ingresá a Tubi” / “Usá tu email o teléfono” / CTA / “Crear cuenta”
  - Registro P: “¿Cómo te llamás?” + ProgressDots + “Ya tengo cuenta”
  - Registro C: igual título paso 1
  - Cuenta: “Tu cuenta” + logout secondary

- [ ] **Step 0.3:** No code. Commit N/A.

---

### Task 1: Design tokens + tipografía en la app

**Pencil first:** `GetVariables()` + sample text nodes (Fraunces/DM Sans).

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx` (fonts)

- [ ] **Step 1.1:** Cargar Google fonts Fraunces + DM Sans en `layout.tsx` (reemplazar Geist como principal).

- [ ] **Step 1.2:** En `globals.css`, mapear CSS variables a tokens Pencil:

```css
:root {
  --background: #F7F3EC;
  --foreground: #1C1917;
  --card: #FFFCF7;
  --muted: #EFE8DC;
  --muted-foreground: #78716C;
  --border: #E7E0D4;
  --primary: #C45C26;
  --primary-foreground: #FFFCF7;
  --destructive: #B42318;
  --ring: #C45C26;
  --radius: 0.75rem; /* 12px controls */
}
```

- [ ] **Step 1.3:** `npm run build --workspace=web` — OK.

- [ ] **Step 1.4:** Commit (usuario firma GPG):

```bash
git add apps/web/src/app/globals.css apps/web/src/app/layout.tsx
git commit -S -m "feat(web): apply Ruta de la siesta tokens and fonts"
```

---

### Task 2: Componentes de diseño (desde Pencil, no inventar)

**Pencil first:** componentes `zJbea` AppHeader, `iFTuH` Field, `TXQO6` BtnPrimary, `W0u7k` BtnSecondary, `AQYhJ` ProgressDots.

**Files:**
- Create: `apps/web/src/components/design/app-header.tsx`
- Create: `apps/web/src/components/design/field.tsx`
- Create: `apps/web/src/components/design/progress-dots.tsx`
- Modify: `apps/web/src/components/ui/button.tsx` (variants sizes h-13 = 52px primary) **o** wrappers `btn-primary.tsx` que no rompan shadcn

Reglas:
- AppHeader: wordmark “Tubi” Fraunces, back opcional, chip rol opcional.
- Field: label 12 muted, input h-52, bg surface-2, border sutil, focus ring accent.
- ProgressDots: activo accent, resto border; props `step` `total`.
- BtnPrimary: full width, h-52, bg accent, texto on-accent, radius 12.

- [ ] **Step 2.1:** Implementar componentes midiendo props del `.pen`.
- [ ] **Step 2.2:** Smoke visual en una página temporal o Story-less dev — comparar con screenshot Pencil si hace falta (`TakeScreenshot` de frames).
- [ ] **Step 2.3:** Build OK + commit.

---

### Task 3: Migración Auth — trigger profiles + RLS

**Pencil:** N/A (backend).

**Files:**
- Create: `supabase/migrations/0005_profiles_auth.sql`

Contenido mínimo:

```sql
-- Helper: current user's rol
create or replace function public.current_rol()
returns rol
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

-- Optional: auto-create empty profile row on signup is NOT enough
-- (need nombre/rol). Prefer application insert after signup.
-- Still add RLS:

alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.current_rol() = 'operador');

create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.current_rol() = 'operador')
  with check (id = auth.uid() or public.current_rol() = 'operador');

grant select, insert, update on public.profiles to authenticated;
```

Notas:
- **No** crear perfil vacío en trigger con defaults incompletos: el flujo es `signUp` → (sesión) → `insert profiles` con datos del wizard (Server Action). Si preferís trigger, guardar metadata en `raw_user_meta_data` y leerla en el trigger — documentar una sola vía; **este plan elige Server Action insert** (más simple de debuggear).
- DNI: MVP guardar texto; cifrado pgcrypto queda post-MVP (AD-13).

- [ ] **Step 3.1:** Escribir migración.
- [ ] **Step 3.2:** `npx supabase migration up` (local).
- [ ] **Step 3.3:** Verificar con SQL: `\d profiles` + policies.
- [ ] **Step 3.4:** Commit.

---

### Task 4: Domain + application auth

**Pencil:** N/A.

**Files:**
- Create: `apps/web/src/domain/auth/types.ts` — `Rol`, `Profile`
- Create: `apps/web/src/domain/auth/schemas.ts` — Zod: login, registerPasajero, registerConductor
- Create: `apps/web/src/domain/auth/ports.ts` — `ProfilesRepository`
- Create: `apps/web/src/adapters/supabase/profiles-repository.ts`
- Create: `apps/web/src/application/auth/auth-service.ts`
- Create: `apps/web/src/application/auth/actions.ts` — Server Actions
- Create: `apps/web/src/application/auth/index.ts`

Schemas (ejemplo):

```ts
// domain/auth/schemas.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const registerPasajeroSchema = z.object({
  nombre: z.string().min(2),
  dni: z.string().min(7).max(12),
  telefono: z.string().min(8),
  email: z.email(),
  password: z.string().min(8),
});

export const registerConductorSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  telefono: z.string().min(8),
  email: z.email(),
  password: z.string().min(8),
});
```

Server Actions:
- `signInAction(formData)` → `supabase.auth.signInWithPassword` → redirect por rol
- `signUpPasajeroAction` → `signUp` → `profiles.insert` rol pasajero → redirect `/pasajero`
- `signUpConductorAction` → similar → `/conductor`
- `signOutAction` → `signOut` → `/login`
- `getCurrentProfile()` — server helper: user + profiles row

- [ ] **Step 4.1:** Implementar domain (sin Next/Supabase imports).
- [ ] **Step 4.2:** Adapter profiles con client inyectado (mismo patrón settings).
- [ ] **Step 4.3:** Actions + tests manuales con curl/SQL si aplica.
- [ ] **Step 4.4:** Build + commit.

---

### Task 5: Middleware por rol

**Pencil:** N/A (comportamiento).

**Files:**
- Modify: `apps/web/src/lib/supabase/middleware.ts` — opcional: devolver solo user (ya)
- Modify: `apps/web/src/middleware.ts`

Lógica:

```
públicas: /login, /registro, /registro/conductor, /auth/*, /~offline
si user y path pública de auth → redirect home según rol
si !user y path protegida → /login?next=
si user:
  /conductor/* requiere rol conductor|operador
  /operador/* requiere rol operador
  /pasajero/* o /cuenta requiere cualquier autenticado
```

Para leer rol en edge: **opción A (recomendada Slice 1):** segunda query liviana no — edge no debe acoplarse a DB pesada.  
**Opción B:** JWT app_metadata.rol seteado al completar perfil (claim custom) — más trabajo.  
**Opción C (pragmática Slice 1):** middleware solo chequea **sesión**; el **layout de cada área** (`/conductor/layout.tsx`) hace `getCurrentProfile()` y redirige si rol incorrecto.

**Decisión del plan: Opción C** para Slice 1 (simple, correcta). Middleware = sesión; layouts de rol = autorización fina.

Actualizar redirect temporal de protegidas: de `/` a `/login`.

- [ ] **Step 5.1:** Actualizar listas públicas/protegidas + redirect `/login`.
- [ ] **Step 5.2:** Crear `app/conductor/layout.tsx`, `app/pasajero/layout.tsx`, `app/operador/layout.tsx` con guard de rol.
- [ ] **Step 5.3:** Build + commit.

---

### Task 6: Página `/login` (Pencil P10)

**Pencil first (obligatorio):**

```
execute Get("Gsfap", { depth: 5, resolveVariables: true, resolveInstances: true })
# opcional TakeScreenshot(["Gsfap"])
```

**Files:**
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/components/auth/login-form.tsx` (client)

Estructura UI (fiel a P10 + password MVP):
1. AppHeader (sin back o con back a `/`)
2. Título Fraunces “Ingresá a Tubi”
3. Sub DM Sans (actualizar copy a “Email y contraseña” o mantener sub y campos claros)
4. Field email
5. Field password
6. Spacer
7. BtnPrimary “Continuar” → `signInAction`
8. Link accent “Crear cuenta” → `/registro`

- [ ] **Step 6.1:** Consultar Pencil y copiar spacing/copy.
- [ ] **Step 6.2:** Implementar page + form.
- [ ] **Step 6.3:** Probar login fail/success con usuario de prueba.
- [ ] **Step 6.4:** Build + commit.

---

### Task 7: Registro pasajero wizard (Pencil P1)

**Pencil first:**

```
execute Get("f0028", { depth: 5, resolveVariables: true, resolveInstances: true })
# steps 2–3 no están como frames separados: seguir spec wizard Nombre → DNI → Contacto
# + paso final cuenta (email/password) no dibujado: mismo Field + ProgressDots 4 pasos
```

**Files:**
- Create: `apps/web/src/app/registro/page.tsx`
- Create: `apps/web/src/components/auth/register-pasajero-wizard.tsx`

Pasos UI:
1. Nombre (`¿Cómo te llamás?`) + ProgressDots 1/4 + link “Ya tengo cuenta”
2. DNI (`¿Cuál es tu DNI?`)
3. Contacto teléfono (`¿Cómo te contactamos?`)
4. Email + password (`Creá tu cuenta`) + CTA “Crear cuenta”

Submit → `signUpPasajeroAction` → redirect `/pasajero`.

- [ ] **Step 7.1:** Pencil + implementar wizard client state.
- [ ] **Step 7.2:** Validación Zod por paso.
- [ ] **Step 7.3:** E2E manual: registro → fila en `profiles` con rol pasajero.
- [ ] **Step 7.4:** Commit.

---

### Task 8: Registro conductor wizard (Pencil C1)

**Pencil first:**

```
execute Get("f0221", { depth: 5, resolveVariables: true })
```

**Files:**
- Create: `apps/web/src/app/registro/conductor/page.tsx`
- Create: `apps/web/src/components/auth/register-conductor-wizard.tsx`

Pasos: Nombre → Apellido → Teléfono → Email/password.  
CTA final → `signUpConductorAction` → `/conductor`.  
Vehículo: **no** en registro (copy Pencil cuenta: “los carga el operador”).

- [ ] **Step 8.1–8.4:** Igual que Task 7 mutatis mutandis + commit.

---

### Task 9: Homes stub + Cuenta + logout

**Pencil first:** P7/P2 (`C6xRqs`, `o8buXe`), C3/C2 (`DOGMp`, `ewfc2`), P12/C11.

**Files:**
- Create: `apps/web/src/app/pasajero/page.tsx` — greeting “Hola, {nombre}” + EmptyHint “Sin viajes” + CTA deshabilitado o link placeholder
- Create: `apps/web/src/app/conductor/page.tsx` — greeting + chip Conductor + empty
- Create: `apps/web/src/app/operador/page.tsx` — “Operador” placeholder + link `/dev/settings`
- Create: `apps/web/src/app/cuenta/page.tsx` — datos perfil + BtnSecondary “Cerrar sesión”
- Modify: `apps/web/src/app/page.tsx` — si hay sesión → redirect home rol; si no → marketing mínimo o redirect `/login`

- [ ] **Step 9.1:** Pencil homes/cuenta.
- [ ] **Step 9.2:** Implementar stubs (sin TabBar completo si ahorra tiempo; si se implementa TabBar, copiar de `alqrj`).
- [ ] **Step 9.3:** Logout funciona y limpia cookies.
- [ ] **Step 9.4:** Commit.

---

### Task 10: Auth helpers client (hooks) + provider liviano

**Pencil:** N/A.

**Files:**
- Create: `apps/web/src/components/auth/auth-provider.tsx` — opcional; preferir pasar profile desde RSC
- Create: `apps/web/src/hooks/use-user.ts` — solo si hay client needs; si no, YAGNI

Preferencia Slice 1: **server-first**. Client forms solo llaman Server Actions. Provider solo si hace falta reactividad de sesión.

- [ ] **Step 10.1:** Evaluar; si no hay consumidor client, skip provider.
- [ ] **Step 10.2:** Documentar en `docs/07` o ampliar `docs/07-slice-0.5` → `docs/08-slice-1-auth-status.md`.

---

### Task 11: Verificación de aceptación (Slice 1)

**Criterios (`PROMPT-IMPLEMENTACION` Slice 1):**

- [ ] Me registro como **pasajero** → `profiles.rol = pasajero` con nombre, dni, teléfono.
- [ ] Me registro como **conductor** → `profiles.rol = conductor` con nombre, apellido, teléfono.
- [ ] Login con email/password funciona.
- [ ] Sin sesión no entro a `/conductor` ni `/operador` (redirect login).
- [ ] Conductor no entra a `/operador` (redirect home conductor).
- [ ] Logout limpia sesión.
- [ ] UI de login/registro respeta tokens Ruta de la siesta y componentes Pencil.
- [ ] `npm run build --workspace=web` OK.
- [ ] No hay valores de negocio hardcodeados (settings intactos).

Comandos:

```bash
npx supabase status
npm run build --workspace=web
npm run dev --workspace=web
# manual: /registro, /registro/conductor, /login, /cuenta
```

---

## Orden de ejecución (resumen)

| # | Task | Pencil antes |
|---|---|---|
| 0 | Inventario Pencil | sí (todo) |
| 1 | Tokens + fonts | variables |
| 2 | Componentes design | AppHeader, Field, Btn*, Dots |
| 3 | Migración profiles RLS | no |
| 4 | Domain/application/actions | no |
| 5 | Middleware + role layouts | no |
| 6 | `/login` | **P10 Gsfap** |
| 7 | Registro pasajero | **P1 f0028** |
| 8 | Registro conductor | **C1 f0221** |
| 9 | Homes + cuenta | P2/P7, C2/C3, P12/C11 |
| 10 | Hooks/provider (si hace falta) | no |
| 11 | Aceptación + doc status | screenshots opcionales |

---

## Fuera de scope (Slice 1)

- OTP / magic link / OAuth Google
- Cifrado DNI (pgcrypto)
- Self-signup operador
- TabBar completa navegable a búsqueda/QR (stubs OK)
- Reserva / seña / QR
- Edición de perfil

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Confirmación de email de Supabase bloquea sesión post-signup | Local: desactivar “Confirm email” en Auth settings; cloud: documentar |
| Middleware deprecado → proxy | Mantener `middleware.ts` hasta migrar; no bloquea |
| Pencil login sin password | 2 fields, misma composición |
| RLS profiles mal armada | Probar con dos usuarios distintos |

---

## Self-review

- Spec Slice 1 PROMPT cubierto: auth, perfiles, RLS, pantallas 1 y 8 (+ login P10 del design system).
- Sin placeholders “TBD”.
- Cada task UI nombra frame Pencil ID.
- Tipos `Rol` alineados a enum SQL.
- Capas respetan AD-1 (domain sin Supabase).

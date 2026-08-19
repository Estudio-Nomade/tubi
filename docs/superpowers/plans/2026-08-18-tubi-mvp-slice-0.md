# Slice 0 — Fundaciones (MVP Tubi) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar tarea por tarea. Los pasos usan `- [ ]` para tracking.

**Goal:** Dejar el repo listo para codear: monorepo `apps/web` (Next.js 16 + shadcn + PWA) + `supabase/` con schema y settings migrados a un proyecto cloud, sin lógica de negocio todavía.

**Architecture:** Monolito modular (AD-14: `apps/web`, `supabase/`, `packages/` opcional). Este slice no toca dominio; solo scaffolding, tema provisional de wireframe (AD-15) y schema (AD-4/AD-5).

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase (`@supabase/supabase-js` 2.x) · Serwist (PWA) · Zod · npm · Node 22.

## Global Constraints

- UI **siempre** con shadcn/ui; no reinventar componentes (AD-15).
- **Nunca hardcodear** valores de negocio; todo en tabla `settings` (AD-5). Los defaults del seed **no son** constantes de código.
- Proveedores siempre detrás de puertos (`PaymentProvider`, `MapsProvider`, `IdentityVerifier`) — no aplica en este slice, pero no introducir SDKs en el dominio.
- `.env` **ignorado y nunca commiteado**; `.env.example` sí se commitea (sin secretos reales).
- Rama: `opencode/mvp-slice-0` desde `grok/fase-6-wireframes`. Conventional Commits, un cambio por commit, **nunca** `git add .`, `Co-Authored-By: deepseek-v4-pro`.
- Paleta provisional del wireframe (no es marca final, AD-15): fondo `#F4F4F5`, tinta `#18181B`, muted `#71717A`, borde `#D4D4D8`, tarjeta `#FFFFFF`, acento `#0D9488`, error `#B91C1C`.
- Español argentino en todo el copy.

## Prerrequisitos (bloqueante — pedir al usuario antes de ejecutar)

Infra cloud elegida. Se necesitan del usuario (para `.env` y `supabase link`):

1. **Project ref** de Supabase (ej. `abcdefghijklmno`).
2. **Database password** (o connection string `postgresql://postgres:…@…:5432/postgres`) para `supabase db push`.
3. **`SUPABASE_URL`** (ej. `https://<ref>.supabase.co`) y **`SUPABASE_ANON_KEY`** (cliente).
4. **`SUPABASE_SERVICE_ROLE_KEY`** (solo server, para migraciones/seed; nunca al cliente).

Google Maps API key recién se usa en el Slice 3; queda como placeholder en `.env.example`.

---

## File Structure (este slice)

```
tubi/
  package.json                     # raíz: workspaces apps/* packages/*, private
  .gitignore                       # + node_modules, .next, .env, .env.*.local
  apps/web/
    package.json                   # Next 16, React 19, deps
    next.config.ts                 # withSerwist
    tsconfig.json                  # + lib webworker, types @serwist/next/typings
    app/
      layout.tsx                   # + Toaster (sonner)
      page.tsx                     # smoke page shadcn (Button, Card)
      globals.css                  # tokens del wireframe
      sw.ts                        # service worker Serwist
      manifest.ts                  # metadata PWA
      icon.svg                      # placeholder (375x)
      ~offline/page.tsx            # shell offline
    src/lib/supabase/              # (se crea en Slice 1; acá no)
  supabase/
    config.toml                    # via `supabase init`
    migrations/
      0001_init.sql                # schema de docs/04 (enums, tablas, índices, RLS enabled)
      0002_seed_settings.sql       # 11 defaults de settings
  .env.example                     # claves (sin valores reales)
```

---

## Task 0: Workspace raíz y gitignore

**Files:**
- Create: `package.json`, `.gitignore` (extender)

**Interfaces:** ninguna (nada consume esto todavía).

- [ ] **Step 1: Crear `package.json` raíz**

```json
{
  "name": "tubi",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "engines": { "node": ">=22" }
}
```

- [ ] **Step 2: Extender `.gitignore`**

Añadir al final del `.gitignore` existente:

```
node_modules/
.next/
out/
.env
.env.*
!.env.example
*.local
supabase/.branches/
supabase/.temp/
```

- [ ] **Step 3: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: workspace root y gitignore para apps/web y supabase

Co-Authored-By: deepseek-v4-pro"
```

---

## Task 1: Scaffold `apps/web` (Next.js 16)

**Files:** Create: `apps/web/**` (generado por create-next-app)

**Interfaces:** Consume el workspace raíz (Task 0).

- [ ] **Step 1: Scaffold**

```bash
cd apps
npx create-next-app@latest web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

En las prompts restantes aceptar defaults recomendados (Turbopack: sí). Si algún flag cambió, confirmar con `npx create-next-app@latest --help` antes de correr. Debe quedar: TS, Tailwind v4, App Router, `src/app`, alias `@/*`.

- [ ] **Step 2: Verificar que corre**

```bash
cd apps/web && npm run build
```

Expected: build OK, sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold Next.js 16 con Tailwind v4

Co-Authored-By: deepseek-v4-pro"
```

---

## Task 2: shadcn/ui + tema provisional + smoke

**Files:**
- Modify: `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`
- Create: `apps/web/components.json` (generado), `apps/web/src/components/**` (generado)

**Interfaces:** Produce el tema CSS con tokens `--primary`, `--background`, etc. que consumirán todas las pantallas (Slices 1–8).

- [ ] **Step 1: `shadcn init`**

```bash
cd apps/web
npx shadcn@latest init
```

Elegir: base color `neutral`, CSS variables `sí`. (Tailwind 4 + `@theme inline`, como en `globals.css` de shadcn v4.)

- [ ] **Step 2: Agregar componentes base**

```bash
npx shadcn@latest add button input label card separator sonner
```

- [ ] **Step 3: Reemplazar tokens en `globals.css`** por la paleta del wireframe (AD-15). El bloque `:root` queda:

```css
:root {
  --radius: 0.625rem;
  --background: #F4F4F5;
  --foreground: #18181B;
  --card: #FFFFFF;
  --card-foreground: #18181B;
  --popover: #FFFFFF;
  --popover-foreground: #18181B;
  --primary: #0D9488;
  --primary-foreground: #FFFFFF;
  --secondary: #F4F4F5;
  --secondary-foreground: #18181B;
  --muted: #F4F4F5;
  --muted-foreground: #71717A;
  --accent: #F4F4F5;
  --accent-foreground: #18181B;
  --destructive: #B91C1C;
  --destructive-foreground: #FFFFFF;
  --border: #D4D4D8;
  --input: #D4D4D8;
  --ring: #0D9488;
}
```

(Dejar el bloque `.dark` como viene shadcn; el MVP es light-only.)

- [ ] **Step 4: Montar `Toaster` en `layout.tsx`**

Añadir dentro de `<body>`:

```tsx
import { Toaster } from "@/components/ui/sonner";
// ...
<Toaster />
```

- [ ] **Step 5: Smoke page** en `src/app/page.tsx` (borrar el contenido default):

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="max-w-[375px] mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Tubi</h1>
      <Card>
        <CardHeader><CardTitle>Slice 0 listo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">shadcn + tema provisional funcionando.</p>
          <Button size="lg" className="w-full">Continuar</Button>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 6: Verificar build**

```bash
npm run build
```

Expected: OK. Confirmar visualmente con `npm run dev` que el botón sale turquesa (`--primary #0D9488`).

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): shadcn/ui con tema provisional del wireframe

Co-Authored-By: deepseek-v4-pro"
```

---

## Task 3: Dependencias runtime + PWA (Serwist)

**Files:**
- Modify: `apps/web/package.json` (deps), `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/sw.ts`, `apps/web/src/app/manifest.ts`, `apps/web/src/app/icon.svg`, `apps/web/src/app/~offline/page.tsx`, `apps/web/src/components/pwa-register.tsx`

**Interfaces:** Produce el service worker `/sw.js` y el manifest PWA que el Slice 8 completa (offline shell + instalable).

- [ ] **Step 1: Instalar deps**

```bash
cd apps/web
npm install zod @supabase/supabase-js
npm install -D serwist @serwist/next
```

- [ ] **Step 2: `next.config.ts`** (con Serwist)

```ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  reactStrictMode: true,
});
```

- [ ] **Step 3: `tsconfig.json`** — añadir `webworker` a `lib` y `types`:

```jsonc
"lib": ["dom", "dom.iterable", "esnext", "webworker"],
"types": ["@serwist/next/typings"],
```

- [ ] **Step 4: `src/app/sw.ts`**

```ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [{ url: "/~offline", matcher({ request }) { return request.destination === "document"; } }],
  },
});

serwist.addEventListeners();
```

- [ ] **Step 5: `src/app/manifest.ts`**

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tubi",
    short_name: "Tubi",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F4F5",
    theme_color: "#0D9488",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
```

- [ ] **Step 6: `src/app/icon.svg`** (placeholder simple)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="10" fill="#0D9488"/>
  <text x="24" y="32" font-family="sans-serif" font-size="22" fill="#FFFFFF" text-anchor="middle" font-weight="bold">T</text>
</svg>
```

- [ ] **Step 7: `src/app/~offline/page.tsx`**

```tsx
export default function Offline() {
  return (
    <main className="max-w-[375px] mx-auto p-4">
      <h1 className="text-2xl font-semibold">Sin conexión</h1>
      <p className="text-sm text-muted-foreground mt-2">Volvé cuando tengas señal.</p>
    </main>
  );
}
```

- [ ] **Step 8: Registrar el SW** en `src/components/pwa-register.tsx` y montarlo en `layout.tsx`:

```tsx
"use client";
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}
```

En `layout.tsx` añadir `<PwaRegister />` antes de `<Toaster />`.

- [ ] **Step 9: Verificar build**

```bash
npm run build
```

Expected: OK, genera `public/sw.js`.

- [ ] **Step 10: Commit**

```bash
git add apps/web
git commit -m "feat(web): PWA con Serwist, zod y cliente Supabase

Co-Authored-By: deepseek-v4-pro"
```

---

## Task 4: Supabase — init + migraciones (schema + settings)

**Files:**
- Create: `supabase/config.toml` (via init), `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_seed_settings.sql`

**Interfaces:** Produce el schema real (`profiles`, `vehiculo`, `ruta`, `parada`, `viaje`, `reserva`, `pago`, `tracking_events`, `settings`) y los defaults de `settings` que consumen los Slices 1–8.

- [ ] **Step 1: `supabase init`**

```bash
supabase init
```

Borra la migración de ejemplo que crea.

- [ ] **Step 2: `0001_init.sql`** — extraer **verbatim** el bloque de migración de `docs/04-modelo-de-datos.md` (líneas 226–360): `pgcrypto`, los 7 enums, las 9 tablas, los 9 índices y los `alter table … enable row level security`. **No** incluir políticas RLS (van en Slice 1 como `0003_rls_policies.sql`).

- [ ] **Step 3: `0002_seed_settings.sql`**

```sql
insert into settings (clave, valor, tipo) values
  ('tarifa.precio_base_tandil_bsas', '0',                            'number'),
  ('tarifa.modelo',                   '"fijo_por_ruta"',             'text'),
  ('comision.plataforma_pct',         '15',                          'number'),
  ('reserva.sena_monto',              '5000',                        'number'),
  ('reserva.espera_max_min',          '5',                           'number'),
  ('reserva.devolucion_24h_pct',      '100',                         'number'),
  ('reserva.devolucion_12_24h_pct',   '50',                          'number'),
  ('reserva.devolucion_menos_12h_pct','0',                           'number'),
  ('pagos.metodos',                   '["efectivo","transferencia"]','json'),
  ('verificacion.dni_modo',           '"manual"',                    'text'),
  ('feature.ratings_habilitado',      'false',                       'boolean');
```

- [ ] **Step 4: Commit**

```bash
git add supabase
git commit -m "feat(supabase): migración de schema y seed de settings

Co-Authored-By: deepseek-v4-pro"
```

---

## Task 5: Cloud — link, push, `.env` y `.env.example`

> **BLOQUEADO** hasta recibir credenciales cloud del usuario (project ref, DB password, `SUPABASE_URL`, anon key, service role key).

**Files:**
- Create: `.env.example`, `.env` (local, **no commiteado**)

**Interfaces:** Consume el schema de Task 4; produce las claves de conexión que usan todos los slices posteriores.

- [ ] **Step 1: `supabase login` + link**

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
```

- [ ] **Step 2: Aplicar migraciones**

```bash
supabase db push
```

Expected: aplica `0001_init.sql` y `0002_seed_settings.sql` sin errores.

- [ ] **Step 3: `.env.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

- [ ] **Step 4: `.env` local** con los valores reales que pasó el usuario. `SUPABASE_SERVICE_ROLE_KEY` solo server-side.

- [ ] **Step 5: Verificar settings en cloud** (script efímero, no commitear):

```bash
cd apps/web
node -e "
const { createClient } = require('@supabase/supabase-js');
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
c.from('settings').select('clave').then(r => console.log('settings:', r.data?.length, r.error ?? ''));
"
```

Expected: `settings: 11` sin error.

- [ ] **Step 6: Commit `.env.example`** (`.env` queda ignorado)

```bash
git add .env.example
git commit -m "chore: .env.example con claves de Supabase y Maps

Co-Authored-By: deepseek-v4-pro"
```

---

## Task 6: Aceptación del slice

- [ ] **Step 1: Verificación completa**

```bash
npm run build          # apps/web compila
supabase db push       # idempotente: "no pending migrations"
```

- [ ] **Step 2: Chequear `git status`** limpio (solo `.env` sin trackear) y revisar `git log --oneline -6`.

**Aceptación (PROMPT-IMPLEMENTACION Slice 0):** `apps/web` compila y corre con shadcn funcionando; migración aplicada en cloud; tabla `settings` con los 11 defaults.

---

## Fuera de este slice (próximos)

- Slice 1: Auth Supabase + trigger `profiles` + RLS (`0003_rls_policies.sql`) + pantallas 1 y 8.
- Slice 2: lector de `settings` con caché, máquinas de estado, puertos.
- Slices 3–8: viajes, reserva+seña+QR, operador, conductor, tracking, PWA/demo.

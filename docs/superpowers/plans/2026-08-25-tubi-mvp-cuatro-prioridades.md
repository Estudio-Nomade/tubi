# Tubi MVP — Cuatro prioridades finales

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Commits: usuario firma con `git commit -S` (GPG). Nunca `git add .`.

**Goal:** Cerrar el MVP operable con (1) Mis Reservas pulida y descubrible, (2) conductor puede finalizar viaje → `completado`, (3) C5 Recogida fiel al Pencil con timer y “No llegó” claros, (4) hardening + seed demo listo.

**Architecture:** Capas estrictas `domain → application → adapters → app/UI`. Mutaciones de estado de viaje/reserva = RPC security definer + RLS. Valores de negocio solo desde `settings` (nunca hardcode). UI Ruta de la Siesta (Fraunces títulos, DM Sans cuerpo, crema/terracota). **Antes de tocar UI nueva o cambiar layout:** consultar Pencil `design-artifacts/tubi-wireframes.pen` (MCP Pencil o, si no hay MCP, inventory + previews en `design-artifacts/previews/` + inventories en `docs/superpowers/plans/*-task0-inventory.md`).

**Tech Stack:** Next.js (apps/web) · Supabase (Postgres RPC + RLS) · Server Actions · design system en `apps/web/src/components/design/*` · bun.

**Fuentes leídas antes de este plan:** `docs/01-prd.md`, `docs/03-flujos-de-usuario.md`, `docs/06-reglas-y-estados.md`, `docs/15-demo-ready-status.md`, `docs/18-slice-8-noshow-status.md`, plan maestro `2026-08-23-tubi-mvp-cierre-maestro.md`, Pencil inventory C5, previews `10-conductor-recogida.png` / `16-pasajero-home.png`, código actual en `apps/web`.

---

## 0. Inventario honesto (qué ya está vs qué falta)

| Prioridad | Estado hoy | Gap real |
|---|---|---|
| **1. Mis Reservas** | **Existe** `/pasajero/reservas` + `listForPassenger` + cancel + link Home + empty | Pulido: TabBar marca mal `active`, CTA “Ver QR” poco visible en cards, estados `verificada`/`abordada` sin acción clara, acceso desde Cuenta |
| **2. Finalizar viaje** | **No existe** (solo auto `en_curso` al no quedar pendientes) | RPC `completar_viaje`, domain transitions, CTA hub, feedback, opcional cancel viaje operador (scope mínimo: solo conductor completa) |
| **3. C5 Recogida** | **Existe** timer + no-show + ruta + setting | Fidelity Pencil: copy “No llegó”, feedback timer vencido (color/alerta), CTA danger más clara, sección no-show en hub, timer no se reinicia al navegar si se puede anclar a sessionStorage |
| **4. Hardening** | EmptyHint básico + seed `0014` + migraciones S7/S8/S10 | Mensajes consistentes, empty states con CTA, seed “día de demo” actualizado post-completado, checklist go/no-go, aplicar migraciones |

**Orden de ejecución (dependencias):**

```
Ola A (paralelo, sin pisar ownership):
  P1 Mis Reservas polish  ∥  P3 C5 polish

Ola B (bloqueante ciclo viaje):
  P2 Finalizar viaje (S9 mínimo conductor)

Ola C:
  P4 Hardening + seed + checklist
```

**Fuera de este plan (congelado):** tracking mapa, alta viaje UI, notificaciones push, cancel viaje operador (stretch si sobra tiempo al final de P2).

---

## 1. Mapa de archivos

### Crear

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/0018_slice9_completar_viaje.sql` | RPC `completar_viaje` |
| `apps/web/src/domain/viajes/states.ts` | Transiciones válidas viaje + helpers |
| `apps/web/src/domain/viajes/complete.ts` | Códigos error + mensajes usuario completar |
| `apps/web/src/components/conductor/complete-trip-button.tsx` | CTA Finalizar viaje (client) |
| `docs/20-slice-9-completar-viaje-status.md` | Status slice |
| `docs/16-mvp-launch-checklist.md` | Go/no-go |
| `docs/superpowers/plans/2026-08-25-p1-mis-reservas-inventory.md` | Task 0 Pencil P1 |
| `docs/superpowers/plans/2026-08-25-p3-c5-polish-inventory.md` | Task 0 Pencil C5 re-check |

### Modificar (principales)

| Archivo | Cambio |
|---|---|
| `apps/web/src/domain/conductor/ports.ts` + `types.ts` | `completeTrip` |
| `apps/web/src/application/conductor/*` | service + `completeTripAction` |
| `apps/web/src/adapters/supabase/conductor-repository.ts` | RPC call |
| `apps/web/src/lib/supabase/types.ts` | Function type |
| `apps/web/src/app/conductor/viajes/[id]/page.tsx` | CTA finalizar si `en_curso` |
| `apps/web/src/app/conductor/page.tsx` | Pill `completado` + empty post-cierre |
| `apps/web/src/app/pasajero/reservas/page.tsx` | CTAs QR, TabBar active, copy |
| `apps/web/src/app/pasajero/page.tsx` | Acceso Mis reservas más visible |
| `apps/web/src/app/cuenta/page.tsx` | Link Mis reservas (si aplica) |
| `apps/web/src/components/conductor/no-show-button.tsx` | Label “No llegó” + estado timer done |
| `apps/web/src/components/conductor/wait-timer.tsx` | Estado vencido visual |
| `apps/web/src/components/conductor/pickup-actions.tsx` | Banner timer done |
| `apps/web/src/components/conductor/passenger-row.tsx` | “No llegó” más visible |
| `supabase/migrations/0014_slice7_demo_pack.sql` o **nuevo** `0019_demo_pack_refresh.sql` | Datos demo día actual |

---

## 2. Decisiones de producto (cerradas en este plan)

| Tema | Decisión |
|---|---|
| Mis Reservas | **No rehacer** la lista; pulir descubribilidad y CTAs. Ruta sigue `/pasajero/reservas`. |
| QR en lista | `confirmada` → botón/link primario “Ver QR”. `pendiente_sena` → “Completar seña”. Resto: solo detalle visual / sin CTA primaria. |
| Finalizar viaje | Solo conductor del viaje (u operador). Guard: viaje `en_curso` y **cero** reservas en `confirmada` o `verificada`. Terminal: `completado`. |
| Cancel viaje operador | **Fuera** del MVP de estas 4 prioridades (stretch opcional al final de P2). |
| Timer C5 | Client-side. Persist key `tubi:wait:{reservaId}` en `sessionStorage` (inicio epoch) para no reiniciar al volver del scanner. |
| Copy no-show | Pencil/hub: **“No llegó”** como label principal del danger CTA; confirm dialog explica retención de seña. |
| Settings espera | Siempre `settings.reserva.espera_max_min` vía `getSetting`. |
| Seed | Usuarios demo existentes (`demo-demo-1`); refrescar fechas a “hoy” + estados útiles para probar las 4 prioridades. |

---

# Ola A — Prioridad 1: Mis Reservas (polish)

### Task 1.0: Inventario Pencil (Mis Reservas / Home)

**Files:**
- Create: `docs/superpowers/plans/2026-08-25-p1-mis-reservas-inventory.md`

- [ ] **Step 1: Consultar diseño**

Usar MCP Pencil sobre `design-artifacts/tubi-wireframes.pen` si está disponible; si no, leer:

- `design-artifacts/previews/16-pasajero-home.png`
- `design-artifacts/previews/16b-pasajero-home-empty.png`
- `docs/superpowers/specs/2026-08-19-tubi-homes-design.md`
- Cards P7 en `apps/web/src/app/pasajero/page.tsx` y lista en `reservas/page.tsx`

Documentar en el inventory:

| Token | Valor esperado |
|---|---|
| Card | `rounded-2xl border bg-card p-4 shadow` |
| StatusPill | ok / pending / danger |
| CTA primaria | BtnPrimary h-13 |
| Empty | EmptyHint + “Buscar viaje” |
| Acceso Home | link “Ver todas mis reservas” (ya existe) |

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-08-25-p1-mis-reservas-inventory.md
# Usuario: git commit -S -m "docs(pasajero): inventory pencil mis reservas polish"
```

---

### Task 1.1: CTAs por estado en lista Mis Reservas

**Files:**
- Modify: `apps/web/src/app/pasajero/reservas/page.tsx`
- Modify: `apps/web/src/components/design/tab-bar.tsx` (solo si se agrega active key; preferir prop `active` correcta sin tocar tabs)

- [ ] **Step 1: Corregir TabBar active en Mis Reservas**

En `pasajero/reservas/page.tsx`, hoy `active="inicio"`. Dejar `active="inicio"` **o** si se prefiere no resaltar mal, documentar que no hay tab dedicado (OK). **No** agregar tab nuevo (rompe TabBar con Track A histórico).

Mejorar el link Home: en `pasajero/page.tsx` el link ya existe; subir jerarquía visual:

```tsx
// En pasajero/page.tsx — debajo del hero / empty
<Link
  href="/pasajero/reservas"
  className="inline-flex h-11 w-full items-center justify-center rounded-[14px] border border-border bg-card text-sm font-semibold text-foreground"
>
  Mis reservas
</Link>
```

Mantener el underline secundario solo si queda redundante — preferir **un** CTA claro “Mis reservas”.

- [ ] **Step 2: CTA primaria en cada card según estado**

Reemplazar/ampliar `hrefForItem` + body de card:

```tsx
function primaryAction(item: ReservaListItem): {
  href: string;
  label: string;
} | null {
  switch (item.estado) {
    case "confirmada":
      return { href: `/pasajero/pase/${item.reservaId}`, label: "Ver QR" };
    case "pendiente_sena":
      return {
        href: `/pasajero/reservas/${item.reservaId}/sena`,
        label: "Completar seña",
      };
    default:
      return null;
  }
}
```

En el JSX de cada `<li>`, debajo del body (o dentro de la card):

```tsx
{action ? (
  <BtnPrimary asChild className="h-11 text-base">
    <Link href={action.href}>{action.label}</Link>
  </BtnPrimary>
) : null}
```

Mantener `CancelReservaButton` debajo cuando `canCancelReserva`.

Para `abordada` / `verificada` / `no_show` / `cancelada`: solo pill + meta (sin CTA primaria). Copy opcional bajo pill:

- `verificada` → “El conductor ya escaneó tu QR.”
- `abordada` → “Viajaste. Gracias.”
- `no_show` → “No te presentaste en la parada.”

- [ ] **Step 3: Empty state**

Ya tiene EmptyHint + Buscar viaje. Alinear copy con Home:

```tsx
<EmptyHint message="Todavía no tenés reservas. Buscá un viaje Tandil ↔ Buenos Aires." />
```

- [ ] **Step 4: Link desde Cuenta**

Si `apps/web/src/app/cuenta/page.tsx` no linkea a `/pasajero/reservas` para rol pasajero, agregar fila/link “Mis reservas”.

- [ ] **Step 5: Type-check**

```bash
cd apps/web && bun run type-check
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/pasajero/reservas/page.tsx apps/web/src/app/pasajero/page.tsx apps/web/src/app/cuenta/page.tsx
# Usuario: git commit -S -m "feat(pasajero): polish mis reservas CTAs and discovery"
```

---

# Ola A — Prioridad 3: C5 Recogida polish

### Task 3.0: Re-inventario Pencil C5

**Files:**
- Create: `docs/superpowers/plans/2026-08-25-p3-c5-polish-inventory.md`
- Read: `docs/superpowers/plans/2026-08-23-slice8-task0-inventory.md`
- Preview: `design-artifacts/previews/10-conductor-recogida.png`

- [ ] **Step 1: Confirmar tokens C5**

Del inventory existente (C5 `f0264`, WaitTimer `WqVkL`):

| Elemento | Spec |
|---|---|
| StopTitle | Fraunces 22/600 |
| PassengerName | DM 16/600 |
| WaitCopy | “Espera máxima N min. Si no llega, no-show y seguís.” |
| WaitTimer | Fraunces 40 tabular + “tiempo de espera” |
| Primary | “Escanear QR” |
| Danger | Pencil dice “Marcar no-show”; hub usa “No llegó” → **UI: label “No llegó”**, dialog explica no-show |
| Next | “Siguiente · …” |

Anotar gaps actuales vs código:

1. Danger label = “Marcar no-show” → cambiar a “No llegó”.
2. Sin feedback visual al vencer timer (solo `timerDone` booleano).
3. Timer se reinicia al remount.
4. Hub: “No llegó” es link chico solo en `verificada`.

- [ ] **Step 2: Commit inventory**

```bash
git add docs/superpowers/plans/2026-08-25-p3-c5-polish-inventory.md
# Usuario: git commit -S -m "docs(conductor): c5 polish pencil inventory"
```

---

### Task 3.1: WaitTimer — persistencia + estado vencido

**Files:**
- Modify: `apps/web/src/components/conductor/wait-timer.tsx`
- Modify: `apps/web/src/components/conductor/pickup-actions.tsx`

- [ ] **Step 1: Persistir inicio de espera en sessionStorage**

```tsx
// wait-timer.tsx — idea de API
type Props = {
  maxMinutes: number;
  storageKey: string; // e.g. `tubi:wait:${reservaId}`
  onExpired?: () => void;
  className?: string;
};

function readStartedAt(key: string): number {
  if (typeof window === "undefined") return Date.now();
  const raw = sessionStorage.getItem(key);
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const now = Date.now();
  sessionStorage.setItem(key, String(now));
  return now;
}
```

Calcular `remaining` desde `startedAt + maxMinutes*60*1000 - now` cada segundo (no countdown ciego desde mount).

- [ ] **Step 2: Visual vencido**

Cuando `remaining === 0`:

- Número en danger soft: `text-[#B42318]`
- Label: “tiempo agotado”
- Opcional: contenedor `rounded-2xl bg-[#FCEBEA] px-4 py-6`

- [ ] **Step 3: PickupActions banner**

```tsx
{timerDone ? (
  <p
    className="rounded-xl bg-[#FCEBEA] px-3 py-2 text-center text-sm font-semibold text-[#B42318]"
    role="status"
  >
    Se acabó la espera. Si no está, marcá “No llegó” y seguí.
  </p>
) : null}
```

Pasar `storageKey={`tubi:wait:${reservaId}`}`.

- [ ] **Step 4: Type-check + commit**

```bash
cd apps/web && bun run type-check
# Usuario: git commit -S -m "feat(conductor): persist wait timer and expired state on C5"
```

---

### Task 3.2: Copy y CTA “No llegó”

**Files:**
- Modify: `apps/web/src/components/conductor/no-show-button.tsx`
- Modify: `apps/web/src/components/conductor/passenger-row.tsx`
- Modify: `apps/web/src/app/conductor/viajes/[id]/recogida/[reservaId]/page.tsx` (solo si copy)

- [ ] **Step 1: NoShowButton labels**

```tsx
<BtnDanger type="button" disabled={pending} onClick={markNoShow}>
  {pending ? "Marcando…" : timerDone ? "No llegó" : "No llegó"}
</BtnDanger>
```

Confirm early (si `!timerDone`):

```text
¿Marcar que no llegó antes de que termine la espera? Se retiene la seña y seguís con el resto.
```

Confirm after timer (opcional, más corto) o directo sin confirm si `timerDone` — **decisión:** sin confirm extra si timer venció (menos fricción en calle).

- [ ] **Step 2: Hub PassengerRow**

Para `confirmada`: row → recogida (ya).  
Para `verificada`: además del link “No llegó”, mostrar botón texto más grande:

```tsx
<Link
  href={recogidaHref}
  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#FCEBEA] text-sm font-semibold text-[#B42318]"
>
  No llegó
</Link>
```

- [ ] **Step 3: Type-check + commit**

```bash
cd apps/web && bun run type-check
# Usuario: git commit -S -m "feat(conductor): clarify No llegó CTAs on C5 and hub"
```

---

# Ola B — Prioridad 2: Finalizar viaje

### Task 2.0: Domain — máquina de estados viaje

**Files:**
- Create: `apps/web/src/domain/viajes/states.ts`
- Create: `apps/web/src/domain/viajes/complete.ts`
- Modify: `apps/web/src/domain/viajes/index.ts`

- [ ] **Step 1: Transiciones (espejo docs/06)**

```ts
// apps/web/src/domain/viajes/states.ts
import type { EstadoViaje } from "./types";

export const VIAJE_TRANSITIONS: Record<EstadoViaje, readonly EstadoViaje[]> = {
  programado: ["recogida", "cancelado"],
  recogida: ["en_curso", "cancelado"],
  en_curso: ["completado", "cancelado"],
  completado: [],
  cancelado: [],
};

export function canTransitionViaje(
  from: EstadoViaje,
  to: EstadoViaje,
): boolean {
  return (VIAJE_TRANSITIONS[from] as readonly string[]).includes(to);
}

export function canCompleteViaje(estado: EstadoViaje): boolean {
  return estado === "en_curso";
}
```

```ts
// apps/web/src/domain/viajes/complete.ts
export type CompleteTripErrorCode =
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "TRANSICION_INVALIDA"
  | "PENDIENTES_ACTIVOS"
  | "UNKNOWN";

export function mapCompleteTripErrorMessage(msg: string): CompleteTripErrorCode {
  if (msg.includes("NO_AUTENTICADO")) return "NO_AUTENTICADO";
  if (msg.includes("NO_AUTORIZADO")) return "NO_AUTORIZADO";
  if (msg.includes("NO_ENCONTRADO")) return "NO_ENCONTRADO";
  if (msg.includes("TRANSICION_INVALIDA")) return "TRANSICION_INVALIDA";
  if (msg.includes("PENDIENTES_ACTIVOS")) return "PENDIENTES_ACTIVOS";
  return "UNKNOWN";
}

export function completeTripErrorUserMessage(code: CompleteTripErrorCode): string {
  switch (code) {
    case "NO_AUTORIZADO":
      return "No tenés permiso para finalizar este viaje.";
    case "TRANSICION_INVALIDA":
      return "Este viaje no se puede finalizar ahora.";
    case "PENDIENTES_ACTIVOS":
      return "Todavía hay pasajeros pendientes de abordar o verificar.";
    case "NO_ENCONTRADO":
      return "No encontramos el viaje.";
    default:
      return "No se pudo finalizar el viaje.";
  }
}
```

Exportar desde `domain/viajes/index.ts`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/domain/viajes/
# Usuario: git commit -S -m "feat(domain): viaje complete transitions and error copy"
```

---

### Task 2.1: Migración RPC `completar_viaje`

**Files:**
- Create: `supabase/migrations/0018_slice9_completar_viaje.sql`

- [ ] **Step 1: Escribir RPC**

```sql
-- 0018_slice9_completar_viaje.sql
-- Conductor closes trip: en_curso → completado (RN-06).

create or replace function public.completar_viaje(p_viaje_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
  v_pending int;
  v_ruta public.ruta%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('conductor', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = p_viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_rol = 'conductor' and v_viaje.conductor_id <> v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_viaje.estado <> 'en_curso' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  select count(*) into v_pending
  from public.reserva r
  where r.viaje_id = v_viaje.id
    and r.estado in ('confirmada', 'verificada');

  if v_pending > 0 then
    raise exception 'PENDIENTES_ACTIVOS' using errcode = 'P0001';
  end if;

  -- Close dangling pendiente_sena as cancelada (docs/06 edge case)
  update public.reserva
  set estado = 'cancelada', updated_at = now()
  where viaje_id = v_viaje.id
    and estado = 'pendiente_sena';

  update public.viaje
  set estado = 'completado', updated_at = now()
  where id = v_viaje.id;

  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;

  return jsonb_build_object(
    'ok', true,
    'viaje_id', v_viaje.id,
    'estado', 'completado',
    'origen', coalesce(v_ruta.origen, ''),
    'destino', coalesce(v_ruta.destino, '')
  );
end;
$$;

revoke all on function public.completar_viaje(uuid) from public;
grant execute on function public.completar_viaje(uuid) to authenticated;
```

Notas:

- No hardcodear montos.
- No tocar pagos en este RPC (devoluciones de seña no confirmada = 0 implícito al cancelar pendiente).
- Si más adelante se quiere log de eventos, otra migración.

- [ ] **Step 2: Aplicar local**

```bash
# Desde repo, según flujo del proyecto:
cd /home/imn0p/tubi/tubi && npx supabase db reset
# o migrate up si ya hay datos que no se quieren perder
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0018_slice9_completar_viaje.sql
# Usuario: git commit -S -m "feat(db): add completar_viaje RPC"
```

---

### Task 2.2: Ports, adapter, service, action

**Files:**
- Modify: `apps/web/src/domain/conductor/types.ts`
- Modify: `apps/web/src/domain/conductor/ports.ts`
- Modify: `apps/web/src/adapters/supabase/conductor-repository.ts`
- Modify: `apps/web/src/application/conductor/conductor-service.ts`
- Modify: `apps/web/src/application/conductor/actions.ts`
- Modify: `apps/web/src/application/conductor/index.ts`
- Modify: `apps/web/src/lib/supabase/types.ts`

- [ ] **Step 1: Types**

```ts
// domain/conductor/types.ts
export type CompleteTripResult = {
  ok: true;
  viajeId: string;
  estado: "completado";
  origen: string;
  destino: string;
};
```

```ts
// ports.ts — agregar
completeTrip(viajeId: string): Promise<CompleteTripResult>;
```

- [ ] **Step 2: Repository**

```ts
async completeTrip(viajeId: string): Promise<CompleteTripResult> {
  const { data, error } = await client.rpc("completar_viaje", {
    p_viaje_id: viajeId,
  });
  if (error) throw new Error(error.message);
  const row = data as {
    ok: boolean;
    viaje_id: string;
    estado: string;
    origen: string;
    destino: string;
  };
  return {
    ok: true,
    viajeId: row.viaje_id,
    estado: "completado",
    origen: row.origen,
    destino: row.destino,
  };
}
```

- [ ] **Step 3: Service + Action**

```ts
// actions.ts
export async function completeTripAction(
  viajeId: string,
): Promise<ActionError | void> {
  if (!viajeId) return { error: "Viaje inválido." };
  await requireProfile(["conductor", "operador"]);
  const supabase = await createClient();
  const service = createConductorService(
    createSupabaseConductorRepository(supabase),
  );
  try {
    await service.completeTrip(viajeId);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const msg = err instanceof Error ? err.message : "";
    const code = mapCompleteTripErrorMessage(msg);
    return { error: completeTripErrorUserMessage(code) };
  }
  revalidatePath("/conductor");
  revalidatePath(`/conductor/viajes/${viajeId}`);
  redirect(`/conductor/viajes/${viajeId}?ok=completado`);
}
```

Exportar action desde `application/conductor/index.ts`.

- [ ] **Step 4: Types Supabase Functions**

Agregar `completar_viaje: { Args: { p_viaje_id: string }; Returns: Json }` en `lib/supabase/types.ts` (mismo patrón que `marcar_no_show`).

- [ ] **Step 5: Type-check + commit**

```bash
cd apps/web && bun run type-check
# Usuario: git commit -S -m "feat(conductor): complete trip application path"
```

---

### Task 2.3: UI hub — CTA Finalizar viaje

**Files:**
- Create: `apps/web/src/components/conductor/complete-trip-button.tsx`
- Modify: `apps/web/src/app/conductor/viajes/[id]/page.tsx`
- Modify: `apps/web/src/app/conductor/page.tsx`

- [ ] **Step 1: Pencil C8 CTA (sin mapa)**

Del design system: BtnPrimary full width. Copy: **“Finalizar viaje”**.  
Solo visible si `trip.estado === "en_curso"` y `pendientes.length === 0`.

```tsx
// complete-trip-button.tsx
"use client";
import { useState, useTransition } from "react";
import { completeTripAction } from "@/application/conductor";
import { BtnPrimary } from "@/components/design";

export function CompleteTripButton({ viajeId }: { viajeId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex w-full flex-col gap-2">
      {error ? (
        <div className="rounded-xl bg-[#FCEBEA] px-3.5 py-3" role="alert">
          <p className="text-sm font-semibold text-[#B42318]">{error}</p>
        </div>
      ) : null}
      <BtnPrimary
        type="button"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            "¿Confirmás que llegaron a destino y el viaje terminó bien?",
          );
          if (!ok) return;
          setError(null);
          start(async () => {
            const res = await completeTripAction(viajeId);
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending ? "Finalizando…" : "Finalizar viaje"}
      </BtnPrimary>
    </div>
  );
}
```

- [ ] **Step 2: Integrar en hub**

En `conductor/viajes/[id]/page.tsx`:

- Banner `ok === "completado"` verde: “Viaje finalizado. Gracias.”
- Pill para `completado`: `{ label: "Completado", variant: "ok" }`
- Si `en_curso` y sin pendientes: render `<CompleteTripButton viajeId={trip.id} />` **arriba** o en lugar del “Escanear otro QR” primario (mantener escanear como secondary link si hace falta edge case).
- Si `completado`: no mostrar StartPickup ni scan primario; empty amable “Este viaje ya terminó.”

- [ ] **Step 3: Home conductor**

En `tripEstadoPill` agregar `completado`. Lista del día: viajes completados al final o pill visible.

- [ ] **Step 4: Type-check + build**

```bash
cd apps/web && bun run type-check && bun run build
```

- [ ] **Step 5: Commit + status doc**

```bash
# status doc docs/20-slice-9-completar-viaje-status.md
# Usuario: git commit -S -m "feat(conductor): finalize trip UI and status"
```

---

### Task 2.4 (stretch, opcional): Cancelar viaje operador

Solo si sobra tiempo después de P2+P4. RPC `cancelar_viaje` + UI mínima en `/operador`. **No bloquea las 4 prioridades del usuario.**

---

# Ola C — Prioridad 4: Hardening y pulido

### Task 4.1: Mensajes de error consistentes

**Files:** revisar actions en:

- `application/reservas/actions.ts`
- `application/conductor/actions.ts`
- `application/pagos/actions.ts`
- `application/operador/actions.ts`

- [ ] **Step 1: Auditoría rápida**

Buscar returns `{ error: "..." }` genéricos y alinear tono rioplatense, sin jerga técnica:

| Mal | Bien |
|---|---|
| “Error” | “No se pudo completar la acción. Probá de nuevo.” |
| message crudo RPC | mapear a user message domain |

- [ ] **Step 2: Commit**

```bash
# Usuario: git commit -S -m "fix(ux): consistent user-facing error messages"
```

---

### Task 4.2: Empty states

**Files:** páginas con `EmptyHint`

| Ruta | Copy sugerido | CTA |
|---|---|---|
| `/pasajero` | “Todavía no tenés un viaje” | Buscar viaje |
| `/pasajero/reservas` | “Todavía no tenés reservas…” | Buscar viaje |
| `/pasajero/pase` | “Todavía no tenés un pase…” | Mis reservas / Buscar |
| `/conductor` | “No hay viajes asignados hoy” | (sin CTA o “Volvé más tarde”) |
| `/conductor/viajes/[id]` sin pax | “No hay pasajeros confirmados…” | — |
| `/operador` | “No hay señas pendientes…” | — |

- [ ] **Step 1: Unificar tono y CTAs faltantes** (pase empty → link a `/pasajero/reservas`).
- [ ] **Step 2: Commit**

```bash
# Usuario: git commit -S -m "fix(ux): improve empty states copy and CTAs"
```

---

### Task 4.3: Seed demo usable post-MVP

**Files:**
- Create: `supabase/migrations/0019_demo_pack_mvp_close.sql` (idempotente upsert)
- Or update docs/script only if prefer not to mutate 0014

Seed debe dejar **después de `db reset`**:

| Actor | Estado listo para |
|---|---|
| Ana pasajero | ≥1 `confirmada` con QR + opcional `pendiente_sena` |
| Luis conductor | 1 viaje `en_curso` con todos abordados/no_show **listo para Finalizar** + 1 viaje `recogida` con 1 confirmada para C5 |
| Operador | ≥1 seña pendiente cola |
| Fecha | `fecha_salida` = hoy (America/Argentina/Buenos_Aires) |

Password sigue `demo-demo-1` (doc en `docs/15-demo-ready-status.md` actualizar).

- [ ] **Step 1: Escribir migración seed refresh**
- [ ] **Step 2: Actualizar `docs/15-demo-script.md`** con paso “Finalizar viaje” y “Mis reservas → Ver QR”
- [ ] **Step 3: Commit**

```bash
# Usuario: git commit -S -m "chore(db): demo seed for mvp close scenarios"
```

---

### Task 4.4: Checklist go/no-go

**Files:**
- Create: `docs/16-mvp-launch-checklist.md`

```markdown
# MVP launch checklist

## DB
- [ ] Migraciones 0001 → 0019 aplicadas
- [ ] Seed demo solo en local/staging
- [ ] Storage comprobantes OK

## Smoke por rol (5–7 min)
- [ ] Pasajero: buscar → reservar → seña → (operador confirma) → Mis reservas → Ver QR
- [ ] Conductor: iniciar recogida → C5 timer → escanear → saldo → no-show en otro → Finalizar viaje
- [ ] Operador: confirmar seña + editar setting seña/espera

## UI
- [ ] Mobile 375px sin overflow horizontal en flujos P0
- [ ] Empty states con salida
- [ ] Errores legibles (sin stack)

## Go / No-go
- Go si smoke 3 roles OK y completar_viaje funciona en staging
```

- [ ] **Step 1: Ejecutar smoke local y marcar**
- [ ] **Step 2: Commit**

```bash
# Usuario: git commit -S -m "docs: mvp launch checklist"
```

---

### Task 4.5: Verify final

```bash
cd /home/imn0p/tubi/tubi/apps/web && bun run type-check && bun run build
```

Expected: ambos exit 0.  
Smoke manual según checklist.

---

## 3. Criterios de aceptación (Definition of Done)

| # | Criterio | Evidencia |
|---|---|---|
| 1 | Desde Home pasajero se llega a Mis Reservas en ≤2 taps | UI |
| 2 | Reserva `confirmada` muestra CTA “Ver QR” obvio | UI |
| 3 | Conductor con viaje `en_curso` sin pendientes puede Finalizar → DB `completado` | RPC + UI |
| 4 | C5 muestra timer legible; al vencer, feedback + “No llegó” | UI |
| 5 | No-show sigue reteniendo seña (sin mover plata) | RPC 0016 |
| 6 | `espera_max_min` sale de settings | código |
| 7 | Empty states con CTA de salida donde aplica | UI |
| 8 | Seed permite demo 5–7 min de las 4 prioridades | 0019 + script |
| 9 | `type-check` + `build` verdes | CI local |

---

## 4. Estimación de tiempo

| Bloque | Esfuerzo (1 dev + IA) |
|---|---|
| P1 Mis Reservas polish | **2–4 h** |
| P3 C5 polish (timer persist + copy + hub) | **3–5 h** |
| P2 Finalizar viaje (RPC + capas + UI) | **4–6 h** |
| P4 Hardening + seed + checklist + smoke | **3–5 h** |
| Buffer integración / regresiones | **2–3 h** |
| **Total** | **~1.5–2.5 días hábiles** (~12–20 h) |

Si se suma cancel viaje operador (stretch): **+3–4 h**.

---

## 5. Riesgos

| Riesgo | Mitigación |
|---|---|
| Migraciones 0015–0018 no aplicadas en entorno | Checklist Task 4.4; `db reset` en local antes de demo |
| Timer sessionStorage se pierde al cerrar tab | Aceptable MVP; documentar en status |
| Conductor finaliza con pendientes | Guard RPC `PENDIENTES_ACTIVOS` |
| Pencil MCP no disponible en sesión | Usar previews + inventories existentes (ya hay C5 inventory) |
| Commits GPG | Agente prepara stage; humano `git commit -S` |

---

## 6. Self-review del plan

1. **Spec coverage:** P1–P4 del pedido del usuario → Tasks 1.x, 2.x, 3.x, 4.x. PRD FR-11, FR-12/13, FR-21, hardening.
2. **Placeholders:** no hay TBD; código RPC y snippets de UI incluidos.
3. **Capas:** domain states → application actions → supabase adapter → pages.
4. **Pencil:** Task 0 en P1 y P3 antes de UI.
5. **No rehacer** Mis Reservas/C5 desde cero: polish sobre base existente (ahorra ~2 días vs rewrite).

---

## 7. Setup BMAD Loop (esta sesión)

Completado en paralelo al plan:

- Upgrade orquestador **0.9.0 → 0.11.1**
- `bmad-loop init --cli opencode --force-skills` (+ codex hooks previos)
- `policy.toml` adapter → `opencode`
- `_bmad/bmad-loop/module-help.csv` refrescado
- `validate` preflight: faltan `sprint-status.yaml`, skills bmm en `.claude/skills` para run unattended, worktree limpio

Para corridas unattended futuras: `bmad-sprint-planning` + skills bmm (`bmad-build-auto`) + worktree limpio.

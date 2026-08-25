# Slice 5 — Lado Conductor Mínimo (viaje + lista + escanear QR)

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** El conductor ve el **viaje del día**, la **lista de pasajeros** con seña confirmada, **escanea el QR** del pasajero (Pencil **C6**) y obtiene feedback **OK (C9)** / **inválido (C10)**. Escaneo válido → `reserva.estado: confirmada → verificada` (RN-VERIFICACION / AD-11), validado **server-side** (viaje + conductor + vehículo).

**Architecture:** Server-first, capas `domain → application → adapters`. Mutación atómica vía RPC `verificar_reserva_qr`. Lectura: viajes del conductor + reservas del viaje (RLS). UI Ruta de la siesta fiel a Pencil C2/C3/C6/C9/C10. Cámara client-side (`html5-qrcode`) + fallback input manual del token (demo desktop).

**Tech Stack:** Next.js 16 · Supabase RLS/RPC · `html5-qrcode` · design system existente · `requireProfile(["conductor","operador"])`.

**Commits:** usuario con `git commit -S`. Paths siempre bajo `apps/web/src/...`.

**Pencil MCP:** si no hay MCP en la sesión, Task 0 con dump `.pen` + previews (mismo criterio que Slice 4).

---

## Contexto al arrancar

| Pieza | Estado |
|---|---|
| Pasajero: reserva + seña + QR `opq_…` | OK (Slices 2–4) |
| `confirmada → verificada` en domain `states.ts` | OK (transición ya modelada) |
| `/conductor` | Stub empty (C2) |
| RLS `reserva` SELECT | Solo pasajero dueño + operador — **falta conductor del viaje** |
| RPC verificar QR | **No existe** |
| Pencil C3 Home | `design-artifacts/tubi-wireframes.pen` + preview `17-conductor-home.png` |
| Pencil C6 Escanear | preview `11-conductor-escanear-qr.png` |
| Pencil C9 OK / C10 inválido | en `.pen` (sin preview dedicado; dump obligatorio) |
| C5 Recogida (timer 5 min) | **Fuera** de este slice (simplificado) |
| C7 Saldo / C8 En ruta | **Fuera** |

---

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Nombre | **Slice 5 — Lado Conductor Mínimo** |
| Viaje “del día” | El próximo viaje del conductor con `estado ∈ {programado, recogida}` y `fecha_salida` en el día local (o el más próximo futuro si no hay “hoy”). Si hay varios hoy → lista corta en home; si uno → hero card directo |
| Empty home | C2: “No hay viajes asignados hoy” (ya existe stub) |
| Lista pasajeros | Solo reservas `confirmada` \| `verificada` \| `abordada` del viaje (no mostrar `pendiente_sena` como abordables). Pill por estado |
| Parada por pasajero | **MVP:** línea secundaria = origen de la ruta (no hay `parada_id` en `reserva`). No inventar paradas por pasajero |
| “Empezar recogida” | Botón en hero: si viaje `programado` → RPC/update a `recogida` y navega a hub del viaje. Si ya `recogida` → CTA “Escanear QR” / “Continuar recogida” |
| Ruta hub viaje | **`/conductor/viajes/[id]`** — lista pasajeros + CTA escanear (fusión práctica de lista C3 + entrada a scan; **sin** timer C5) |
| Ruta escanear | **`/conductor/viajes/[id]/escanear`** — C6 |
| Resultado OK | **`/conductor/viajes/[id]/escaneo/ok?reserva=`** — C9 (solo lectura post-verify) |
| Resultado fail | **`/conductor/viajes/[id]/escaneo/error?code=`** — C10 |
| Payload escaneo | Solo string `qr_token` (igual que genera el pasajero) |
| Validación | **RPC security definer** `verificar_reserva_qr(p_viaje_id, p_qr_token)` |
| Transición éxito | `confirmada → verificada` únicamente |
| Ya verificada / abordada | Error `QR_YA_VERIFICADO` (no re-verifica; C10 o variante copy “Ya verificado”) |
| Token otro viaje / no existe / no confirmada | `QR_INVALIDO` |
| Cámara | `html5-qrcode`; si falla permiso o desktop → campo “Pegar código” + botón Verificar |
| C9 CTA “Confirmar abordado” | En este slice: botón = **“Listo” / “Volver a la lista”** (no registra saldo ni pasa a `abordada`). Hint Pencil “Después registrás el saldo…” se puede mostrar muted como **próximamente**, sin action |
| Viaje estado `en_curso` / `completado` | No en este slice |
| No-show | **Fuera** |
| TabBar conductor | `inicio` → `/conductor`; `viajes` → `/conductor` (mismo hub por ahora) o `/conductor/viajes/[id]` si hay viaje activo; no inventar agenda |
| DNI al conductor | **No mostrar** (AD privacidad) |
| Operador | Puede usar pantallas conductor solo si `requireProfile` lo permite ya (`conductor\|operador`); no UI especial |

### RPC — contrato

```
verificar_reserva_qr(p_viaje_id uuid, p_qr_token text) → jsonb

Guards:
  auth.uid() not null
  rol conductor | operador
  viaje exists
  viaje.conductor_id = auth.uid()  (operador bypass opcional: sí, para demo soporte)
  trim(token) not empty

Lookup:
  reserva by qr_token
  if null → raise QR_INVALIDO
  if reserva.viaje_id <> p_viaje_id → raise QR_INVALIDO
  if reserva.estado in ('verificada','abordada') → raise QR_YA_VERIFICADO
  if reserva.estado <> 'confirmada' → raise QR_INVALIDO
  -- vehículo: reserva.viaje.vehiculo_id must equal viaje.vehiculo_id (same row; integrity)

Success:
  update reserva set estado = 'verificada', updated_at = now()
  return {
    ok: true,
    reserva_id, pasajero_nombre, origen, destino, fecha_salida, estado: 'verificada'
  }
```

### RLS

```
-- SELECT reservas del viaje donde soy conductor
reserva_select_conductor_viaje:
  exists (
    select 1 from viaje v
    where v.id = reserva.viaje_id
      and v.conductor_id = auth.uid()
  )

-- SELECT viajes propios (si no existe ya)
viaje_select_own_conductor: conductor_id = auth.uid() OR is_operador()

-- UPDATE viaje estado solo propio (programado → recogida) vía RPC preferible
iniciar_recogida(p_viaje_id) security definer
```

Preferir **RPC** también para `iniciar_recogida` (misma disciplina que `resolver_sena` / `crear_reserva`).

---

## Alcance

### ✅ Entra

1. Migración `0012_slice5_conductor_verificar_qr.sql`: RLS + `verificar_reserva_qr` + `iniciar_recogida` + grants.
2. Domain: tipos conductor trip/passengers; guards de verify (mensajes de error).
3. Application + adapter: listar viaje(s) del conductor, detalle con pasajeros, actions verify + start pickup.
4. UI:
   - `/conductor` — C3 o C2
   - `/conductor/viajes/[id]` — lista + CTA escanear
   - `/conductor/viajes/[id]/escanear` — C6
   - OK / error — C9 / C10
5. TabBar conductor: hrefs coherentes.
6. Smoke + type-check + build + `docs/13-slice-5-conductor-status.md`.

### ❌ No entra

| Ítem | Cuándo |
|---|---|
| C5 timer 5 min + no-show | post |
| C7 registro de saldo + `abordada` | post |
| C8 en ruta / GPS / offline queue | post |
| Secuencia de paradas tipo Uber / navegación | post |
| Agenda multi-día C4 completa | post (home cubre “hoy”) |
| Crear/editar viajes desde conductor | operador / post |
| Notificaciones push | post |
| Rotar `qr_token` | post |

---

## Pantallas y rutas

| Ruta | Pencil | Comportamiento |
|---|---|---|
| `/conductor` | **C3** / **C2** | Con viaje: greeting + hero (hora, ruta, asientos, vehículo) + “Empezar recogida” o “Continuar” + sección Pasajeros (preview). Sin viaje: empty C2 |
| `/conductor/viajes/[id]` | lista C3 ampliada | Pasajeros del viaje + StatusPill + BtnPrimary “Escanear QR” |
| `/conductor/viajes/[id]/escanear` | **C6** | Banner sage “Listo para escanear” · área cámara dark · viewfinder accent · tip · fallback input |
| `.../escaneo/ok` | **C9** | Check sage · “Reserva válida” · card pasajero · CTA volver (sin saldo) |
| `.../escaneo/error` | **C10** | X danger · “QR inválido” / “Ya verificado” · banner · reintentar + volver |

Previews de referencia:

- `design-artifacts/previews/17-conductor-home.png`
- `design-artifacts/previews/17b-conductor-home-empty.png`
- `design-artifacts/previews/11-conductor-escanear-qr.png`
- `design-artifacts/previews/10-conductor-recogida.png` (solo inspiración; timer fuera)

---

## Fidelidad visual (obligatorio antes de UI)

### C3 Home — hero + pasajeros

| Elemento | Spec (.pen) |
|---|---|
| Greeting | Fraunces 28/600 “Hola, {nombre}” |
| Role | DM 12/500 muted “Conductor” |
| HeroCard | surface, radius 16, shadow `#1C19170F` y4 blur16, p 16, gap 12 |
| TripWhen | DM 14 muted “Hoy · 07:00” |
| Route | Fraunces 22/600 |
| Meta | DM 14 muted “3/4 asientos · AB 123 CD · Gris” |
| CTA | BtnPrimary full “Empezar recogida” |
| Section | Fraunces 18 “Pasajeros” |
| Row | surface radius 12, pad 12/14, icon user 20 muted, nombre DM 15/500, stop DM 13 muted |

### C6 Escanear

| Elemento | Spec |
|---|---|
| Header | AppHeader chip Conductor + back |
| Banner | sage-soft radius 12, pad 10/14, DM 14/600 sage “Listo para escanear” |
| CameraArea | fill `#292524`, radius 16, flex 1 |
| Viewfinder | 220×220, stroke accent 3, radius 16 |
| Tip | DM 14/500 muted center “Apuntá al código del pasajero” |

### C9 OK

| Elemento | Spec |
|---|---|
| Badge | 72 circle sage-soft, check 32 sage |
| Title | Fraunces 28 “Reserva válida” |
| Pill | ok “Verificada” (post-scan; Pencil dice Confirmada → usar **Verificada** coherente con estado real) |
| Card | surface radius 16 border, nombre Fraunces 22, InfoRow parada, meta 13 muted |
| CTA | BtnPrimary “Volver a la lista” |
| Hint | DM 12 muted “El registro de saldo llega en el próximo paso.” |

### C10 Error

| Elemento | Spec |
|---|---|
| Badge | 72 danger-soft, X danger |
| Title | Fraunces 28 “QR inválido” o “Ya verificado” |
| Body | DM 14 muted center (copy Pencil / variante ya usado) |
| Banner | danger-soft radius 12 |
| CTA primary | “Escanear de nuevo” |
| Secondary | “Volver a la lista” |

---

## Capas y archivos

```
supabase/migrations/0012_slice5_conductor_verificar_qr.sql

apps/web/package.json                          # html5-qrcode
apps/web/src/domain/conductor/types.ts
apps/web/src/domain/conductor/ports.ts
apps/web/src/domain/conductor/verify.ts        # map error codes
apps/web/src/domain/conductor/index.ts

apps/web/src/application/conductor/conductor-service.ts
apps/web/src/application/conductor/actions.ts  # verifyQrAction, startPickupAction
apps/web/src/application/conductor/index.ts

apps/web/src/adapters/supabase/conductor-repository.ts

apps/web/src/components/conductor/qr-scanner.tsx      # client camera + manual
apps/web/src/components/conductor/passenger-row.tsx    # optional thin UI
apps/web/src/components/design/tab-bar.tsx             # conductor viajes href

apps/web/src/app/conductor/page.tsx                   # C3/C2
apps/web/src/app/conductor/viajes/[id]/page.tsx
apps/web/src/app/conductor/viajes/[id]/escanear/page.tsx
apps/web/src/app/conductor/viajes/[id]/escaneo/ok/page.tsx
apps/web/src/app/conductor/viajes/[id]/escaneo/error/page.tsx

docs/superpowers/plans/2026-08-22-tubi-slice-5-task0-inventory.md
docs/13-slice-5-conductor-status.md
```

**Types domain (mínimo):**

```ts
type ConductorTripSummary = {
  id: string
  origen: string
  destino: string
  fechaSalida: string
  estado: EstadoViaje
  asientosOcupados: number  // confirmada|verificada|abordada
  capacidad: number
  vehiculoLabel: string     // "PATENTE · Color" o "PATENTE · Marca · Color"
}

type ConductorPassengerRow = {
  reservaId: string
  nombre: string
  estado: EstadoReserva
  paradaLabel: string       // MVP = origen ruta
}

type VerifyQrResult =
  | { ok: true; reservaId: string; pasajeroNombre: string; origen: string; destino: string; fechaSalida: string }
  | { ok: false; code: "QR_INVALIDO" | "QR_YA_VERIFICADO" | "NO_AUTORIZADO" | "NO_ENCONTRADO" }
```

---

## Orden de tareas

### Task 0 — Pencil inventory (sin code de producto)

- [ ] Dump C2, C3, C6, C9, C10 desde `tubi-wireframes.pen` + previews 17 / 17b / 11.
- [ ] Escribir `docs/superpowers/plans/2026-08-22-tubi-slice-5-task0-inventory.md` con checklist visual.
- [ ] Confirmar tokens ya en design system (sage, danger, surface, Fraunces/DM).

### Task 1 — Migración RLS + RPCs

- [ ] Crear `0012_slice5_conductor_verificar_qr.sql`:
  - `reserva_select_conductor_viaje`
  - `viaje_select_conductor` (si falta)
  - `verificar_reserva_qr(p_viaje_id, p_qr_token)`
  - `iniciar_recogida(p_viaje_id)` — solo `programado → recogida`, dueño conductor
- [ ] Local: `supabase db reset` o migration up; smoke SQL con conductor demo + reserva confirmada.
- [ ] Commit sugerido: `feat(db): conductor QR verify RPC and RLS`

### Task 2 — Domain + application + adapter

- [ ] Tipos + `mapVerifyError`.
- [ ] `ConductorRepository`: `listTripsForConductor`, `getTripForConductor`, `listPassengers`, `verifyQr`, `startPickup`.
- [ ] Service + server actions (`"use server"`) con `requireProfile`, `revalidatePath`.
- [ ] `bun run type-check` en `apps/web`.
- [ ] Commit: `feat(web): conductor trip and verify application layer`

### Task 3 — Home conductor C3/C2

- [ ] Reemplazar stub `/conductor` con datos reales.
- [ ] Hero + lista preview + empty.
- [ ] CTA Empezar recogida → action + redirect hub.
- [ ] Commit: `feat(web): conductor home trip of the day`

### Task 4 — Hub viaje + filas pasajero

- [ ] `/conductor/viajes/[id]` con lista completa y pills.
- [ ] CTA Escanear QR.
- [ ] 404 si no es su viaje.
- [ ] Commit: `feat(web): conductor trip passenger list`

### Task 5 — C6 scanner + verify/error

- [ ] `bun add html5-qrcode` en `apps/web`.
- [ ] `QrScanner` client: onSuccess → `verifyQrAction` → redirect ok/error.
- [ ] Fallback input manual.
- [ ] Páginas C9 / C10 fieles al inventory.
- [ ] Commit: `feat(web): conductor QR scan C6 with OK and error feedback`

### Task 6 — TabBar + verificación + status

- [ ] TabBar conductor: inicio `/conductor`; viajes → mismo o hub del viaje activo si se resuelve barato (si no, ambos a `/conductor`).
- [ ] Checklist Done (abajo).
- [ ] `type-check` + `build`.
- [ ] `docs/13-slice-5-conductor-status.md`.
- [ ] Commit: `docs: slice 5 conductor status`

---

## Criterios de Done

| # | Criterio |
|---|---|
| 1 | Conductor con viaje ve home C3 (ruta, hora, asientos, vehículo, pasajeros) |
| 2 | Sin viaje → empty C2 amable |
| 3 | Lista en `/conductor/viajes/[id]` solo de su viaje; ajeno → 404 |
| 4 | Escaneo token válido `confirmada` del viaje → `verificada` + UI C9 |
| 5 | Token de otro viaje / basura → C10 `QR_INVALIDO`, sin mutar |
| 6 | Re-escaneo ya `verificada` → `QR_YA_VERIFICADO`, sin mutar de nuevo |
| 7 | Validación solo server-side (RPC); cliente no “confía” el estado |
| 8 | UI alineada a Pencil (Task 0 checklist) |
| 9 | Sin saldo / GPS / no-show / abordada |
| 10 | `type-check` + `build` OK |

---

## Script de demo (para Ariel)

1. Seed: `conductor.demo@tubi.local` + viaje hoy + pasajero con reserva **confirmada** y QR visible en `/pasajero/pase`.
2. Login conductor → home muestra el viaje.
3. Empezar recogida → lista → Escanear QR.
4. Celular pasajero muestra QR; conductor escanea (o pega `opq_…` en desktop).
5. Pantalla verde “Reserva válida”; lista muestra pill **Verificada**.
6. (Opcional) segundo scan → “Ya verificado”.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Cámara HTTPS / permisos en demo | Fallback pegar token; probar en celular real con `next dev` en LAN o tunnel |
| RLS olvida conductor → lista vacía | Task 1 test SQL explícito |
| Operador bypass confuso | Documentar: operador puede verificar para soporte demo |
| Pencil C9 dice “Confirmada” post-scan | UI muestra **Verificada** (estado real); no mentir al conductor |
| Varios viajes el mismo día | Home lista cards; no auto-pick silencioso si N>1 |

---

## Siguiente slice (no ahora)

- Saldo al subir (C7) + `verificada → abordada`
- No-show + espera (C5)
- Estados viaje `en_curso` / `completado` + GPS
- Agenda C4 rica

---

## Handoff

Plan en:

`docs/superpowers/plans/2026-08-22-tubi-slice-5-conductor-minimo.md`

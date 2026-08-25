# Slice 6 — Pago de saldo al subir + abordaje

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Tras el QR válido (`reserva.verificada`), el conductor **cobra el saldo** (efectivo o transferencia) en pantalla **C7**, registra el pago y marca la reserva **`abordada`** en un solo paso atómico (RN-02). Homes de conductor y pasajero reflejan el nuevo estado.

**Architecture:** Server-first. RPC `registrar_saldo_y_abordar` crea `pago` tipo `saldo` en `confirmado` + transición `verificada → abordada`. Monto = `viaje.precio − reserva.monto_sena` (calculado en server, no editable por UI). UI C7 fiel a Pencil. C9 pasa a CTA “Cobrar saldo”.

**Tech Stack:** Next.js 16 · Supabase RLS/RPC · Ruta de la siesta · `requireProfile(["conductor","operador"])` · componentes existentes (`BtnPrimary`, segmented method).

**Commits:** usuario con `git commit -S`. Paths: `apps/web/src/...`.

**Pencil:** Task 0 con MCP (`C7 · Saldo` `f0305`) + preview `12-conductor-saldo.png`.

---

## Contexto al arrancar

| Pieza | Estado |
|---|---|
| Slice 5: scan → `verificada` + C9 | OK |
| C9 CTA | “Volver a la lista” + hint saldo próximamente → **reemplazar** |
| `pago` tipo `saldo` | Enum existe; solo seña implementada |
| Domain `verificada → abordada` | OK en `states.ts` |
| Pencil **C7 · Saldo** `f0305` | “Cobrar saldo” + monto + Segmented Efectivo/Transferencia + “Confirmar abordado” |
| Preview | `design-artifacts/previews/12-conductor-saldo.png` |
| Viaje `en_curso` (C8) | **Fuera** de este slice (ver decisiones) |

---

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Nombre | **Slice 6 — Pago de saldo al subir** |
| Entrada principal | C9 OK → BtnPrimary **“Cobrar saldo”** → C7 |
| Entrada secundaria | Lista hub: fila `verificada` → link “Cobrar” / navega a C7 |
| Ruta C7 | **`/conductor/viajes/[viajeId]/saldo/[reservaId]`** |
| Monto | **Server-only:** `saldo = viaje.precio − reserva.monto_sena`. UI solo muestra. Si `saldo < 0` → error de datos `SALDO_INVALIDO` (no debería pasar) |
| Métodos | `efectivo` \| `transferencia` (Segmented Pencil `UT2Ac`). **Sin** upload de comprobante de saldo en MVP (el conductor confirma a mano que cobró) |
| Pago creado | `tipo=saldo`, `estado=confirmado`, `metodo=…`, `monto=saldo`, `comprobante=null`, `confirmado_por=auth.uid()` |
| Reserva | Solo si `estado === 'verificada'`: → **`abordada`** |
| Ya abordada / ya tiene saldo confirmado | `YA_ABORDADA` / `SALDO_YA_REGISTRADO` → UI error amable, sin doble pago |
| No verificada | `RESERVA_NO_VERIFICADA` |
| Viaje `en_curso` | **No** auto-transicionar al abordar un pasajero. Queda para slice C8 (guard: todos `abordada`\|`no_show`). Home conductor solo actualiza pills de pasajeros |
| Pasajero home | Si reserva activa `abordada`: pill “Abordaste” / “A bordo” + copy corto (sin mapa). QR deja de ser el CTA principal si está abordada |
| Pase QR `/pasajero/pase` | Solo `confirmada` hoy; **no** mostrar pase si `verificada`/`abordada` (o empty). Opcional soft: si `verificada` aún no abordó, podría verse — **MVP: mantener solo `confirmada`**; abordada no necesita QR |
| Operador | Mismo bypass que Slice 5 en RPC |
| Idempotencia | Un solo `pago` saldo `confirmado` por reserva |

### RPC — contrato

```
registrar_saldo_y_abordar(
  p_reserva_id uuid,
  p_metodo text  -- 'efectivo' | 'transferencia'
) returns jsonb

Guards:
  auth.uid() not null
  rol conductor | operador
  metodo in ('efectivo','transferencia')
  reserva exists for update
  viaje = reserva.viaje_id for update
  conductor: viaje.conductor_id = auth.uid() (operador ok)
  reserva.estado = 'verificada' else:
    if abordada → YA_ABORDADA
    else → RESERVA_NO_VERIFICADA
  no exists pago saldo confirmado for reserva else SALDO_YA_REGISTRADO
  monto = viaje.precio - reserva.monto_sena
  if monto < 0 → SALDO_INVALIDO
  if monto = 0 → still allow (edge: seña = precio); create pago 0 + abordar

Success (atomic):
  insert pago (reserva_id, tipo=saldo, monto, metodo, estado=confirmado, confirmado_por)
  update reserva set estado=abordada, updated_at=now()
  return {
    ok: true,
    reserva_id, viaje_id, monto, metodo, estado: 'abordada',
    pasajero_nombre, origen, destino
  }
```

### RLS

```
-- Conductor del viaje puede insertar pago saldo de reservas de su viaje
pago_insert_saldo_conductor:
  tipo = 'saldo'
  and exists (
    select 1 from reserva r
    join viaje v on v.id = r.viaje_id
    where r.id = pago.reserva_id
      and (v.conductor_id = auth.uid() or is_operador())
  )

-- Preferir RPC security definer (como resolver_sena) y no depender de UPDATE reserva por conductor vía policy ancha.
-- reserva update sigue solo operador + RPC definer.
```

---

## Alcance

### ✅ Entra

1. Migración `0013_slice6_saldo_abordar.sql` (RPC + RLS insert saldo conductor).
2. Domain: `computeSaldo(precio, montoSena)`, error codes.
3. Application/adapter: `getSaldoContext`, `registrarSaldoYAbordar` + server action.
4. UI:
   - C7 `/conductor/viajes/[id]/saldo/[reservaId]`
   - C9 CTA → Cobrar saldo
   - Hub: acción en filas `verificada`
   - Home conductor: pill **Abordada**
   - Home pasajero: estado abordada (sin QR como CTA)
5. Smoke + type-check + build + `docs/14-slice-6-saldo-status.md`.

### ❌ No entra

| Ítem | Cuándo |
|---|---|
| Viaje `recogida → en_curso` / C8 mapa | Slice tracking / en ruta |
| Comprobante foto del saldo transferencia | post (si hace falta auditoría) |
| No-show / timer C5 | post |
| Liquidación comisión al conductor | post |
| Editar monto manualmente | YAGNI |
| Pasarela / Mercado Pago | nunca en MVP |
| Cancelar / devolución | post |

---

## Pantallas y rutas

| Ruta | Pencil | Comportamiento |
|---|---|---|
| `.../escaneo/ok` | C9 touch | CTA **“Cobrar saldo”** → C7 (query `reserva` ya viene) |
| `/conductor/viajes/[id]/saldo/[reservaId]` | **C7** | Título, nombre, monto 40, segmented, Confirmar abordado |
| `/conductor/viajes/[id]` | hub | Filas verificada: chevron/link cobrar; abordada: pill ok |
| `/conductor` | C3 | Pills actualizados |
| `/pasajero` | P7 touch | Si activa `abordada`: pill + “Ya estás a bordo” (sin Ver QR) |

### C7 — checklist visual (Pencil `f0305`)

| Elemento | Spec |
|---|---|
| Header | AppHeader back + chip Conductor |
| Title | Fraunces 28 “Cobrar saldo” |
| Nombre | DM 16/600 |
| Amount | Fraunces **40/600** centrado |
| Caption | DM 13/500 muted “Saldo al subir · viaje − seña” |
| Method | Segmented h44 surface-2 r12: **Efectivo** \| **Transferencia** |
| CTA | BtnPrimary “Confirmar abordado” |
| Sin | campos de monto editables, sin comprobante |

---

## Capas y archivos

```
supabase/migrations/0013_slice6_saldo_abordar.sql

apps/web/src/domain/pagos/saldo.ts              # computeSaldo
apps/web/src/domain/pagos/index.ts
apps/web/src/domain/pagos/ports.ts              # opcional createSaldo si no va solo por conductor repo
apps/web/src/domain/conductor/types.ts          # SaldoContext DTO
apps/web/src/domain/conductor/ports.ts          # getSaldoContext, registerSaldoAndBoard

apps/web/src/application/conductor/conductor-service.ts
apps/web/src/application/conductor/actions.ts   # registerSaldoAction
apps/web/src/adapters/supabase/conductor-repository.ts

apps/web/src/components/conductor/saldo-form.tsx     # client segmented + submit
apps/web/src/components/design/segmented.tsx         # si no existe (Pencil UT2Ac)

apps/web/src/app/conductor/viajes/[id]/saldo/[reservaId]/page.tsx
apps/web/src/app/conductor/viajes/[id]/escaneo/ok/page.tsx   # CTA
apps/web/src/app/conductor/viajes/[id]/page.tsx              # link cobrar
apps/web/src/components/conductor/passenger-row.tsx           # pill abordada + optional href
apps/web/src/app/pasajero/page.tsx                           # touch abordada

apps/web/src/lib/supabase/types.ts             # Function registrar_saldo_y_abordar

docs/superpowers/plans/2026-08-22-tubi-slice-6-task0-inventory.md
docs/14-slice-6-saldo-status.md
```

**DTO mínimo:**

```ts
type SaldoContext = {
  reservaId: string
  viajeId: string
  pasajeroNombre: string
  origen: string
  destino: string
  fechaSalida: string
  precioViaje: number
  montoSena: number
  saldo: number
  estado: 'verificada' // only
}

// domain
function computeSaldo(precioViaje: number, montoSena: number): number {
  return precioViaje - montoSena
}
```

**Action:**

```ts
// registerSaldoAction(viajeId, reservaId, metodo)
// → RPC → revalidate conductor + pasajero paths
// → redirect `/conductor/viajes/${viajeId}?ok=abordada`
```

---

## Orden de tareas

### Task 0 — Pencil C7 inventory

- [ ] MCP dump `f0305` + preview 12.
- [ ] Inventory md + checklist Segmented.
- [ ] No product code.

### Task 1 — Migración RPC + RLS

- [ ] `0013_slice6_saldo_abordar.sql` con contrato arriba.
- [ ] Types TS `Functions.registrar_saldo_y_abordar`.
- [ ] Commit: `feat(db): register saldo and board passenger RPC`

### Task 2 — Domain + adapter + service

- [ ] `computeSaldo` + `getSaldoContext` (join reserva verificada + viaje + pax; ownership conductor).
- [ ] `registerSaldoAndBoard(reservaId, metodo)`.
- [ ] `registerSaldoAction`.
- [ ] `type-check`.
- [ ] Commit: `feat(web): saldo and board application layer`

### Task 3 — UI Segmented + C7 page

- [ ] `Segmented` design component (Efectivo / Transferencia) si no existe.
- [ ] `SaldoForm` client + page server C7.
- [ ] 404 si no dueño / no verificada.
- [ ] Commit: `feat(web): conductor C7 collect balance UI`

### Task 4 — Wire C9 + hub + homes

- [ ] C9: CTA Cobrar saldo → C7 (`reserva` id en path).
- [ ] Hub: link en filas verificada; banner `?ok=abordada`.
- [ ] Passenger-row pill Abordada.
- [ ] Pasajero home: rama `abordada`.
- [ ] Commit: `feat(web): wire saldo entry points and home states`

### Task 5 — Verificación + status

- [ ] Flow: verify QR → cobrar efectivo → `abordada` + pago saldo confirmado.
- [ ] Re-submit → error sin doble pago.
- [ ] Transferencia path igual.
- [ ] `type-check` + `build`.
- [ ] `docs/14-slice-6-saldo-status.md`.

---

## Criterios de Done

| # | Criterio |
|---|---|
| 1 | C7 muestra monto = precio − seña (server) |
| 2 | Confirmar con efectivo o transferencia crea `pago` saldo `confirmado` |
| 3 | Reserva pasa `verificada → abordada` atómico con el pago |
| 4 | No se puede cobrar dos veces / no abordada sin verificar |
| 5 | C9 y hub llevan a C7 |
| 6 | Home conductor muestra pill Abordada |
| 7 | Home pasajero refleja abordada (sin CTA QR) |
| 8 | UI alineada a Pencil C7 |
| 9 | Sin `en_curso` automático, sin GPS, sin no-show |
| 10 | Build OK |

---

## Script demo (Ariel)

1. Pasajero con QR confirmada → conductor escanea → C9.
2. Cobrar saldo → elige Efectivo → Confirmar abordado.
3. Lista muestra **Abordada**; pasajero home “a bordo”.
4. (Opcional) segundo intento → error amable.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Precio/seña desfasados | Monto solo en RPC; UI solo display |
| Doble tap Confirmar | RPC idempotente + disable button pending |
| Confundir `en_curso` con abordada | Copy y pills claros; no mutar viaje |
| Operador demo en viaje ajeno | Mismo bypass que Slice 5 |

---

## Siguiente slice

- C8 / `en_curso` + GPS (cuando todas las reservas del viaje están resueltas).
- C5 no-show.
- Comprobante opcional de transferencia de saldo.

---

## Handoff

Plan en:

`docs/superpowers/plans/2026-08-22-tubi-slice-6-saldo-abordaje.md`

# Slice 3 — Confirmación de Seña por Operador

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** El operador ve las señas con comprobante pendiente, revisa el comprobante y **confirma** o **rechaza la seña**. Al confirmar: `pago → confirmado` y `reserva → confirmada` (RN-CONFIRMACION). Al rechazar seña: `pago → rechazado`; la **reserva no se cancela** (sigue `pendiente_sena` para reenviar comprobante).

**Architecture:** Server-first, capas `domain → application → adapters`. Mutación atómica vía RPC `resolver_sena` (`confirmar` \| `rechazar`). Lista y detalle con join pago + reserva + viaje + pasajero. Preview de comprobante con **signed URL** (bucket privado). UI 100% Ruta de la siesta: validar cada pantalla contra Pencil (MCP o `.pen` + previews) antes de codear UI.

**Tech Stack:** Next.js 16 App Router · Supabase RLS/RPC/Storage · Zod · design tokens existentes · `requireProfile(["operador"])` + `SessionProvider` en layout operador.

**Commits:** el agente no firma GPG; dejar `git commit -S` para el usuario.

**Numeración:** este es el **Slice 3** del producto (después de 2A catálogo + 2B crear reserva + checkout seña P6). No confundir con la numeración vieja del `PROMPT-IMPLEMENTACION`.

---

## Contexto al arrancar

| Pieza | Estado |
|---|---|
| 2A catálogo + 2B reserva | OK |
| P6 checkout seña + P11 en revisión | OK |
| `pago` seña `pendiente` + Storage `comprobantes` | OK (`0010`) |
| `/operador` | Stub genérico → **se convierte en la lista** |
| Pencil **O1 · Confirmar seña** `f0351` | Detalle + Rechazar / Confirmar |
| Pencil O2 Settings | **Fuera de este slice** |
| RLS | Falta UPDATE operador en `pago`/`reserva` + RPC |
| Migración nueva | **`0011_slice3_resolver_sena.sql`** |

---

## Decisiones cerradas (ajustes de este plan)

| Tema | Decisión |
|---|---|
| Nombre | **Slice 3 — Confirmación de Seña por Operador** |
| Ruta lista | **`/operador`** = cola de señas pendientes (home operador) |
| Ruta detalle | **`/operador/confirmar/[id]`** donde `id` = `pago.id` |
| Confirmar | Atómico: pago `confirmado` + reserva `confirmada` + `confirmado_por` |
| **Rechazar** | **“Rechazar seña”**, no “Cancelar reserva”. Solo marca el **pago** como `rechazado`. La reserva **permanece `pendiente_sena`**. No aplica política de devolución (la seña nunca se confirmó / el dinero no se “devuelve” por plataforma: es rechazo de comprobante). El pasajero puede **reenviar** otro comprobante. |
| Cancelar reserva | **Fuera de scope** (flujo aparte del pasajero/operador) |
| UI Pencil | Obligatorio: O1 frame a frame; lista en `/operador` usa la misma piel (cards como ReservationCard de O1) aunque no haya frame “O0” |
| QR pasajero | No en este slice |
| Seed operador | `operador.demo@tubi.local` / `demo-demo-1` local |

### Rechazar seña — semántica explícita

```
NO es: cancelar reserva, liberar asiento, aplicar RN-03 devolución.
SÍ es: el comprobante no es válido / no se acredita.

pago.estado:   pendiente → rechazado
reserva.estado: pendiente_sena (sin cambio)
pasajero: puede volver a P6 y subir otro comprobante
```

---

## Alcance

### ✅ Entra

1. Migración RLS UPDATE + RPC `resolver_sena` + seed operador + reenvío seña si solo hay pagos `rechazado`.
2. Domain: reglas de transición pago/reserva (confirmar / rechazar seña).
3. Application + adapter: listar pendientes, detalle + signed URL, actions.
4. UI:
   - `/operador` — lista señas pendientes (piel Pencil).
   - `/operador/confirmar/[id]` — **O1** fiel al Pencil.
5. Touch pasajero: pill confirmada; si seña rechazada → CTA reenviar.
6. Smoke + build + status doc.

### ❌ No entra

| Ítem | Cuándo |
|---|---|
| Cancelar reserva (pasajero u operador) | post |
| O2 Settings | slice settings |
| P8 QR boarding | slice siguiente |
| Devolución de dinero / liquidación | post (no hay pasarela) |
| Notificaciones push/email | post |

---

## Pantallas y rutas

| Ruta | Pencil | Rol |
|---|---|---|
| `/operador` | Lista (derivada de O1 cards) | Cola: nombre, viaje, hora, monto, pill Pendiente · empty |
| `/operador/confirmar/[id]` | **O1 · Confirmar seña** | Detalle + preview + Rechazar seña + Confirmar |
| `/pasajero` | P7 touch | Pill Confirmada / Rechazada + reenviar |
| `/pasajero/reservas/[id]/en-revision` | P11 touch | Branch si pago ya resuelto |
| `/pasajero/reservas/[id]/sena` | P6 | Permitir upload si último pago fue `rechazado` |

### O1 — checklist visual (Pencil `f0351`)

Antes de implementar UI, validar en `.pen` / MCP:

- [ ] AppHeader + chip rol Operador
- [ ] Título Fraunces 28: “Confirmar seña”
- [ ] Card surface radius 16: nombre pasajero 17/600 · meta viaje 14 muted · StatusPill accent-soft
- [ ] InfoRow / monto seña
- [ ] Preview comprobante h ~160, surface-2, radius 16 (imagen real o placeholder)
- [ ] Actions gap 12: **Rechazar** (BtnDanger full) · **Confirmar** (BtnPrimary full)
- [ ] Tokens Ruta de la siesta; un primary por acción de commit; h CTA 52

### Lista `/operador`

- Título Fraunces “Señas pendientes”
- Cards clickeables → `/operador/confirmar/{pagoId}`
- Misma card hierarchy que O1 CardTop (sin preview)
- EmptyHint si no hay pendientes
- Link cuenta; sin TabBar conductor/pasajero (operador mobile simple)

---

## Cambio de estados

### Confirmar seña

```
pre:  is_operador() · pago.tipo=sena · pago.estado=pendiente · reserva.estado=pendiente_sena
post: pago.confirmado + confirmado_por · reserva.confirmada
```

### Rechazar seña

```
pre:  igual
post: pago.rechazado + confirmado_por (quién resolvió) · reserva SIN cambio (pendiente_sena)
```

Errores: `NO_AUTORIZADO` · `NO_ENCONTRADO` · `PAGO_NO_PENDIENTE` · `TRANSICION_INVALIDA`.

---

## Backend por capas

### Domain

```
domain/pagos/states.ts     # assertCanConfirmSena / assertCanRejectSena
domain/reservas/states.ts  # assertTransition pendiente_sena → confirmada (si no existe)
```

### Application

```
application/operador/
  senas-service.ts
  actions.ts               # confirmSenaAction, rejectSenaAction
  index.ts
```

- `requireProfile(["operador"])` en actions y pages.
- Tras éxito: `revalidatePath("/operador")` + redirect `/operador?ok=confirmada|rechazada`.

### Adapters

```
adapters/supabase/operador-senas-repository.ts
  listPendingSenas()
  findForReview(pagoId)
  resolverViaRpc(pagoId, 'confirmar' | 'rechazar')
  createSignedComprobanteUrl(path)
```

### Migración `0011_slice3_resolver_sena.sql`

1. Policies UPDATE `pago` / `reserva` solo `is_operador()`.
2. RPC `resolver_sena(p_pago_id uuid, p_accion text)` — `FOR UPDATE`, atómico.
3. Seed operador demo.
4. Ajuste insert seña pasajero: permitir nuevo pago seña si no existe `pendiente` ni `confirmado` (sí si solo hay `rechazado`).

---

## Archivos

```
supabase/migrations/0011_slice3_resolver_sena.sql

apps/web/src/
  domain/pagos/states.ts
  domain/reservas/states.ts
  application/operador/{senas-service,actions,index}.ts
  adapters/supabase/operador-senas-repository.ts
  components/design/btn-danger.tsx
  components/operador/sena-resolve-actions.tsx
  app/operador/page.tsx                    # LISTA (reemplaza stub)
  app/operador/confirmar/[id]/page.tsx    # O1
  app/pasajero/page.tsx                    # touch estados
  app/pasajero/reservas/[id]/en-revision/page.tsx
  app/pasajero/reservas/[id]/sena/page.tsx
  lib/supabase/types.ts
  application/pagos/*                      # reenvío si hace falta
docs/11-slice-3-confirmar-sena-status.md
```

**Borrar / no crear:** `/operador/senas` ni `/operador/senas/[pagoId]` del borrador anterior.

---

## Orden de tareas

### Task 0 — Pencil O1 obligatorio

- [ ] Leer O1 (`f0351`) con MCP Pencil o dump `.pen`.
- [ ] Anotar copy exacto de botones (¿“Rechazar” / “Confirmar seña”?).
- [ ] No code.

### Task 1 — Migración RPC + RLS + seed operador

- [ ] `0011_slice3_resolver_sena.sql`
- [ ] `db reset` + smoke RPC operador vs pasajero
- [ ] Commit: `feat(supabase): resolver_sena RPC for operator confirmation`

### Task 2 — Domain states

- [ ] Transiciones puras + tests mentales / typecheck
- [ ] Commit: `feat(domain): sena confirm and reject rules`

### Task 3 — Adapter + service + actions

- [ ] Lista, detalle, signed URL, RPC
- [ ] Actions con redirect a `/operador`
- [ ] Commit: `feat(web): operator sena application layer`

### Task 4 — UI `/operador` lista + `/operador/confirmar/[id]` O1

- [ ] **Pencil first** en cada archivo
- [ ] BtnDanger + dual CTA
- [ ] Preview imagen; PDF → abrir en nueva pestaña
- [ ] Commit: `feat(web): operator sena queue and O1 confirm screen`

### Task 5 — Pasajero post-resolución

- [ ] Confirmada → pill sage
- [ ] Seña rechazada → copy claro + “Reenviar comprobante”
- [ ] Checkout acepta reenvío tras rechazo
- [ ] Commit: `feat(web): passenger status after sena resolution`

### Task 6 — Verificación + status

- [ ] Flujo feliz confirmar
- [ ] Flujo rechazar seña + reenvío
- [ ] AuthZ
- [ ] `type-check` + `build`
- [ ] `docs/11-slice-3-confirmar-sena-status.md`

---

## Criterios de Done

| # | Criterio |
|---|---|
| 1 | `/operador` lista solo señas con pago `pendiente` + comprobante |
| 2 | `/operador/confirmar/[id]` muestra pasajero, viaje, monto, preview |
| 3 | Confirmar → pago `confirmado` + reserva `confirmada` |
| 4 | Rechazar seña → pago `rechazado`, reserva **sigue** `pendiente_sena` |
| 5 | No es “cancelar reserva”: no cambia reserva a `cancelada` |
| 6 | Pasajero puede reenviar comprobante tras rechazo |
| 7 | Solo rol operador accede UI y RPC |
| 8 | O1 fiel a Pencil Ruta de la siesta |
| 9 | Capas limpias; montos desde snapshot/DB |
| 10 | Build OK |

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Doble click confirmar | RPC `FOR UPDATE` + UI disabled en pending |
| Confundir rechazo con cancelación | Copy UI: “Rechazar seña” / “Comprobante inválido” |
| Signed URL | TTL 1h al cargar detalle |
| Lista sin frame Pencil | Cards = extracción de O1 CardTop |

---

## Siguiente slice (después de este)

- P8 QR pasajero (solo reserva `confirmada`)
- (Opcional) cancelación de reserva con RN-03
- O2 Settings

---

## Handoff

Plan reescrito en:

`docs/superpowers/plans/2026-08-22-tubi-slice-3-confirmar-sena-operador.md`

(El borrador con nombre “Slice 4” y rutas `/operador/senas` queda **reemplazado** por este.)

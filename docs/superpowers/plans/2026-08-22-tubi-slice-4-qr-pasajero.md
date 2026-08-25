# Slice 4 — Visualización del QR del Pasajero

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Con reserva **`confirmada`**, el pasajero ve su **pase de abordaje (P8)** con QR grande del `qr_token` opaco, estilo **QRPass** de Pencil (boarding pass). Sin escaneo conductor. Cancelación: no disponible en este slice si la reserva ya está confirmada (oculto o disabled según settings de política).

**Architecture:** Token ya generado en `crear_reserva` (`opq_…`). Slice de **lectura + render**. Domain: quién puede ver el pase. Application: `getBoardingPass` / listar pases activos. Adapter: repos reserva+viaje. UI: componente `QRPass` **pixel-fiel** a Pencil `itlkI` + página P8. Payload QR = solo `qr_token`.

**Tech Stack:** Next.js 16 · `qrcode.react` · Ruta de la siesta · `requireProfile` pasajero.

**Commits:** usuario con `git commit -S`.

---

## Contexto al arrancar

| Pieza | Estado |
|---|---|
| `reserva.qr_token` | OK (`opq_` en 2B) |
| `confirmada` vía operador | OK (Slice 3) |
| UI QR | No existe |
| TabBar QR | Stub → `/pasajero` |
| Pencil P8 `f0175` | “Tu pase” + QRPass + cancel + TabBar |
| Pencil QRPass `itlkI` | Boarding pass reutilizable |
| Preview | `06-pasajero-qr.png` |
| AD-11 | Token opaco; verify al escanear = **fuera** |

---

## Decisiones cerradas (ajustes)

| Tema | Decisión |
|---|---|
| Ruta pase específico | **`/pasajero/pase/[id]`** (`id` = `reserva.id`) |
| Ruta índice / activo | **`/pasajero/pase`** — si hay **una** confirmada → redirect a `/pasajero/pase/{id}`; si hay **varias** → lista simple de pases; si **cero** → empty state |
| Home “Ver mi QR” | **Solo** si existe ≥1 reserva `confirmada` del usuario |
| TabBar QR | `href="/pasajero/pase"` siempre; la página decide empty vs redirect vs lista. El ítem no se oculta (navegación estable), pero empty es amable |
| Payload QR | Solo `qr_token` string (sin PII) |
| Visibilidad por estado | Solo `confirmada` (MVP). Otros estados → no pase / redirect |
| Generación token | **No** regenerar |
| **Cancelar reserva** | En P8: si reserva `confirmada`, el link **no se muestra** *o* se muestra **disabled** según settings de política de cancelación. **MVP default: no mostrar** el link de cancelar cuando está confirmada (evita confusión). Leer settings `reserva.devolucion_*` solo para **hint futuro**; **no** implementar cancel action. Si más adelante hay ventana de cancelación post-seña, se habilita con policy; en este slice **nunca** hay action de cancelar. |
| Offline | Render client del token ya cargado; sin cola especial |
| Escaneo conductor | Fuera |

### Cancelar — regla explícita

```
P8 Pencil muestra "Cancelar reserva" + hint devolución.
Este slice:
  - NO implementa POST cancelar ni RN-03.
  - Si estado === confirmada: OMITIR el link de cancelar
    (preferido) O mostrarlo disabled con title "Próximamente".
  - Decisión de implementación: OMITIR (más limpio).
  - El hint de devolución del Pencil tampoco se muestra si no hay cancel.
```

---

## Alcance

### ✅ Entra

1. Domain `assertCanViewBoardingPass` + DTO `BoardingPass`.
2. Application: get by id; list confirmed for passenger; resolve “activo”.
3. `qrcode.react` + componente **`QRPass`** fiel a Pencil.
4. Páginas:
   - `/pasajero/pase` — índice (0 / 1 / N confirmadas)
   - `/pasajero/pase/[id]` — P8 detalle
5. Home: CTA “Ver mi QR” **condicional** (≥1 confirmada).
6. TabBar QR → `/pasajero/pase`.
7. Smoke + build + status doc.

### ❌ No entra

| Ítem | Cuándo |
|---|---|
| Escaneo / `verificar` conductor | Slice conductor |
| Cancelar reserva + devolución real | post |
| Rotar `qr_token` | post |
| JWT / expiry en el QR | YAGNI |

---

## Pantallas y rutas

| Ruta | Comportamiento | Pencil |
|---|---|---|
| `/pasajero/pase` | 0 confirmadas → EmptyHint + link buscar; 1 → `redirect(/pasajero/pase/{id})`; N → lista cards (ruta, hora, chevron) → detalle | — |
| `/pasajero/pase/[id]` | Pase boarding si dueño + `confirmada`; else notFound/redirect | **P8** + **QRPass** |
| `/pasajero` | Si ≥1 confirmada → BtnPrimary “Ver mi QR” → `/pasajero/pase` | P7 touch |
| TabBar QR | Siempre `/pasajero/pase` | alqrj |

**No usar:** `/pasajero/reservas/[id]/pase` (descartada por rutas limpias).

---

## Fidelidad visual — QRPass (obligatorio)

Antes de codear UI: Task 0 con Pencil MCP o dump `.pen` de `itlkI` + preview `06-pasajero-qr.png`.

### Estructura Pencil `QRPass` (`itlkI`)

| Elemento | Spec |
|---|---|
| Contenedor | width ~335, surface `#FFFCF7`, radius 16, padding 20, gap 16, align center |
| Pill | sage-soft / sage, “Confirmada”, 12/600 |
| Ruta | Fraunces 22/600, ink |
| Meta | DM Sans 14/500 muted: `{fecha/hora} · {nombre pasajero}` |
| QR hero | box **200×200**, surface-2, radius 12, QR real centrado (~180–200 px, alto contraste) |
| Tip | DM 12/500 muted, center, width ~280: **“Mostralo al conductor. No compartas esta pantalla.”** |

### Página P8

| Elemento | Spec |
|---|---|
| Header compacto | Back + título Fraunces 20 “Tu pase” (no AppHeader full wordmark si Pencil usa CompactHeader; se puede AppHeader back + título en content) |
| Contenido | QRPass centrado, gap 20 |
| Cancel | **Omitido** en confirmada (ver decisión) |
| TabBar | QR activo |

### Extra producto (pedido + legibilidad)

Debajo del tip o entre meta y QR (sin romper boarding pass):

- Conductor (nombre)
- Vehículo (patente · marca modelo · color)

Usar tipografía muted 13–14, no competir con Fraunces de ruta. Si el layout se satura, una sola línea meta extendida.

---

## Lógica

### Payload

```
QR value = reserva.qr_token  // "opq_…" only
```

### Guard

```
assertCanViewBoardingPass(reserva, userId):
  reserva.pasajero_id === userId
  reserva.estado === 'confirmada'
```

### Índice `/pasajero/pase`

```
list = confirmed reservas del user order by fecha_salida asc
if length == 0 → empty
if length == 1 → redirect /pasajero/pase/{id}
if length > 1 → lista
```

### Home CTA

```
showVerMiQr = count(confirmadas) >= 1
```

No mostrar CTA “Ver mi QR” en `pendiente_sena` / en revisión / rechazada.

---

## Capas y archivos

```
apps/web/package.json                    # qrcode.react
src/domain/reservas/boarding.ts
src/domain/reservas/types.ts             # + BoardingPass
src/domain/reservas/ports.ts             # listConfirmed / findBoarding
src/domain/reservas/index.ts
src/application/reservas/boarding-service.ts  # o métodos en reservas-service
src/adapters/supabase/reservas-repository.ts
src/components/design/qr-pass.tsx        # Pencil-exact
src/components/design/index.ts
src/components/design/tab-bar.tsx        # QR → /pasajero/pase
src/app/pasajero/pase/page.tsx           # índice
src/app/pasajero/pase/[id]/page.tsx     # P8
src/app/pasajero/page.tsx                # CTA condicional
docs/12-slice-4-qr-pasajero-status.md
docs/superpowers/plans/…-task0-inventory.md
```

**Migraciones:** ninguna.

---

## Orden de tareas

### Task 0 — Pencil P8 + QRPass

- [ ] Extraer `itlkI` + `f0175` + preview 06.
- [ ] Checklist visual en inventory md.
- [ ] No code.

### Task 1 — Dep + domain

- [ ] `npm i qrcode.react -w web`
- [ ] `assertCanViewBoardingPass`, tipos.
- [ ] Commit: `feat(domain): boarding pass visibility for confirmed reservas`

### Task 2 — Adapter + application

- [ ] `findBoardingPass(id, pasajeroId)`
- [ ] `listConfirmedBoardingSummaries(pasajeroId)`
- [ ] Typecheck.
- [ ] Commit: `feat(web): boarding pass repository and service`

### Task 3 — Componente `QRPass` (fidelidad Pencil)

- [ ] Layout exacto itlkI + `QRCodeSVG` value=token.
- [ ] Props: route, metaLine, passengerName, qrToken, conductor?, vehicle?
- [ ] Commit: `feat(web): QRPass boarding component from Pencil`

### Task 4 — Rutas `/pasajero/pase` + `/pasajero/pase/[id]`

- [ ] Índice 0/1/N.
- [ ] Detalle P8 + header “Tu pase”.
- [ ] Sin link cancelar (confirmada).
- [ ] Commit: `feat(web): passenger pase routes P8`

### Task 5 — Home CTA + TabBar

- [ ] “Ver mi QR” solo si ≥1 confirmada.
- [ ] TabBar QR → `/pasajero/pase`.
- [ ] Commit: `feat(web): wire QR entry points on home and tab bar`

### Task 6 — Verificación + status

- [ ] Confirmada → QR con token; tokens distintos por reserva.
- [ ] Sin confirmada → empty en `/pase`; home sin CTA Ver QR.
- [ ] Otra reserva / no dueño → no acceso.
- [ ] `type-check` + `build`.
- [ ] `docs/12-slice-4-qr-pasajero-status.md`.

---

## Criterios de Done

| # | Criterio |
|---|---|
| 1 | Rutas `/pasajero/pase` y `/pasajero/pase/[id]` funcionan como se definió |
| 2 | QR solo si dueño + `confirmada`; contenido = `qr_token` opaco |
| 3 | `QRPass` fiel a Pencil (pill, ruta 22, meta, hero 200, tip) |
| 4 | Info viaje: ruta, hora, nombre; conductor y vehículo visibles |
| 5 | Home “Ver mi QR” **solo** con ≥1 confirmada |
| 6 | TabBar QR lleva a `/pasajero/pase` |
| 7 | Sin cancelar reserva en pase confirmado |
| 8 | Build OK; sin migración nueva |

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Desvío visual del QRPass | Task 0 + comparar preview lado a lado |
| QR chico para cámara | Caja 200 + quiet zone de la lib |
| Varias confirmadas | Lista en índice, no forzar una sola |
| Token en HTML del dueño | Esperado; RLS protege de terceros |

---

## Siguiente slice

- Conductor: escanear QR + verificación server-side (viaje/conductor/vehículo).
- Cancelación reserva + RN-03 (cuando exista, reevaluar link en P8 según settings).

---

## Handoff

Plan actualizado en:

`docs/superpowers/plans/2026-08-22-tubi-slice-4-qr-pasajero.md`

# P1 — Task 1.0 Inventario Pencil (Mis Reservas / Home pasajero)

**Fecha:** 2026-08-25  
**Prioridad:** Mis Reservas polish (no rehacer lista; pulir CTAs y descubribilidad)  
**Fuentes:**  
- Spec: `docs/superpowers/specs/2026-08-19-tubi-homes-design.md`  
- Previews: `design-artifacts/previews/16-pasajero-home.png`, `16b-pasajero-home-empty.png`  
- Código: `apps/web/src/app/pasajero/page.tsx`, `apps/web/src/app/pasajero/reservas/page.tsx`  
- DS: `apps/web/src/components/design/{btn-primary,status-pill,empty-hint,tab-bar}.tsx`  
- Plan: `docs/superpowers/plans/2026-08-25-tubi-mvp-cuatro-prioridades.md` § Ola A P1  

**Nota MCP:** Pencil MCP no disponible en esta pasada; inventario por previews PNG + spec homes + código.

---

## 1. Frames de referencia (Pencil / preview)

| Frame | Archivo | Contenido |
|---|---|---|
| `16 · Pasajero · Home` | `16-pasajero-home.png` | StatusBar · saludo “Hola, Ana” + “Tu próximo viaje” · hero card con StatusPill “Confirmada”, ruta Fraunces “Tandil → Bs.As.”, meta fecha/hora · CTA BtnPrimary “Ver mi QR” · link “Buscar otro viaje” · TabBar Inicio activo |
| `16b · Pasajero · Home empty` | `16b-pasajero-home-empty.png` | Mismo shell · EmptyHint “Todavía no tenés un viaje” en card · BtnPrimary “Buscar viaje” · TabBar Inicio activo |

**No hay frame Pencil dedicado a “Mis reservas” lista.** La lista reutiliza el estilo de card del hero Home (P7 / frame 16) y el empty de 16b. Ruta de producto: `/pasajero/reservas`.

---

## 2. Tokens y componentes esperados

| Token | Valor esperado | Implementación DS / código |
|---|---|---|
| Viewport shell | `max-w-[375px]`, `min-h-dvh`, `bg-background` | Ambas páginas |
| Card | `rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]` | Home hero + lista reservas + empty wrapper |
| StatusPill | variantes `ok` / `pending` / `danger` (+ `neutral` en DS) | `status-pill.tsx`: ok `#E4EDE5/#5F7A61`, pending `#F3E0D4/#C45C26`, danger `#FCEBEA/#B42318` · DM Sans 12/600 · `rounded-full px-3 py-1` |
| Ruta título | Fraunces ~22/600, `origen → destino` | `font-heading text-[22px] font-semibold` |
| Meta | DM Sans 14 muted · fecha/hora AR | `formatFechaHoraAr` + `text-sm text-muted-foreground` |
| CTA primaria | `BtnPrimary` default **h-13**, full width, `rounded-[14px]`, texto 17/600 | `btn-primary.tsx` |
| Empty | `EmptyHint` + CTA “Buscar viaje” → `/pasajero/buscar` | `empty-hint.tsx` (icon CalendarX + message) |
| Acceso Home → lista | link “Ver todas mis reservas” → `/pasajero/reservas` | Existe en Home (`page.tsx` L176–181) |
| TabBar | variante `pasajero`, 4 tabs (Inicio / Buscar / QR / Cuenta) | Home: `active="inicio"` · Lista: hoy también `active="inicio"` (sin tab dedicado) |
| Tipografía piel | Fraunces títulos · DM Sans cuerpo · crema/terracota | Ruta de la siesta |

### StatusPill — mapping de estados (lista + home)

| Estado reserva | Label | Variant |
|---|---|---|
| `confirmada` | Confirmada | `ok` |
| `verificada` | Verificada | `ok` |
| `abordada` | A bordo | `ok` |
| `pendiente_sena` | Pendiente de seña | `pending` |
| (home extra) seña en revisión | Seña en revisión | `pending` |
| (home extra) seña rechazada | Seña rechazada | `danger` |
| `cancelada` | Cancelada | `danger` |
| `no_show` | No show | `danger` |

### CTA primaria por estado (producto cerrado en plan P1)

| Estado | Label CTA | Destino |
|---|---|---|
| `confirmada` | Ver QR (lista) / Ver mi QR (home) | `/pasajero/pase/{id}` o `/pasajero/pase` |
| `pendiente_sena` (sin seña en revisión) | Completar seña | `/pasajero/reservas/{id}/sena` |
| `pendiente_sena` + seña pendiente | Ver estado de seña (home) | `/pasajero/reservas/{id}/en-revision` |
| seña rechazada | Reenviar comprobante (home) | `/pasajero/reservas/{id}/sena` |
| `verificada` / `abordada` / `cancelada` / `no_show` | Sin CTA primaria | Solo pill + meta (+ copy opcional) |

Una sola primary visible por card/hero; el estado determina label y destino.

---

## 3. Código actual vs diseño

### 3.1 Home pasajero — `apps/web/src/app/pasajero/page.tsx`

| Elemento Pencil | Código hoy | Match |
|---|---|---|
| Saludo “Hola, {nombre}” + “Tu próximo viaje” | Sí | OK |
| Hero card tokens | `rounded-2xl border … p-4 shadow…` | OK |
| StatusPill por estado (incl. seña revisión/rechazo) | Sí | OK (más rico que frame 16 estático) |
| Ruta + fecha | Sí | OK |
| Bloque seña monto (pendiente) | Sí, accent-soft | OK (extra útil) |
| CTA “Ver mi QR” si pase confirmado | `BtnPrimary` → `/pasajero/pase` | OK |
| CTA “Completar seña” / reenviar / en revisión | `BtnPrimary` condicional | OK |
| EmptyHint “Todavía no tenés un viaje” + “Buscar viaje” | Sí | OK vs 16b |
| Link “Ver todas mis reservas” | Underline `text-sm text-primary` | Existe; **jerarquía baja** (gap polish) |
| “Buscar otro viaje” (con reserva) | Link underline | OK vs atajo secundario spec |
| TabBar `active="inicio"` | Sí | OK |

### 3.2 Mis reservas — `apps/web/src/app/pasajero/reservas/page.tsx`

| Elemento | Código hoy | Match / gap |
|---|---|---|
| Header back → `/pasajero` + título “Mis reservas” | Sí | OK |
| Card misma piel que hero | Sí (`rounded-2xl border bg-card p-4 shadow…`) | OK |
| StatusPill ok/pending/danger | `statusForEstado` | OK |
| Ruta Fraunces + meta + monto seña/viaje | Sí | OK |
| Acción por card | Card entera clickeable + **ChevronRight** si `confirmada` o `pendiente_sena` | **Gap:** no hay `BtnPrimary` “Ver QR” / “Completar seña”; chevron poco visible |
| `hrefForItem` | solo `confirmada` → pase; `pendiente_sena` → seña; resto `null` | Alineado a destinos; falta CTA explícita |
| Cancel | `CancelReservaButton` debajo si `canCancelReserva` | OK |
| Empty | EmptyHint “Todavía no tenés reservas” + BtnPrimary “Buscar viaje” | Estructura OK; **copy distinta** a Home (“viaje” vs “reservas”) |
| TabBar | `active="inicio"` | Sin tab Mis reservas (decisión: no agregar tab). OK documentado |
| Toast cancel | `?ok=cancelada` | OK |

### 3.3 Cuenta — `apps/web/src/app/cuenta/page.tsx`

| Elemento | Código hoy |
|---|---|
| Link “Mis reservas” → `/pasajero/reservas` | **Ausente** (solo avatar, datos, logout, TabBar) |

---

## 4. Gaps para polish Task 1.1

Ordenados por impacto de descubribilidad / claridad de acción.

### 4.1 CTA Ver QR / Completar seña en cards de lista

- **Hoy:** la card es un `<Link>` full-body con chevron; no hay label de acción.
- **Esperado (plan):** debajo del body (o dentro de la card), `BtnPrimary` (o `h-11 text-base` si se compacta en lista) con:
  - `confirmada` → “Ver QR” → `/pasajero/pase/{reservaId}`
  - `pendiente_sena` → “Completar seña” → `/pasajero/reservas/{id}/sena`
- Resto de estados: sin CTA primaria; copy opcional:
  - `verificada` → “El conductor ya escaneó tu QR.”
  - `abordada` → “Viajaste. Gracias.”
  - `no_show` → “No te presentaste en la parada.”
- Mantener `CancelReservaButton` debajo cuando aplique.
- Preferir card no-link + botones explícitos (o link solo en CTA) para no competir con cancel.

### 4.2 Home — discovery de Mis reservas

- **Hoy:** link underline “Ver todas mis reservas” al mismo nivel tipográfico que “Buscar otro viaje”.
- **Esperado:** un CTA claro de superficie, p.ej. secondary full-width:

```tsx
<Link
  href="/pasajero/reservas"
  className="inline-flex h-11 w-full items-center justify-center rounded-[14px] border border-border bg-card text-sm font-semibold text-foreground"
>
  Mis reservas
</Link>
```

- Preferir **un** control “Mis reservas”; no dejar dos links redundantes underline + botón.

### 4.3 Empty copy alignment

| Superficie | Copy actual | Dirección polish |
|---|---|---|
| Home empty | “Todavía no tenés un viaje” | Mantener (fiel a 16b) |
| Lista empty | “Todavía no tenés reservas” | Alinear / enriquecer, p.ej. “Todavía no tenés reservas. Buscá un viaje Tandil ↔ Buenos Aires.” |
| CTA empty ambas | “Buscar viaje” → `/pasajero/buscar` | OK, no cambiar |

### 4.4 Link desde Cuenta

- Si rol `pasajero` (u operador actuando como pasajero en flujos demo), agregar fila o link “Mis reservas” → `/pasajero/reservas` en `cuenta/page.tsx`.
- No aplica a conductor puro.

### 4.5 TabBar active en lista

- Hoy `active="inicio"` en `/pasajero/reservas`.
- **Decisión:** no agregar tab “Reservas” (rompe TabBar Track A). Dejar `inicio` o sin resaltar mal; documentado como OK.
- No tocar labels/iconos del TabBar en esta tarea.

### 4.6 Fuera de alcance P1 polish

- Frame Pencil nuevo para lista Mis reservas.
- Historial paginado, filtros, ratings.
- Deep link push.
- Cambiar destinos de pase/seña ya cableados.

---

## 5. Checklist de aceptación (post Task 1.1)

- [ ] Cards lista: misma piel card que Home (`rounded-2xl border bg-card p-4 shadow…`)
- [ ] StatusPill ok / pending / danger según tabla §2
- [ ] `confirmada` muestra CTA primaria clara “Ver QR”
- [ ] `pendiente_sena` muestra CTA primaria clara “Completar seña”
- [ ] Empty lista: EmptyHint + BtnPrimary “Buscar viaje”; copy alineada
- [ ] Home: acceso “Mis reservas” con jerarquía de botón de superficie (no solo underline)
- [ ] Cuenta pasajero: link a `/pasajero/reservas`
- [ ] Sin tab nuevo en TabBar
- [ ] Sin hardcode de montos de seña/negocio (siguen de dominio/settings)

---

## 6. Archivos a tocar en Task 1.1

| Archivo | Cambio |
|---|---|
| `apps/web/src/app/pasajero/reservas/page.tsx` | CTAs por estado, copy empty, opcional hints verificada/abordada/no_show |
| `apps/web/src/app/pasajero/page.tsx` | Subir jerarquía acceso Mis reservas |
| `apps/web/src/app/cuenta/page.tsx` | Link Mis reservas si falta |

No tocar DS de `BtnPrimary` / `StatusPill` / `EmptyHint` salvo bug; reutilizar tokens existentes.

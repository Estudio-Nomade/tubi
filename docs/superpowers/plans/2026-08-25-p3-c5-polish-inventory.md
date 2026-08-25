# P3 — Task 3.0 Inventario Pencil (C5 Recogida polish)

**Fecha:** 2026-08-25  
**Prioridad:** C5 Recogida fiel al Pencil — timer, feedback vencido, copy “No llegó”  
**Fuentes:**  
- Inventory base: `docs/superpowers/plans/2026-08-23-slice8-task0-inventory.md`  
- Preview: `design-artifacts/previews/10-conductor-recogida.png`  
- Pencil IDs: C5 `f0264` · WaitTimer `WqVkL`  
- Código:  
  - `apps/web/src/app/conductor/viajes/[id]/recogida/[reservaId]/page.tsx`  
  - `apps/web/src/components/conductor/{wait-timer,pickup-actions,no-show-button,passenger-row}.tsx`  
- Status S8: `docs/18-slice-8-noshow-status.md`  
- Plan: `docs/superpowers/plans/2026-08-25-tubi-mvp-cuatro-prioridades.md` § Ola A P3  

**Nota MCP:** Pencil MCP no disponible en esta pasada; tokens reconfirmados desde inventory S8 + wireframe `tubi-wireframes.pen` + preview PNG. Preview no legible como imagen en esta sesión; layout inferido del inventory y del código.

---

## 1. Tokens C5 · Recogida (`f0264`)

| Elemento | Spec Pencil | Código hoy | Match |
|---|---|---|---|
| Viewport | 375×812, `$bg`, vertical, clip | `max-w-[375px] min-h-dvh bg-background` | OK |
| AppHeader | Back 44, brand Fraunces 20, chip “Conductor” | `AppHeader showBack roleLabel="Conductor"` | OK |
| StopTitle | Fraunces 22/600 — parada actual | `font-heading text-[22px] font-semibold` · `{ctx.paradaLabel}` | OK |
| PassengerName | DM Sans 16/600 | `text-base font-semibold` · `{ctx.pasajeroNombre}` | OK |
| WaitCopy | DM 14/500 muted — “Espera máxima N min. Si no llega, no-show y seguís.” | `text-sm font-medium text-muted-foreground` · `esperaLabel` desde settings | OK (N desde `settings.reserva.espera_max_min`) |
| WaitTimer | ver §2 | `WaitTimer` en `PickupActions` | Parcial (gaps timer) |
| Spacer | fill | `mt-auto` en bloque CTAs | OK |
| CTA primary | BtnPrimary h52 r14 — “Escanear QR” | `BtnPrimary` → `/conductor/viajes/{id}/escanear` | OK |
| CTA danger | BtnDanger h52 r14 danger-soft | `BtnDanger` label **“Marcar no-show”** | **GAP** → “No llegó” |
| NextPreview | DM 13/500 muted center — “Siguiente · …” | `text-[13px] font-medium text-muted-foreground` | OK si hay `nextParadaLabel` |

---

## 2. WaitTimer component (`WqVkL`)

| Elemento | Spec | Código hoy | Match |
|---|---|---|---|
| Layout | vertical, gap 4, center | `flex flex-col items-center gap-1` | OK |
| WaitTime | Fraunces 40/600 `$ink` tabular | `font-heading text-[40px] font-semibold tabular-nums` | OK (activo) |
| WaitLabel | DM Sans 12/500 `$ink-muted` “tiempo de espera” | `text-xs font-medium text-muted-foreground` | OK (activo) |
| Estado vencido | *(no en Pencil estático; producto plan P3)* | Sin cambio de color/label; solo `onExpired` → `timerDone` | **GAP** |
| Persistencia | *(no en Pencil; producto plan P3)* | Countdown desde `useState(totalSeconds)` al mount | **GAP** |

---

## 3. Código actual — mapa de archivos

| Archivo | Rol |
|---|---|
| `recogida/[reservaId]/page.tsx` | Server page C5: auth, `getPickupContext`, `espera_max_min` de settings, shell + meta pasajero |
| `pickup-actions.tsx` | Client: `WaitTimer` + Escanear + `NoShowButton` + NextPreview; `timerDone` local |
| `wait-timer.tsx` | Countdown client 1s; `onExpired` una vez; **sin storage** |
| `no-show-button.tsx` | `BtnDanger` “Marcar no-show”; confirm si `!timerDone`; `marcarNoShowAction` |
| `passenger-row.tsx` (hub) | `confirmada` → row link a C5; `verificada` → row a cobrar + **link chico** “No llegó” a C5 |

---

## 4. Gaps vs diseño / producto (polish)

Ordenados por impacto en calle (conductor en recogida).

### 4.1 Danger label “Marcar no-show” → “No llegó”

- **Hoy:** `no-show-button.tsx` L42 — `{pending ? "Marcando…" : "Marcar no-show"}`.
- **Pencil/S8 inventory:** “Marcar no-show”.
- **Producto (plan P3 + hub):** label principal **“No llegó”**; el dialog explica que es no-show y se retiene la seña.
- **Task:** 3.2.

### 4.2 Sin feedback visual al vencer el timer

- **Hoy:** `PickupActions` setea `timerDone=true` vía `onExpired`; no hay banner ni estilo danger en el número.
- **Esperado:** número `text-[#B42318]`, label “tiempo agotado”, contenedor opcional danger-soft; banner en `PickupActions`:
  > Se acabó la espera. Si no está, marcá “No llegó” y seguí.
- **Task:** 3.1.

### 4.3 Timer se reinicia al remount

- **Hoy:** `WaitTimer` arranca `remaining = maxMinutes * 60` en cada mount. Volver del scanner o recargar C5 reinicia la espera.
- **Documentado en** `docs/18-slice-8-noshow-status.md` concern #3.
- **Esperado:** anclar inicio a `sessionStorage` key `tubi:wait:{reservaId}`; `remaining` = f(startedAt, maxMinutes, now).
- **Task:** 3.1.  
- **Fuera de scope:** cron server / persistencia DB del inicio de espera.

### 4.4 Hub: “No llegó” es link chico solo en `verificada`

- **Hoy (`passenger-row.tsx`):**
  - `confirmada` + `recogidaHref`: fila entera → C5 (hint “· Recogida”); **no** CTA “No llegó” en hub.
  - `verificada` + `cobrarHref`: fila → cobrar; debajo link `text-xs … text-[#B42318]` “No llegó” → C5.
- **Esperado:** en `verificada`, CTA danger-soft full-width más visible (“No llegó” h-10 `bg-[#FCEBEA]`). `confirmada` sigue entrando por la row a C5 (flujo principal escanear).
- **Task:** 3.2.

---

## 5. Decisiones de implementación

### Task 3.1 — WaitTimer: persistencia + estado vencido

**Files:** `wait-timer.tsx`, `pickup-actions.tsx`

| Decisión | Valor |
|---|---|
| Storage | `sessionStorage` only (tab session; no localStorage) |
| Key | `tubi:wait:{reservaId}` — valor: epoch ms del **inicio** de espera |
| API | `WaitTimer` recibe `storageKey: string` además de `maxMinutes` / `onExpired` |
| Cálculo | Cada tick: `remaining = max(0, floor((startedAt + maxMs - now) / 1000))` — no countdown ciego desde mount |
| Primer mount | Si no hay key → `setItem(now)` y arrancar; si hay key válida → reanudar |
| SSR | Leer storage solo en client (`useEffect` / guard `typeof window`); hidratar sin flash destructivo |
| Visual `remaining === 0` | Número `text-[#B42318]`; label **“tiempo agotado”**; opcional wrapper `rounded-2xl bg-[#FCEBEA] px-4 py-6` |
| Banner padre | Si `timerDone`, banner status danger-soft (copy §4.2) **arriba o junto** al bloque CTAs |
| `timerDone` inicial | `esperaMaxMin <= 0` **o** already expired al hidratar desde storage |
| No borrar key | Al no-show / navigate away la key puede quedar; irrelevante post-redirect. No limpiar en este task salvo si molesta tests |

**No hacer en 3.1:** cambiar copy del danger button; tocar hub.

### Task 3.2 — Copy y CTA “No llegó”

**Files:** `no-show-button.tsx`, `passenger-row.tsx`; `page.tsx` solo si hace falta alinear WaitCopy (hoy OK).

| Decisión | Valor |
|---|---|
| Label BtnDanger | Siempre **“No llegó”** (pending: “Marcando…”) |
| Confirm si `!timerDone` | Sí — copy: *¿Marcar que no llegó antes de que termine la espera? Se retiene la seña y seguís con el resto.* |
| Confirm si `timerDone` | **No** — menos fricción en calle; acción directa |
| WaitCopy en page | Mantener “Si no llega, no-show y seguís.” (explica dominio); CTA usa lenguaje de calle |
| Hub `verificada` | Reemplazar/ampliar link `text-xs` por CTA full-width danger-soft h-10 “No llegó” → `recogidaHref` |
| Hub `confirmada` | Sin cambio de patrón: row → C5 (entrada principal); no-show se hace en C5 |
| Destino hub “No llegó” | Sigue yendo a C5 (no invoca RPC desde hub) — conductor ve timer/contexto antes de marcar |

**No hacer en 3.2:** RPC, settings, ni rediseño del hub completo.

---

## 6. Checklist de aceptación (post 3.1 + 3.2)

- [ ] Abrir C5 → timer legible mm:ss + “tiempo de espera”
- [ ] Navegar a Escanear y volver → **mismo** remaining (no reinicio)
- [ ] Recargar C5 en la misma tab → persiste
- [ ] Al vencer: número rojo + “tiempo agotado” + banner de espera acabada
- [ ] CTA danger = “No llegó”; early confirm; post-timer sin confirm
- [ ] Hub `verificada`: CTA “No llegó” visible (no solo link xs)
- [ ] `espera_max_min` sigue viniendo de settings (sin hardcode)
- [ ] `cd apps/web && bun run type-check` OK

---

## 7. Fuera de scope (este polish)

- Cron / job server de auto no-show
- Persistencia del inicio de espera en DB
- Google Nav / mapa en C5
- Cambiar WaitCopy Pencil a “No llegó” (se deja “no-show” en copy educativa)
- Rediseñar frame Pencil (solo alinear UI a producto + fidelity razonable)

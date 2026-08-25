# Plan maestro — MVP mínimo para arrancar este mes (scope agresivo)

> **For agentic workers:** Ejecutar slice a slice con `superpowers:executing-plans` o `subagent-driven-development`. Un slice = un PR mental. Commits: usuario `git commit -S`.  
> **Objetivo:** **Operar el servicio este mes** con el menor scope que cierre el ciclo real (plata, calle, cierre de viaje). No demo teatro. No mapa.  
> **Fuentes:** `docs/01-prd.md` (P0), `docs/03-flujos-de-usuario.md`, `docs/06-reglas-y-estados.md`, Pencil `tubi-wireframes.pen`, slices 1–6 + demo-ready.

**Goal:** Cerrar lo indispensable para un día real: cancelar reserva, no-show, completar/cancelar viaje, settings de negocio editables. Alta de viajes y tracking quedan fuera o stretch.

**Architecture:** Capas `domain → application → adapters`. Mutaciones sensibles = RPC security definer + RLS. UI Ruta de la siesta. **Task 0 Pencil obligatorio** en cada slice con pantallas nuevas. Valores de negocio solo desde `settings`.

**Tech Stack:** Next.js 16 · Supabase · design system existente. Sin Google Maps en este plan.

---

## 0. Línea roja del mes (MVP Mínimo para Arrancar)

### Definición de “listo para arrancar”

Un día de operación real **sin SQL** para pasajero/conductor, y con operador que solo confirma seña + edita settings (viajes del día pueden venir de seed o insert manual una vez).

| # | Capacidad | Slice | Bloqueante |
|---|---|---|---|
| 1 | Happy path ya vivo: buscar → seña → QR → escanear → saldo → abordada | 1–6 | Ya está |
| 2 | Pasajero cancela con política de devolución clara (RN-03) | **S7** | **Sí** |
| 3 | Conductor marca no-show + espera desde settings (RN-04) | **S8** | **Sí** |
| 4 | Conductor completa viaje; operador puede cancelar viaje (RN-CANCEL) | **S9** | **Sí** |
| 5 | Operador edita settings de negocio en UI (O2), no `/dev` | **S10** | **Sí** |
| 6 | Hardening mínimo: migraciones, RLS smoke, checklist go/no-go | **S13-min** | **Sí** |
| 7 | Viajes del día existen (seed o SQL/manual una vez) | Seed / ops | **Sí** (no requiere S11) |

**Si falta cualquiera de 2–6 → no se considera MVP terminado este mes.**

### Explicitamente NO es línea roja

| Capacidad | Destino |
|---|---|
| Alta vehículo/viaje en UI operador | **Stretch (S11)** — seed/SQL al inicio |
| Tracking mapa P9/C8 + cola offline | **Post go-live** |
| Notificaciones push/email/WhatsApp | Post go-live |
| Panel operador rico / BI | Post go-live |
| Incidentes, DNI auto, ratings, multi-ruta | Post go-live |
| Background GPS iOS perfecto | Post go-live |

---

## 1. Inventario: qué hay vs qué falta

### 1.1 Ya cubierto (no rehacer)

| Capacidad | FR | Evidencia |
|---|---|---|
| Auth pasajero/conductor/roles | FR-03/03b | Slice 1 |
| Búsqueda + detalle | FR-01/02 | Slice 2A |
| Reserva + capacidad + qr_token | FR-04/06 | Slice 2B |
| Seña + operador confirma | FR-05 | Slice 3 |
| Pase QR pasajero | FR-06 UI | Slice 4 |
| Escaneo QR conductor | FR-07 | Slice 5 |
| Saldo + abordada (+ `en_curso` auto parcial) | FR-08 | Slice 6 |
| Mis reservas / historial lista | FR-21 (P1, ya hecho) | demo-ready Track B |
| Seed demo (viajes + usuarios) | — | 0014 |

### 1.2 Gaps para este mes (solo línea roja)

| FR | Tema | Hoy | Prioridad mes |
|---|---|---|---|
| FR-17 | Cancelar reserva + RN-03 | No | **P0 línea roja** |
| FR-13 | No-show + espera settings | No | **P0 línea roja** |
| FR-11 | Viaje → `completado` / `cancelado` | Solo parcial `en_curso` | **P0 línea roja** |
| FR-16 | Settings operador (O2) | Solo `/dev/settings` | **P0 línea roja** |
| FR-12 | C5 recogida mínima (timer + no-show) | Lista plana hub | **P0** (entra en S8, no nav GPS) |
| FR-09/10 | Alta vehículo + viaje UI | Solo seed | **Stretch** |
| FR-14/15 | Tracking + offline | No | **Fuera del mes** |
| FR-18 | Notificaciones | No | **Fuera del mes** (toasts en sesión bastan) |

### 1.3 Pencil: pantallas relevantes al mes

| Frame | Nombre | Acción este mes |
|---|---|---|
| P1–P8, P10–P12 | Auth, busca, seña, QR, cuenta… | Mantener |
| P8 CancelLink + RefundHint | Cancelar | **S7** Task 0 Pencil |
| Mis reservas | CTA cancelar | **S7** |
| **C5** `f0264` | Recogida + timer | **S8** Task 0 Pencil |
| C8 (solo CTA finalizar) | Completar viaje | **S9** (sin mapa) |
| **O2** `f0391` | Settings | **S10** Task 0 Pencil |
| **P9**, **C8 mapa** | Seguimiento / en ruta mapa | **Post go-live** |
| Alta viaje/vehículo | Forms simples | Stretch S11 |

---

## 2. Dos buckets claros

### A) MVP Mínimo para Arrancar este Mes

```
S7  Cancelar reserva (RN-03)
S8  No-show + C5 mínimo
S9  Cierre viaje (completado + cancel viaje operador)
S10 Settings operador O2
S13-min Hardening mínimo
```

**Orden de ejecución (agresivo):**

```
Ola 1 (paralelo):  S7 ∥ S8 ∥ S10
Ola 2:             S9
Ola 3:             S13-min
```

S7, S8 y S10 no se pisan ownership (pasajero / conductor / operador). S9 depende de tener estados de reserva estables (mejor después de S7–S8). S13-min siempre último.

**Viajes del día en el arranque:** seed `0014` + inserts SQL/manual del operador técnico. No bloquea go-live.

### B) Post Go-live (después de arrancar)

| Orden sugerido | Item | Notas |
|---|---|---|
| 1 | **S11** Alta vehículo + viaje UI | Si no se hizo en stretch |
| 2 | **S12** Tracking P9/C8 + cola offline | MapsProvider, realtime |
| 3 | Notifier (email/WhatsApp) | Detrás de puerto |
| 4 | Panel operador / incidentes / DNI manual UI | P1 PRD |
| 5 | Hardening ampliado (backup, legal, PWA) | Ops |

---

## 3. Porcentaje de cobertura (estimación honesta)

### Baseline actual (post Slice 6 + mis reservas)

| Eje | % aprox. |
|---|---|
| Happy path reserva→abordar | **~90%** |
| Ciclo viaje completo | **~40%** |
| Operación diaria sin SQL (settings + cancel + no-show) | **~30%** |
| Tracking | **0%** |
| **P0 PRD (FR-01…18)** | **~55–60%** |
| **MVP “se puede operar un día real”** | **~50%** |

### Al terminar la **línea roja** (S7–S10 + S13-min)

| Eje | % estimado |
|---|---|
| Happy path + cancel + no-show | **~98%** |
| Ciclo viaje (completado/cancelado) | **~95%** |
| Settings sin redeploy | **~100%** de lo necesario |
| Alta viaje UI | **0%** (seed/SQL) |
| Tracking | **0%** |
| **P0 PRD** | **~72–78%** |
| **MVP “arrancar el mes sin mapa ni alta UI”** | **~85–90%** |

### Si además entra stretch S11

| Eje | % |
|---|---|
| Operación diaria sin SQL | **~95%** |
| **MVP producción sin mapa** | **~90–92%** |
| **P0 PRD** | **~78–82%** |

### Post go-live + S12 tracking

| Eje | % |
|---|---|
| **P0 PRD** | **~88–92%** |
| **Producto “completo P0”** | **~90–93%** |

---

## 4. Slices de la línea roja (detalle)

### Slice 7 — Cancelar reserva (FR-17, RN-03) · BLOQUEANTE

**Pencil:** P8 CancelLink + RefundHint; Mis reservas.

**Goal:** Pasajero cancela `pendiente_sena` o `confirmada` (no `verificada`/`abordada`). Sistema calcula % devolución por antelación vs `viaje.fecha_salida` y snapshot `politica_cancelacion`. Persiste `cancelada` + monto a devolver. **No** mueve plata (sin pasarela): operador ve “pendiente devolución”.

| Tema | Decisión |
|---|---|
| Quién | Solo dueño pasajero |
| Estados cancelables | `pendiente_sena`, `confirmada` |
| Post-verify | No cancelar |
| Devolución | % de `monto_sena` según snapshot; seña no confirmada → 0, solo libera asiento |
| UI | P8 + Mis reservas + confirm dialog |
| RPC | `cancelar_reserva(p_reserva_id)` |

**Archivos clave:**

```
supabase/migrations/0015_slice7_cancelar_reserva.sql
apps/web/src/domain/reservas/cancel.ts
apps/web/src/application/reservas/actions.ts
apps/web/src/app/pasajero/pase/[id]
apps/web/src/app/pasajero/reservas/**
```

**Done:** cancelar confirmada >24h → 100% a devolver; <12h → 0%; asiento liberado.

**Fuera:** transferencia bancaria automática de la devolución.

**Esfuerzo:** 1–1.5 días · Riesgo bajo

---

### Slice 8 — No-show + C5 mínimo (FR-12/13) · BLOQUEANTE

**Pencil:** **C5 · Recogida** `f0264` (WaitTimer, Escanear, Marcar no-show).

**Goal:** Conductor marca `confirmada|verificada` → `no_show`. Espera max = `settings.reserva.espera_max_min` (default 5). UI C5: pasajero actual + countdown client + acciones (sin Google Nav).

| Tema | Decisión |
|---|---|
| Orden | Lista hub (created_at / orden actual); sin geofence |
| Timer | Client-side al abrir C5 / “Iniciar espera”; no cron server |
| RPC | `marcar_no_show(p_reserva_id)` guard conductor + estado |
| Tras no-show | Siguiente pendiente; si no quedan confirmada/verificada → alinear con auto `en_curso` de S6 |

**Archivos clave:**

```
supabase/migrations/0016_slice8_no_show.sql
apps/web/src/domain/reservas + conductor
apps/web/src/app/conductor/viajes/[id]/recogida/[reservaId]/page.tsx
hub links “No llegó”
```

**Done:** no-show persiste; seña retenida (0%); lista avanza.

**Fuera:** geofence, push “el auto llegó”, secuencia paradas con nav externa.

**Esfuerzo:** 1.5–2 días · Riesgo medio (UI timer)

---

### Slice 9 — Cierre de viaje: completado + cancelado (FR-11) · BLOQUEANTE

**Pencil:** C8 solo CTA “Finalizar viaje” (sin mapa). Operador: cancelar viaje.

**Goal:**

- Conductor: `en_curso` → `completado` (RPC `completar_viaje`).
- Guard: no quedan `confirmada|verificada` (solo abordada/no_show/cancelada).
- Operador: cancelar viaje en `programado|recogida|en_curso` → `cancelado` + reservas no terminales → `cancelada` + devolución 100% seña confirmada (RN-CANCEL).

| Tema | Decisión |
|---|---|
| Quién completa | Conductor del viaje |
| Quién cancela viaje | Operador |
| UI conductor | CTA “Finalizar viaje” en hub si `en_curso` |
| UI operador | Lista mínima viajes + cancelar (home operador o `/operador/viajes`) |

**Archivos clave:**

```
supabase/migrations/0017_slice9_viaje_cerrar.sql
apps/web/src/domain/viajes/states.ts
apps/web/src/application/conductor + operador
apps/web/src/app/conductor/viajes/[id]
apps/web/src/app/operador/**
```

**Done:** viaje `completado` en DB; cancel operador libera y marca devolución 100%.

**Esfuerzo:** 1–1.5 días · Riesgo bajo

---

### Slice 10 — Settings operador O2 (FR-16) · BLOQUEANTE

**Pencil:** **O2 · Settings** `f0391`.

**Goal:** `/operador/settings` edita claves de negocio (seña, espera, devoluciones %, comisión, precio base, feature flags). Lee/escribe tabla `settings`. Sin redeploy.

| Tema | Decisión |
|---|---|
| Auth | `requireProfile(["operador"])` |
| Validación | Zod rangos PRD |
| `/dev/settings` | Redirigir a `/operador/settings` o dejar solo en non-prod |

**Archivos clave:**

```
apps/web/src/domain/settings (ya)
apps/web/src/application/operador/settings-*
apps/web/src/app/operador/settings/page.tsx
migración policy UPDATE settings si falta
```

**Done:** cambiar seña a 6000 → nueva reserva usa 6000.

**Esfuerzo:** ~1 día · Riesgo bajo

---

### Slice 13-min — Hardening mínimo · BLOQUEANTE

**Solo lo indispensable para operar. No features.**

Checklist go/no-go:

- [ ] Migraciones `0001` → latest aplicadas en el entorno de arranque
- [ ] Env + Supabase + Storage comprobantes configurados
- [ ] Smoke RLS por rol (pasajero / conductor / operador): 1 camino feliz cada uno
- [ ] Seed demo **no** se corre en prod (solo local/staging)
- [ ] Copy legal mínimo seña/cancelación visible en checkout (1 párrafo)
- [ ] Documento corto `docs/16-mvp-launch-checklist.md` con go/no-go

**Fuera de S13-min (post go-live):** backup formal, retención tracking, error boundaries exhaustivos, PWA offline perfecta, monitoreo APM.

**Esfuerzo:** 0.5–1 día · Riesgo bajo-medio ops

---

## 5. Stretch (solo si sobra tiempo antes de go-live)

### Slice 11 — Alta vehículo + viaje (FR-09/10) · STRETCH

**Cuándo:** solo si S7–S10 + S13-min están verdes y queda buffer.

**Goal:** Operador crea vehículo + viaje programado desde UI (rutas seed, sin CRUD rutas).

**Si no entra:** operador/técnico inserta viajes por SQL o Supabase dashboard la primera semana. Aceptable para arrancar.

**Esfuerzo:** 1.5–2 días · No bloquea línea roja

---

## 6. Fuera del mes (congelado hasta post go-live)

| Item | Por qué fuera |
|---|---|
| **S12 Tracking** (P9, C8 mapa, cola offline) | Alto riesgo tiempo; operar con WhatsApp/llamada la 1ª semana |
| FR-18 Notificaciones push/SMS | Toasts en sesión alcanzan |
| FR-19 Incidentes ricos | Post |
| FR-20 DNI UI operador | Manual offline OK al inicio |
| FR-22 Panel operador BI | Home operador mínimo alcanza |
| FR-23 ETA routing | Depende de tracking |
| P2 ratings / tarifa km / multi-destino | Fuera MVP |

---

## 7. Estimación de esfuerzo (1 dev + IA)

| Slice | Días | Prioridad |
|---|---|---|
| S7 Cancelar | 1–1.5 | Línea roja |
| S8 No-show C5 | 1.5–2 | Línea roja |
| S9 Cierre viaje | 1–1.5 | Línea roja |
| S10 Settings | 1 | Línea roja |
| S13-min Hardening | 0.5–1 | Línea roja |
| **Total línea roja** | **~5–7 días** | |
| S11 Alta (stretch) | +1.5–2 | Opcional |
| S12 Tracking | +3–5 | **Post go-live** |

Paralelismo Ola 1 (7∥8∥10) puede bajar wall-clock ~30–40% con agents.

---

## 8. Reglas de ejecución (anti-regresión)

1. **No** tocar happy path seña/QR salvo cableado de cancel/no-show/cierre.  
2. Cada slice: migración propia si muta schema/RLS; `type-check` + `build`.  
3. Pencil Task 0 antes de UI nueva (P8 cancel, C5, O2).  
4. Valores de negocio **solo** settings.  
5. Capas domain → application → adapters.  
6. Commits por slice; branch `feat/mvp-slice-N-…`.  
7. **Si el tiempo aprieta:** cortar S11 sin dudar. **Nunca** reabrir S12 este mes.  
8. Commits GPG: usuario firma con `git commit -S`.

---

## 9. Criterio go-live (checklist humano)

- [ ] Pasajero reserva + seña + QR  
- [ ] Operador confirma seña  
- [ ] Operador edita settings (seña/espera/devoluciones)  
- [ ] Hay al menos un viaje del día (seed o manual)  
- [ ] Conductor: recogida, QR, saldo, **no-show**  
- [ ] Pasajero **cancela** con política visible  
- [ ] Viaje se **completa** o se **cancela** por operador  
- [ ] Mis reservas refleja estados  
- [ ] Checklist S13-min firmado (go)  
- [ ] ~~Mapa en vivo~~ **no requerido**  
- [ ] ~~Alta viaje en UI~~ **no requerido**  

---

## 10. Resumen ejecutivo

| Pregunta | Respuesta |
|---|---|
| ¿Línea roja del mes? | **S7 + S8 + S9 + S10 + S13-min** |
| ¿Stretch? | S11 alta vehículo/viaje |
| ¿Fuera del mes? | **S12 tracking** y todo P1/P2 resto |
| ¿Cómo hay viajes al día 1? | Seed + SQL/manual |
| ¿Orden? | Ola1: 7∥8∥10 → Ola2: 9 → Ola3: 13-min → (stretch 11) |
| **% al terminar línea roja** | **~85–90% MVP operable; ~72–78% P0 PRD** |
| **% si entra S11** | **~90–92% operable; ~78–82% P0** |
| **Tracking** | Post go-live → empuja P0 a ~88–92% |

---

## Handoff

Plan guardado en:

`docs/superpowers/plans/2026-08-23-tubi-mvp-cierre-maestro.md`

**Siguiente paso humano:** aprobar este scope y lanzar **Ola 1 (S7 ∥ S8 ∥ S10)** o **solo S7**.

---

## Changelog ejecución

| Fecha | Evento |
|---|---|
| 2026-08-23 | **Ola 1 implementada** (sin commit GPG). S7+S8+S10 en paralelo. `type-check` + `build` OK. Rutas nuevas: cancel UI, C5 recogida, `/operador/settings`. Migraciones `0015`–`0017` pendientes de aplicar en Supabase. Status: `docs/17`–`19`. Siguiente: **S9 Cierre viaje** → S13-min. |

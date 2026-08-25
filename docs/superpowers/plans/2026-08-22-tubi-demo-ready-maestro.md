# Plan maestro — Demo-ready (3 tracks en paralelo)

> **For agentic workers:** Orchestrator usa `superpowers:dispatching-parallel-agents` + `superpowers:subagent-driven-development`.  
> **Commits:** usuario con `git commit -S`. Paths: `apps/web/src/...`.  
> **Branch sugerida:** `feat/demo-ready-polish` desde el HEAD actual (incluye slices 4–6).

**Goal:** Que Tubi se sienta **operable y presentable** en una demo de 5–7 min con Ariel: conductor “manda el viaje”, pasajero ve **todas** sus reservas, y hay **datos + guión** que no se rompen.

**Architecture:** Tres tracks **independientes por ownership de archivos**. Paralelismo real entre implementers; el orchestrator integra, type-check/build final y smoke del guión. Sin refactor grande: pulido UI + 1 pantalla nueva + seed/docs.

**Tech Stack:** Next.js 16 · Supabase · Ruta de la siesta · Pencil MCP obligatorio en tracks UI.

**Skills de proceso:** writing-plans (este doc) → OK humano → branch → 3 implementers en paralelo → review por track → integración → finishing-branch.

---

## Estado de partida (honestidad)

| Área | Hoy | Gap demo |
|---|---|---|
| Conductor | Home C3, hub, scan C6, OK/error, saldo C7 | Se siente “pantallas sueltas”; poco progreso de viaje, copy/empty flojos, TabBar “Viajes” genérico |
| Pasajero | Home 1 activa + pase QR | **No hay** lista “Mis reservas / historial” |
| Demo data | `conductor.demo` + `operador.demo` + viajes seed; **sin** pasajero multi-reserva listo | Cada demo se arma a mano y se rompe |

**Pencil relevante (MCP):**

| Track | Frames |
|---|---|
| A Conductor | C2 `ewfc2`, C3 `DOGMp`, C4 `f0239`, C6 `f0282`, C9 `J2LkdG`, C10 `ZSNsT`, C7 `f0305` |
| B Pasajero | P7 `C6xRqs`, P8 `f0175`, cards de home/TripCard `o205D`, StatusPill — **no hay frame “Mis reservas”**: derivar de P7 cards + lista estilo operador |
| C Demo | N/A UI; seed SQL + `docs/15-demo-script.md` |

---

## Principio de paralelismo (anti-conflicto)

| Track | Agent | **Únicos paths que puede tocar** |
|---|---|---|
| **A** Conductor polish | `implementer-conductor` | `apps/web/src/app/conductor/**`, `apps/web/src/components/conductor/**`, `apps/web/src/components/design/tab-bar.tsx` **solo** líneas `CONDUCTOR_TABS` |
| **B** Mis reservas | `implementer-pasajero` | `apps/web/src/app/pasajero/reservas/**` (lista nueva), `apps/web/src/domain/reservas/**` (list methods), `apps/web/src/application/reservas/**`, `apps/web/src/adapters/supabase/reservas-repository.ts`, `apps/web/src/app/pasajero/page.tsx` (solo CTA “Mis reservas”), `apps/web/src/components/design/tab-bar.tsx` **solo** si hace falta tab pasajero — **preferir link desde home/cuenta, no pelear TabBar con A** |
| **C** Demo data + script | `implementer-demo` | `supabase/migrations/0014_slice7_demo_pack.sql`, `docs/15-demo-script.md`, `docs/15-demo-ready-status.md` (status parcial C) |

**Orchestrator (esta sesión):** no implementa features; despacha, resuelve conflictos TabBar si ambos tocan, corre `type-check`/`build`, escribe status final.

**Regla TabBar:** Track A es dueño de tabs conductor. Track B **no** cambia TabBar; pone “Mis reservas” en home pasajero + cuenta si hace falta.

---

## Track A — Pulido fuerte Conductor

### Objetivo demo
Ariel abre `/conductor` y **entiende en 10 s**: viaje de hoy, cuántos abordaron, a quién le falta QR/saldo, y un CTA claro.

### Entra

1. **Home C3 como “cockpit”**
   - Hero con estado de viaje (pill: Programado / Recogida / En curso).
   - Mini progreso: `confirmadas | verificadas | abordadas` (conteos de la lista ya cargada).
   - CTA primario único según estado (`Empezar recogida` / `Continuar` / `Escanear` / si en_curso y quedan verificadas → “Cobrar pendientes”).
   - Lista pasajeros: filas con pill + chevron a saldo si `verificada`; visual más denso (sin vacíos raros).
   - Empty C2: card centrada, copy amable, sin botones muertos ruidosos (agenda disabled más discreto).

2. **Hub `/conductor/viajes/[id]`**
   - Header con pill estado viaje.
   - Banner de éxito post-saldo (ya existe) más claro.
   - Sección “Pendientes de abordar” vs “A bordo” (split simple de la lista, sin backend nuevo).
   - CTA sticky o primario siempre visible: Escanear QR.

3. **Scan C6 + feedback**
   - Ya hay overlay; reforzar: éxito no se “pierde” (C9 sólido).
   - Error C10 copy por código (ya parcial).
   - Mientras `pending`, bloquear double-scan (ya hay handledRef).

4. **TabBar conductor**
   - `viajes` → si hay viaje activo del día, href al hub; si no, `/conductor`.
   - (Implementación: server no puede cambiar href dinámico fácil en TabBar client — **opción A:** ambos a `/conductor` y home es el hub; **opción B:** TabBar acepta `viajesHref` prop opcional desde layout conductor. Preferir **B** mínimo: `ConductorLayout` o pages pasan `viajesHref`.)

### No entra (A)
- GPS / C8 mapa, no-show timer, crear viajes, C4 agenda multi-día completa.

### Tasks A (orden interno del agent)

- [ ] **A0** Pencil MCP dump C2/C3/C4 + checklist inventory md corto.
- [ ] **A1** Home cockpit: conteos + pill viaje + empty polish.
- [ ] **A2** Hub split pendientes / a bordo + CTA.
- [ ] **A3** TabBar `viajesHref` opcional + wire conductor pages.
- [ ] **A4** type-check scoped; no tocar pasajero.

### Criterios Done A

| # | Criterio |
|---|---|
| A1 | Home muestra progreso de pasajeros del viaje activo |
| A2 | Hub separa pendientes vs abordados |
| A3 | Empty no se siente “stub roto” |
| A4 | Scan/OK/error siguen funcionando |
| A5 | Sin cambios fuera de ownership A |

---

## Track B — Mis reservas / mis viajes (pasajero)

### Objetivo demo
El pasajero (o Ariel en rol pasajero) ve **todas** las reservas con estado, y entra al QR o a la seña según corresponda.

### Entra

1. **Ruta principal** `/pasajero/reservas` — **todas** las reservas del usuario: pendientes (`pendiente_sena`) + activas (`confirmada`, `verificada`) + historial (`abordada`, `cancelada`, `no_show`).
2. **Domain/app/adapter**
   - `listForPassenger(pasajeroId): ReservaListItem[]`
   - Join viaje + ruta; order `fecha_salida desc` (o activas primero luego historial).
3. **UI lista** (derivada P7 cards)
   - Card: ruta Fraunces, fecha muted, StatusPill, chevron.
   - **Acceso directo al QR** cuando `confirmada` → `/pasajero/pase/[id]` (CTA o tap primario).
   - `pendiente_sena` → `/pasajero/reservas/[id]/sena` (o en-revision).
   - `verificada` / `abordada` / terminales → detalle read-only `/pasajero/reservas/[id]` opcional o card informativa.
4. **Home P7** — link “Ver todas mis reservas” → `/pasajero/reservas`.
5. **Empty** EmptyHint + Buscar viaje.

### No entra (B)
- Cancelar reserva, filtros avanzados, paginación infinita, notificaciones.

### Tasks B

- [ ] **B0** Pencil: P7 + TripCard + StatusPill tokens (inventory).
- [ ] **B1** `listForPassenger` port + repo + service.
- [ ] **B2** Página `/pasajero/reservas` + opcional `/pasajero/reservas/[id]` read-only.
- [ ] **B3** CTA home “Ver todas…”.
- [ ] **B4** type-check; ownership B.

### Criterios Done B

| # | Criterio |
|---|---|
| B1 | Lista muestra ≥1 reserva demo con pill correcta |
| B2 | Desde confirmada se llega al QR |
| B3 | Desde pendiente_sena se llega a seña |
| B4 | Empty amable sin reservas |
| B5 | Estilo Ruta de la siesta (cards, Fraunces, pills) |

---

## Track C — Demo pack + script

### Objetivo demo
Un `db reset` (o migration up) deja el mundo listo; un doc de 1 página guía la demo sin improvisar.

### Entra

1. **Migración `0014_slice7_demo_pack.sql`** (idempotent `on conflict`)
   - **Cuentas demo de login** (password **`demo-demo-1`** todos):
     | Email | Rol | Nombre |
     |---|---|---|
     | `pasajero.demo@tubi.local` | pasajero | **Ana Pérez** (cuenta principal pasajero) |
     | `conductor.demo@tubi.local` | conductor | **Luis Demo** (actualizar nombre seed si era Ariel) |
     | `operador.demo@tubi.local` | operador | (ya existe) |
   - **Viaje hoy** 07:00 Tandil→BsAs, conductor Luis, `programado`, precio 25000.
   - **3 reservas `confirmada`** en ese viaje (para escanear de verdad), con seña `confirmado` y `qr_token` fijos documentados:
     1. Ana Pérez (login demo) — token `opq_demo_ana_…`
     2. Pasajero seed B (solo datos; puede ser auth user mínimo o solo profile si RLS lo permite — preferir 2 users auth más: `pax.b@` / `pax.c@` o nombres fijos sin login en el guión, tokens en el script)
     3. Pasajero seed C
   - Guión usa login Ana + conductor Luis; los otros 2 QR se pegan desde el script o se muestran en doc.
2. **`docs/15-demo-script.md`** — guión 5–7 min:
   1. Login operador → señas (si hay pendiente) o skip.
   2. Login pasajero Ana → home → Mis reservas → Ver QR.
   3. Login conductor → home cockpit → Empezar recogida → escanear/pegar token Ana → Cobrar saldo efectivo → lista.
   4. Repetir Luis o mostrar segundo pax.
   5. Cierre: viaje en_curso si ambos abordados.
   - Credenciales en tabla al inicio.
   - Plan B si cámara falla (pegar `opq_…`).
3. **Status parcial** en el mismo doc o `docs/15-demo-ready-status.md` sección C.

### No entra (C)
- UI nueva, cambios de RLS de producto (salvo grants seed), datos de producción.

### Tasks C

- [ ] **C1** Diseñar UUIDs fijos + SQL seed.
- [ ] **C2** Escribir guión demo.
- [ ] **C3** Verificar SQL sintaxis; nota “aplicar 0013+0014”.

### Criterios Done C

| # | Criterio |
|---|---|
| C1 | 2 pasajeros confirmados en viaje de hoy del conductor demo |
| C2 | Tokens QR documentados o recuperables desde UI |
| C3 | Guión ≤ 7 min con plan B sin cámara |
| C4 | Password único `demo-demo-1` |

---

## Orquestación (secuencia)

```
T0  Human OK este plan
T1  Branch feat/demo-ready-polish
T2  PARALLEL:
      Agent A → Track A
      Agent B → Track B  
      Agent C → Track C
T3  Orchestrator merge mental:
      - Resolver si ambos tocaron tab-bar (no deberían)
      - bun run type-check && build en apps/web
T4  Smoke manual según docs/15-demo-script.md (orchestrator o humano)
T5  docs/15-demo-ready-status.md final
T6  finishing-a-development-branch (opciones merge/PR)
```

### Prompts de dispatch (resumen)

Cada agent recibe:
- Goal del track + Done criteria
- Ownership paths (hard fail si edita fuera)
- “Pencil MCP first for UI”
- “No git commit -S; stage sugerido al final”
- “Return: files changed, how to verify, risks”

### Review (por track, post-parallel)

1. Spec compliance: ¿cumple Done table?
2. Quality: capas, no secrets, no over-engineering
3. Integración: build verde

---

## Fuera de este plan maestro (explícito)

- GPS en vivo / C8 completo  
- No-show + timer 5 min  
- Cancelación + devolución  
- Settings operador UI  
- PWA offline tracking  
- Notificaciones push  
- Marca/dominio  

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Conflicto git en TabBar | Ownership: solo A; B no toca |
| Seed fecha “hoy” en TZ | Usar `timestamptz` con offset AR o `now()::date + time` |
| Demo en DB sin 0013 | Script dice aplicar migraciones en orden |
| Agent A pule de más | Checklist Done cerrado; no C5/C8 |
| Lista reservas sin RLS | Ya hay select own; solo query |

---

## Entregables finales

1. UI conductor cockpit-ready  
2. `/pasajero/reservas` (+ detalle mínimo si hace falta)  
3. `0014_slice7_demo_pack.sql` + `docs/15-demo-script.md`  
4. `docs/15-demo-ready-status.md`  
5. Build OK  

---

## Handoff

Plan en:

`docs/superpowers/plans/2026-08-22-tubi-demo-ready-maestro.md`

**Ejecución pedida por el usuario:** Subagent-Driven + paralelo entre tracks A/B/C tras OK explícito.

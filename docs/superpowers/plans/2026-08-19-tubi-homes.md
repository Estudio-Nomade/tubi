# Tubi Homes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add passenger + driver home screens (with empty variants) and a reusable TabBar to the Pencil UI, in Ruta de la siesta style.

**Architecture:** Extend `design-artifacts/tubi-wireframes.pen` with TabBar component + 4 new frames (16, 16b, 17, 17b). Optionally add TabBar to existing post-login list screens (búsqueda, resultados, QR, viajes del día). No app code.

**Tech Stack:** Pencil MCP, existing tokens/components (Fraunces, DM Sans, $accent terracota).

**Spec:** `docs/superpowers/specs/2026-08-19-tubi-homes-design.md`

---

## Component IDs (current library)

StatusBar `Zpse2` · AppHeader `zJbea` · ProgressDots `AQYhJ` · BtnPrimary `TXQO6` · BtnSecondary `W0u7k` · BtnDanger `ygW4c` · IconBtn `gteFF` · Field `iFTuH` · StatusPill `Y9cKXb` · TripCard `o205D` · InfoRow `AcU21` · EmptyHint `WDdyn` · QRPass `itlkI` · WaitTimer `WqVkL` · MapPlaceholder `z0UGJN`

---

### Task 1: TabBar component

**Files:** Modify `design-artifacts/tubi-wireframes.pen`

- [ ] **Step 1:** Create reusable `TabBar` at y≈-700 via FindEmptySpace
  - frame 375×64, fill `$surface`, stroke top `$border` width 1, layout horizontal, align center, justifyContent space_around, padding [8, 4]
  - 4 items default (pasajero): each vertical gap 2 align center — icon lucide 22 + label DM Sans 11
  - Items: home “Inicio” (active $accent), search “Buscar”, qr-code “QR”, user “Cuenta” (inactive $ink-muted)
- [ ] **Step 2:** Print id of TabBar; screenshot

### Task 2: Home pasajero (16 + 16b)

- [ ] **Step 1:** FindEmptySpace right of existing screens; insert frame `16 · Pasajero · Home` 375×812 fill `$bg` clip
  - StatusBar ref
  - Saludo “Hola, Ana” Fraunces 28
  - Hero card surface radius 16 padding 16 gap 12 shadow: StatusPill Confirmada, ruta Fraunces, meta fecha/hora/parada, BtnPrimary “Ver mi QR”
  - Secondary text “Buscar otro viaje”
  - spacer fill_container
  - TabBar ref Inicio active
- [ ] **Step 2:** Copy → `16b · Pasajero · Home empty`: EmptyHint + BtnPrimary “Buscar viaje”, no hero reserva
- [ ] **Step 3:** Screenshot both

### Task 3: Home conductor (17 + 17b)

- [ ] **Step 1:** `17 · Conductor · Home` — saludo, hero viaje hoy (hora, ruta, 3/4, patente), BtnPrimary “Empezar recogida”, lista corta pasajeros, TabBar 3 items (Inicio/Viajes/Cuenta) — build 3-item bar inline or override TabBar
- [ ] **Step 2:** `17b · Conductor · Home empty` — empty copy + Ver agenda
- [ ] **Step 3:** Screenshot

### Task 4: TabBar on key post-login screens (light touch)

Add TabBar to bottom of: f0059 Búsqueda, f0092 Resultados, f0175 QR (if fits), f0239 Viajes del día — with correct active tab. Skip deep flows (detalle, checkout, recogida, scan, saldo, en ruta, seguimiento, registro).

If adding TabBar causes overflow, reduce content padding or accept clip of secondary content; primary CTA must remain tappable.

### Task 5: Export previews + mark spec

- [ ] Export PNG 16, 16b, 17, 17b to `design-artifacts/previews/` as `16-pasajero-home.png` etc.
- [ ] Update spec estado → implementado
- [ ] User commits with `git commit -S` (agent does not commit)

## Constraints

- Pencil MCP only for .pen
- No git commit by agent
- Spanish Argentine copy
- Ensure .pen file is saved/persisted if editor holds dirty state — after edits, verify `git status` shows pen change or instruct user to Save in Pencil

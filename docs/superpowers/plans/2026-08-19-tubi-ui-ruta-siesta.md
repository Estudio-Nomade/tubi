# Tubi UI “Ruta de la siesta” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir los 15 wireframes lo-fi de Tubi en UI hi-fi “Ruta de la siesta” (tokens cálidos, componentes reutilizables, wizards y mejor composición) dentro de Pencil.

**Architecture:** Un solo archivo Pencil `design-artifacts/tubi-wireframes.pen`. Primero tokens + librería de componentes `reusable` arriba del canvas; después rediseño **in-place** de los 15 frames existentes (no borrar IDs de frame de inventario). Verificación visual por `TakeScreenshot` / export PNG. Sin código de app.

**Tech Stack:** Pencil MCP (`get_app_state`, `execute`, `Get`/`Insert`/`Update`/`Copy`/`SetVariables`/`TakeScreenshot`/`Export`), Google Fonts Fraunces + DM Sans, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md`

---

## Global Constraints

- Producto: **Tubi**. Marca final (logo/dominio) fuera de alcance.
- Viewport: **375 × 812**. Copy: español argentino.
- No tocar `apps/web` en este plan.
- No copiar de LIFTY sin pedido explícito del usuario.
- Commits: Conventional Commits, stagear archivos específicos (nunca `git add .`), GPG: el agente **no** ejecuta `git commit` — prepara el mensaje y pide al usuario `git commit -S`.
- Co-Authored-By del modelo real si el usuario commitea con ayuda del agente.
- Valores de negocio en UI = ejemplos demo; no presentarlos como hardcode de producto.

## Frame inventory (IDs actuales — no borrar)

| # | id | name |
|---|---|---|
| 1 | `f0028` | 1 · Pasajero · Registro |
| 2 | `f0059` | 2 · Pasajero · Búsqueda |
| 3 | `f0092` | 3 · Pasajero · Resultados |
| 4 | `f0119` | 4 · Pasajero · Detalle |
| 5 | `f0143` | 5 · Pasajero · Checkout seña |
| 6 | `f0175` | 6 · Pasajero · QR |
| 7 | `f0193` | 7 · Pasajero · Seguimiento |
| 8 | `f0221` | 8 · Conductor · Registro |
| 9 | `f0239` | 9 · Conductor · Viajes del día |
| 10 | `f0264` | 10 · Conductor · Recogida |
| 11 | `f0282` | 11 · Conductor · Escanear QR |
| 12 | `f0305` | 12 · Conductor · Saldo |
| 13 | `f0329` | 13 · Conductor · En ruta |
| 14 | `f0351` | 14 · Operador · Confirmar seña |
| 15 | `f0391` | 15 · Operador · Settings |

Si al abrir el `.pen` un id no existe, re-listar top-level frames con `Get(document, …)` y actualizar la tabla mental; no recrear pantallas duplicadas.

## File map

| Path | Rol |
|---|---|
| `design-artifacts/tubi-wireframes.pen` | Único canvas: tokens, componentes, 15 screens |
| `design-artifacts/previews/` | PNG export 2x (sobrescribir o agregar sufijo `-ui` si se quieren conservar lo-fi) |
| `docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md` | Spec (solo lectura en ejecución) |
| `docs/superpowers/plans/2026-08-19-tubi-ui-ruta-siesta.md` | Este plan |

---

### Task 1: Commit de spec + plan (docs)

**Files:**
- Create (ya existen): `docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md`
- Create (este archivo): `docs/superpowers/plans/2026-08-19-tubi-ui-ruta-siesta.md`

- [ ] **Step 1: Verificar git status**

```bash
git status -sb
git diff --stat
```

Expected: spec y plan untracked o modified; no secretos.

- [ ] **Step 2: Pedir al usuario el commit firmado**

```bash
git add docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md \
        docs/superpowers/plans/2026-08-19-tubi-ui-ruta-siesta.md
git commit -S -m "$(cat <<'EOF'
docs(ui): add Ruta de la siesta design spec and plan

Co-Authored-By: grok-4.5 <noreply@opencode.ai>
EOF
)"
```

(El agente no ejecuta el commit; lo corre el usuario.)

---

### Task 2: Tokens en el `.pen`

**Files:**
- Modify: `design-artifacts/tubi-wireframes.pen` (variables)

- [ ] **Step 1: Abrir estado Pencil**

Usar MCP `get_app_state` con el file `design-artifacts/tubi-wireframes.pen` activo.

- [ ] **Step 2: Reemplazar variables de color**

En `execute`:

```js
SetVariables({
  bg: { type: "color", value: "#F7F3EC" },
  surface: { type: "color", value: "#FFFCF7" },
  "surface-2": { type: "color", value: "#EFE8DC" },
  ink: { type: "color", value: "#1C1917" },
  "ink-muted": { type: "color", value: "#78716C" },
  border: { type: "color", value: "#E7E0D4" },
  accent: { type: "color", value: "#C45C26" },
  "accent-soft": { type: "color", value: "#F3E0D4" },
  "on-accent": { type: "color", value: "#FFFCF7" },
  sage: { type: "color", value: "#5F7A61" },
  "sage-soft": { type: "color", value: "#E4EDE5" },
  danger: { type: "color", value: "#B42318" },
  "danger-soft": { type: "color", value: "#FCEBEA" },
  card: { type: "color", value: "#FFFCF7" },
  muted: { type: "color", value: "#78716C" },
  error: { type: "color", value: "#B42318" }
}, false)
Print(GetVariables())
```

Notas:
- Se mantienen aliases `card` / `muted` / `error` mapeados a la nueva piel para no romper nodos viejos que aún los referencien durante la migración.
- `surface` wireframe antiguo (`#F4F4F5`) queda reemplazado por cream card; el fondo de pantalla usa `$bg`.

- [ ] **Step 3: Verificar**

`Print(GetVariables())` debe mostrar `accent` = `#C45C26` y `bg` = `#F7F3EC`.

---

### Task 3: Librería de componentes (fila superior)

**Files:**
- Modify: `design-artifacts/tubi-wireframes.pen`

Colocar componentes en `y ≈ -700` (arriba de la fila de pantallas y = 80), creciendo a la derecha con `FindEmptySpace`.

Cada componente: `type: "frame"`, `reusable: true`, `name` exacto de la tabla. Capturar IDs devueltos (map name→id) y **guardarlos en el plan de sesión** (Print al final).

- [ ] **Step 1: `StatusBar`**

Frame horizontal 375×44, padding `[12, 20]`, justify `space_between`, align `center`, fill transparent.
- Text “9:41”, DM Sans 13/600, fill `$ink`
- Frame de iconos (signal/wifi/battery) Lucide 16, fill `$ink`

- [ ] **Step 2: `AppHeader`**

Frame horizontal width 375, height fit, padding `[8, 20]`, align `center`, justify `space_between`, gap 8.
- `IconBtn` back opcional (slot: ícono chevron-left); por default enabled.
- Text wordmark “Tubi”, Fraunces 20/600, `$ink`
- Chip rol: frame pill fill `$surface-2`, padding `[6, 10]`, text DM Sans 12/500 `$ink-muted` content “Pasajero”

- [ ] **Step 3: `ProgressDots`**

Frame horizontal gap 8, align center.
- 3 ellipses 8×8: 1° fill `$accent`, 2° y 3° fill `$border`

- [ ] **Step 4: `BtnPrimary` / `BtnSecondary` / `BtnDanger` / `IconBtn`**

| Name | size | fill | text |
|---|---|---|---|
| BtnPrimary | w fill o 335, h 52, radius 14 | `$accent` | DM Sans 17/600 `$on-accent` “Continuar” |
| BtnSecondary | same h, radius 14, stroke `$border` width 1 | transparent / `$surface` | 17/600 `$ink` “Secundario” |
| BtnDanger | h 52, radius 14 | `$danger-soft` | 17/600 `$danger` “Rechazar” |
| IconBtn | 44×44, radius 12 | `$surface-2` | Lucide icon `$ink` |

- [ ] **Step 5: `BottomCTA`**

Frame vertical width 375, padding `[12, 20, 24, 20]`, gap 8, fill `$bg`.
- child: instance/ref pattern — primary button full width
- optional secondary text button below (ghost)

Implementar como frame con un `BtnPrimary` hijo (no nested reusable obligatorio si Pencil complica refs anidados; documentar IDs).

- [ ] **Step 6: `Field`**

Frame vertical width 335, gap 6.
- label text 12/500 `$ink-muted` “Label”
- input frame h 52, radius 12, fill `$surface-2`, stroke `$border` 1, padding `[0, 14]`, align center start: value text 16/500 `$ink` “Valor”

- [ ] **Step 7: `Segmented`**

Frame horizontal h 44, radius 12, fill `$surface-2`, padding 4, gap 4, width 335.
- 2 segments: activo fill `$surface` + text `$ink` 600; inactivo text `$ink-muted`

- [ ] **Step 8: `StatusPill`**

Frame pill padding `[6, 10]`, radius 999, fill `$sage-soft`.
- text 12/600 `$sage` “Confirmada”

(Las variantes se logran por override de fill/text en instancias.)

- [ ] **Step 9: `TripCard`**

Frame vertical width 335, padding 16, gap 8, radius 16, fill `$surface`, stroke `$border` 1,
effect shadow `{type:"shadow", shadowType:"outer", offset:{x:0,y:4}, blur:16, color:"#1C19170F"}`.
- row: ruta Fraunces 18/600 `$ink` “Tandil → Bs.As.” + chevron
- row: hora 14 `$ink-muted` · asientos · precio 16/600 `$ink`

- [ ] **Step 10: `InfoRow`**

Horizontal width 335, gap 12, align center.
- Lucide 20 `$ink-muted`
- col: label 12 `$ink-muted` + value 15/500 `$ink`

- [ ] **Step 11: `EmptyHint`**

Vertical align center, gap 8, width 335.
- icon 28 `$ink-muted`
- text 14 `$ink-muted` center “No hay viajes para esta fecha”

- [ ] **Step 12: `QRPass`**

Frame vertical width 335, padding 20, gap 16, radius 16, fill `$surface`, shadow suave, align center.
- StatusPill “Confirmada”
- ruta Fraunces 22/600
- meta DM Sans 14 muted (hora, nombre)
- frame 200×200 fill `$surface-2` radius 12 (placeholder QR: 3×3 grid de rects oscuros o ícono qr-code grande)
- tip 12 muted “Mostralo al conductor…”

- [ ] **Step 13: `WaitTimer`**

Vertical align center gap 4.
- text Fraunces 40/600 `$ink` “04:12”
- text 12/500 `$ink-muted` “tiempo de espera”

- [ ] **Step 14: `MapPlaceholder`**

Frame width 335 (o fill), height 280, radius 16, fill `$surface-2`, layout vertical center.
- Lucide map-pin 28 `$accent`
- text 14/500 `$ink` “Mapa · ETA 12 min”

- [ ] **Step 15: Print inventario de componentes**

```js
Get(document, (n, c) => c.depth === 0 && n.reusable && Print(n.id, n.name))
```

Guardar la lista name→id para Tasks 4–8.

- [ ] **Step 16: Checkpoint visual**

`TakeScreenshot` de `TripCard`, `QRPass`, `BtnPrimary`, `Field`.

---

### Task 4: Shell común de pantalla (helper mental)

Al rediseñar cada frame `f0xxx`:

1. `Update(frameId, { fill: "$bg", layout: "vertical", width: 375, height: 812, clip: true, padding: 0, gap: 0 })`
2. **Vaciar hijos** del frame: listar children depth 1 y `Delete` cada uno (no Delete el frame raíz).
3. Insertar estructura base:

```
StatusBar (ref)
AppHeader (ref, override rol)
Content (frame vertical fill_container, padding [0,20], gap 24)  // o padding top 8
// ... contenido específico
BottomCTA o safe area bottom 24 si no hay CTA
```

4. Fonts: Fraunces solo títulos/display; DM Sans todo lo demás. Nunca dejar Inter residual en nodos nuevos.
5. Un solo `BtnPrimary` de acción por pantalla.

Helper de borrado seguro en execute:

```js
function clearScreen(id) {
  const kids = Get(id, { depth: 1 }).children || []
  for (const k of kids) Delete(k.id)
  Update(id, {
    fill: "$bg",
    layout: "vertical",
    width: 375,
    height: 812,
    clip: true,
    padding: 0,
    gap: 0
  })
}
```

---

### Task 5: Pantallas pasajero (1–7)

**Files:** Modify frames `f0028` … `f0193` in `tubi-wireframes.pen`

- [ ] **Step 1: Frame 1 Registro (`f0028`) — wizard paso nombre**

Contenido:
- StatusBar + AppHeader rol Pasajero
- ProgressDots (paso 1 activo)
- Título Fraunces 28 “¿Cómo te llamás?”
- Un `Field` label “Nombre” value “Ana Pérez”
- spacer fill
- BottomCTA primary “Continuar”
- secondary text “Ya tengo cuenta”

- [ ] **Step 2: Frame 2 Búsqueda (`f0059`)**

- Título Fraunces 28 “¿A dónde vas?”
- Card surface: Field origen “Tandil”, botón swap IconBtn, Field destino “Buenos Aires”
- Chips fecha (activo accent-soft): “Hoy”, “Mañana”, “25 ago”
- Field o chip horario “07:00”
- BottomCTA “Buscar”

- [ ] **Step 3: Frame 3 Resultados (`f0092`)**

- Header + subtítulo fecha “Martes 25 ago”
- Lista 2–3 `TripCard` (overrides de hora/asientos/precio)
- gap 12

- [ ] **Step 4: Frame 4 Detalle (`f0119`)**

- Hero: ruta Fraunces 28 + hora 16 muted
- InfoRows: conductor, vehículo (patente/color), capacidad
- Timeline paradas (dots + labels Tandil · Rauch · Flores · Bs.As.)
- BottomCTA precio a la izquierda opcional + “Reservar”

- [ ] **Step 5: Frame 5 Checkout seña (`f0143`) — wizard paso 2/3**

- ProgressDots paso 2 activo
- Título “Seña de compromiso”
- Monto Fraunces 40 “$5.000” + caption “ejemplo · según settings”
- Card datos transferencia demo (alias/CBU placeholder)
- Copy 14 muted: “Transferí la seña y subí el comprobante. Te confirmamos a mano.”
- BottomCTA “Continuar” (hacia paso comprobante; el frame representa el paso de pago)

- [ ] **Step 6: Frame 6 QR (`f0175`)**

- Chrome mínimo (StatusBar + header compacto)
- `QRPass` centrado
- BtnSecondary / text “Cancelar reserva”
- hint devolución 12 muted

- [ ] **Step 7: Frame 7 Seguimiento (`f0193`)**

- MapPlaceholder height ~360 width fill (padding 20)
- Sheet surface radius 24 padding 20: ETA Fraunces 28, próxima parada, InfoRow conductor

- [ ] **Step 8: Screenshots pasajero**

`TakeScreenshot` de f0028, f0143, f0175, f0092.

---

### Task 6: Pantallas conductor (8–13)

**Files:** Modify `f0221` … `f0329`

- [ ] **Step 1: Frame 8 Registro conductor (`f0221`)**

Wizard paso 1: “¿Cómo te llamás?” + Field nombre + ProgressDots + CTA Continuar. Header rol Conductor.

- [ ] **Step 2: Frame 9 Viajes del día (`f0239`)**

Título “Tus viajes de hoy”. Lista filas (hora | ruta | “3/4” | chevron) en cards o rows con gap 12.

- [ ] **Step 3: Frame 10 Recogida (`f0264`)**

- “1 · Tandil centro” Fraunces 22
- pasajero “Ana Pérez”
- copy espera 5 min
- `WaitTimer` “04:12”
- BottomCTA primary “Escanear QR”
- BtnDanger o secondary “Marcar no-show”
- preview “Siguiente · Av. Colón 800”

- [ ] **Step 4: Frame 11 Escanear QR (`f0282`)**

- Área cámara fill_container fill `#1C1917` o surface-2 oscuro suave, frame de mira radius 16 stroke on-accent
- tip inferior “Apuntá al código del pasajero”
- banner superior opcional sage-soft “Listo para escanear”

- [ ] **Step 5: Frame 12 Saldo (`f0305`)**

- Nombre pasajero
- monto Fraunces 40 (ejemplo saldo)
- `Segmented` Efectivo | Transferencia
- BottomCTA “Confirmar abordado”

- [ ] **Step 6: Frame 13 En ruta (`f0329`)**

- MapPlaceholder
- pill “GPS activo” sage
- lista pasajeros a bordo
- BottomCTA “Finalizar viaje”
- Sin UI de incidentes

- [ ] **Step 7: Screenshots conductor**

f0264, f0282, f0305.

---

### Task 7: Pantallas operador (14–15)

**Files:** Modify `f0351`, `f0391`

- [ ] **Step 1: Frame 14 Confirmar seña (`f0351`)**

- Header rol Operador
- Card: “Ana Pérez · 07:00 Tandil→Bs.As.” + pill “Pendiente”
- Preview comprobante (frame h 160 surface-2 + ícono image)
- Row botones: BtnDanger “Rechazar” + BtnPrimary “Confirmar” (horizontal gap 12; primary es el de acento)

- [ ] **Step 2: Frame 15 Settings (`f0391`)**

Grupos con título 12/600 muted uppercase o title case:
- Tarifas: precio base, comisión
- Seña: monto
- Espera: minutos
- Devolución: >24h / 12–24h / <12h (valores ejemplo)
- Flags: ratings off

Cada fila: label + valor a la derecha en surface card agrupada radius 16.

- [ ] **Step 3: Screenshot operador**

f0351, f0391.

---

### Task 8: QA global + previews

**Files:**
- Modify: `.pen` si hay fixes
- Create/Update: `design-artifacts/previews/*.png`

- [ ] **Step 1: Checklist automático parcial**

```js
// 1) No teal wireframe as accent on text/buttons hard-coded
Get(document, n => {
  if (n.fill === "#0D9488" || n.fill === "#CCFBF1") Print("TEAL_LEFT", n.id, n.name)
})
// 2) Top-level still 15 screens + components
Get(document, (n, c) => c.depth === 0 && n.type === "frame" && Print(n.id, n.name, n.reusable ? "comp" : "screen"))
// 3) Layout problems
;["f0028","f0059","f0092","f0119","f0143","f0175","f0193","f0221","f0239","f0264","f0282","f0305","f0329","f0351","f0391"]
  .forEach(id => Get(id, (n, c) => c.problems && Print(id, n.name, c.problems)))
```

Expected: sin `TEAL_LEFT` en acentos primarios; 15 screens; problems vacíos o solo decorativos menores.

- [ ] **Step 2: Criterios de aceptación (manual)**

Marcar contra spec §10:
- [ ] Tokens §4 en las 15
- [ ] Componentes reusable en uso
- [ ] Registro pasajero/conductor = wizard + dots
- [ ] Checkout = wizard dots paso 2
- [ ] QR = QRPass
- [ ] Recogida = WaitTimer
- [ ] Fraunces + DM Sans
- [ ] Primary h ≥ 52
- [ ] Copy §7 presente
- [ ] Sin clipping grave

- [ ] **Step 3: Export PNG**

En execute (o CLI si está disponible):

```js
Export(
  ["f0028","f0059","f0092","f0119","f0143","f0175","f0193","f0221","f0239","f0264","f0282","f0305","f0329","f0351","f0391"],
  "png",
  "design-artifacts/previews",
  { scale: 2 }
)
```

Renombrar a `01-pasajero-registro.png` … si Export solo usa ids — hacer rename con bash:

```bash
# ajustar nombres reales devueltos por Export
ls design-artifacts/previews/
```

- [ ] **Step 4: Pedir commit al usuario**

```bash
git add design-artifacts/tubi-wireframes.pen design-artifacts/previews
git commit -S -m "$(cat <<'EOF'
feat(ui): apply Ruta de la siesta hi-fi to P0 Pencil screens

Co-Authored-By: grok-4.5 <noreply@opencode.ai>
EOF
)"
```

---

### Task 9: Actualizar estado de la spec

**Files:**
- Modify: `docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md`

- [ ] **Step 1:** Cambiar `Estado: pendiente de aprobación del usuario` → `Estado: implementado en design-artifacts/tubi-wireframes.pen`
- [ ] **Step 2:** Pedir commit docs al usuario

```bash
git add docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md
git commit -S -m "docs(ui): mark Ruta de la siesta spec as implemented"
```

---

## Self-review (plan vs spec)

| Spec section | Task |
|---|---|
| §4 Tokens | Task 2 |
| §5 Componentes | Task 3 |
| §6 Layouts pasajero | Task 5 |
| §6 Layouts conductor | Task 6 |
| §6 Layouts operador | Task 7 |
| §7 Copy | Tasks 5–7 (strings explícitas) |
| §8 Orden implementación | Tasks 2→3→5→6→7→8 |
| §9 Fuera de alcance | Constraints globales |
| §10 Aceptación | Task 8 |
| Wizards 1 frame + dots | Task 5.1, 5.5, 6.1 |
| No borrar 15 frames | Task 4 clearScreen hijos only |

Sin placeholders TBD. Commits siempre vía usuario con `-S`.

---

## Execution notes for agents

1. Prefer **subagent-driven-development**: un subagente por Task 2–8; review visual entre tasks.
2. Si `Insert` de refs falla por IDs, recrear el control inline **solo en esa pantalla** y anotar deuda; no abandonar el resto de componentes.
3. Pencil no es CSS: no usar `%`, margin, ni alignItems `stretch`/`baseline`.
4. Tras cada pantalla compleja, un `TakeScreenshot` del frame — no del document entero.
5. No ejecutar `git commit` desde el agente.

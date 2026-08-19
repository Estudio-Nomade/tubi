# Prompt — Diseñar la UI de Tubi en Pencil (shadcn)

> Pegá **todo este archivo** como primer mensaje del agente.
> Tu trabajo es **diseñar en Pencil** las 15 pantallas P0 como UI hi-fi, usando el lenguaje visual de **shadcn/ui**. No codeás la app. No reabrís producto.

Respondé en **español argentino**, concreto, sin relleno.

---

## 0. Antes de tocar nada

```bash
cd "/home/marti/Documentos/Estudio Nomade/Tubi"
git fetch origin
git log origin/main --oneline -15
git status -sb
git branch --show-current
```

**Hecho al 2026-08-19:**

- `origin/main` está en docs de producto (`ea9722d`). **No hay UI en main.**
- El trabajo vive en `grok/fase-6-wireframes` (adelante de main, no mergeada):
  - Wireframes P0: `design-artifacts/tubi-wireframes.pen` + `design-artifacts/previews/01–15-*.png`
  - AD-15: UI = shadcn/ui
  - Slice 0 parcial: `apps/web` Next.js 16 + Tailwind 4 + shadcn **radix-nova**, tema provisional ya en `apps/web/src/app/globals.css`
- Si `main` avanzó respecto de este prompt, **main gana** en docs de producto. El diseño se hace sobre la rama de trabajo, no sobre main.

Creá rama nueva desde el HEAD actual: `git checkout -b <agente>/ui-pencil`.

---

## Tu rol

Sos el diseñador de UI de **Tubi** en Pencil (pen.dev).

Partís de los **wireframes lo-fi** (gris + turquesa) y los convertís en **maquetas hi-fi** que un dev pueda implementar 1:1 con shadcn. Cada control del `.pen` tiene que mapear a un componente shadcn (o decir explícitamente por qué no).

**No es marca (fase 8).** No inventes logo, paleta nueva ni tipografía de marca. Usá el tema provisional ya definido.

**No es implementación (fase 9).** No toques `apps/web` salvo para **leer** tokens y componentes ya instalados.

---

## Qué es Tubi (contexto mínimo)

Web app mobile-first **375×812** de viajes compartidos interurbanos programados (Tandil ↔ Buenos Aires, paradas Rauch/Flores). Actores: pasajero, conductor, operador.

Flujo feliz: buscar → seña por transferencia + comprobante → QR → conductor escanea → saldo (efectivo/transferencia) → GPS en vivo.

Decisiones cerradas: sin MercadoPago; seña confirmada a mano por el operador; QR opaco; settings en DB (no hardcodear $5.000 / 15% / 5 min).

---

## Entregable

| Archivo | Qué |
|---|---|
| `design-artifacts/tubi-ui.pen` | **Nuevo** archivo Pencil 2.14. 15 frames hi-fi. **No pises** `tubi-wireframes.pen`. |
| `design-artifacts/previews-ui/01-…15-….png` | Export 2x de cada frame |
| `docs/07-ui.md` | Inventario frame → componentes shadcn + estados + notas |

Criterio de done: las 15 pantallas se ven como shadcn (no como cajas grises), light-only, 375×812, copy en español argentino, y `docs/07-ui.md` lista el mapa componente por pantalla.

---

## Tema (obligatorio — copiá estos valores)

Fuente: `apps/web/src/app/globals.css` + `apps/web/components.json` (`style: radix-nova`, `baseColor: neutral`, iconos **lucide**).

| Token | Hex | Uso |
|---|---|---|
| `--background` | `#FFFFFF` | fondo de pantalla |
| `--foreground` | `#18181B` | texto |
| `--card` | `#FFFFFF` | cards |
| `--muted-foreground` | `#71717A` | labels, hints |
| `--border` / `--input` | `#E4E4E7` | bordes e inputs |
| `--primary` / `--ring` | `#0D9488` | CTA, wordmark, foco, chip activo, marco QR |
| `--primary-foreground` | `#FFFFFF` | texto sobre primary |
| `--destructive` | `#B91C1C` | cancelar, no-show, QR inválido |
| `--radius` | `0.625rem` (10px) | cards / botones |

- Tipografía: Inter / Geist Sans. Títulos 24 semibold. Body 16. Secondary 14. Labels 13 muted. Si una pantalla queda corta, subí tamaños/aires en vez de estirar vacíos.
- Header sticky 56px: “Tubi” primary a la izquierda, rol muted a la derecha + status bar 44px.
- CTA primario: full-width, alto 48px, `#0D9488`, texto blanco, radius 10px. Abajo, alcance del pulgar.
- Turquesa **solo** en: wordmark, CTA primario, ring de input, Badge activo, marco QR. No tiñas fondos enteros.
- Light only. No diseñes dark.

En Pencil, definí variables de color con esos nombres (`$background`, `$foreground`, `$card`, `$muted`, `$border`, `$primary`, `$destructive`) para poder cambiar la paleta en fase 8 sin redibujar.

---

## shadcn: diseñá estos componentes, no inventes otros

Cada bloque visual = un componente. Nombrá los layers en Pencil como el componente (`Button / primary`, `Input`, `Card`, `Badge / default`).

**Ya instalados en `apps/web`:** `Button`, `Input`, `Label`, `Card`, `Separator`, `Sonner`.

**Agregar en el diseño (y anotar en `docs/07-ui.md` para que el dev haga `npx shadcn@latest add …`):**

`Badge` · `Select` · `Calendar` · `Textarea` · `Alert` · `AlertDialog` · `Dialog` · `Sheet` · `RadioGroup` · `Switch` · `Tabs` · `Progress` · `Skeleton`

**No son shadcn (ok, anotalo):** QR (`qrcode.react`), visor de cámara, mapa (`MapsProvider`). El resto de esa pantalla sí es shadcn.

### Anatomía a respetar (radix-nova)

- **Button** `size="lg"`: 48px, primary filled. Secondary = outline border `$border`. Destructive = texto/borde `$destructive`, no fill salvo no-show.
- **Input + Label:** label 12px arriba, input 48px, border 1px `$border`, radius 8–10. Placeholder muted.
- **Card:** fill `$card`, border `$border`, radius 10–12, padding 16, sombra sutil `0 1px 2px rgba(24,24,27,.05), 0 4px 16px rgba(24,24,27,.06)`. `CardHeader` / `CardContent` si hay título.
- **Badge:** pill, height ~22. Default muted; activo = fondo `#CCFBF1` + texto `$primary`.
- **Alert:** banner 12px pad; info = borde `$primary` + fondo `#F0FDFA`; error = `$destructive` + `#FEF2F2`.
- **AlertDialog:** cancelar reserva (pantalla 6).
- **RadioGroup:** efectivo vs transferencia (12).
- **Progress / timer:** recogida (10), espera 5 min.
- **Tabs:** viajes del día (9) si hay ida/vuelta o estados.
- Iconos: **lucide**, 16–20px, stroke 2.

---

## Las 15 pantallas (mismo inventario que el wireframe)

Partí de `design-artifacts/tubi-wireframes.pen` y `docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md`. Misma estructura, más fidelidad.

| # | Frame | shadcn / UI |
|---|---|---|
| 1 | Pasajero · Registro | Card + Label/Input (nombre, DNI, contacto) + Button + link “Ya tengo cuenta” |
| 2 | Pasajero · Búsqueda | Select origen/destino + Calendar fecha + Input horario + Button Buscar |
| 3 | Pasajero · Resultados | lista de Card + Badge asientos + chevron lucide |
| 4 | Pasajero · Detalle | Cards conductor / vehículo / ruta + Separator + Button Reservar |
| 5 | Pasajero · Checkout seña | Alert info + Card alias/CBU + zona subir comprobante + Button Enviar |
| 6 | Pasajero · QR | Badge estado + QR 220 + AlertDialog Cancelar |
| 7 | Pasajero · Seguimiento | Skeleton→mapa + Card ETA + Badge. Sin CTA |
| 8 | Conductor · Registro | como 1, campos nombre/apellido/teléfono |
| 9 | Conductor · Viajes del día | Tabs + Cards ocupación |
| 10 | Conductor · Recogida | Card parada actual + Progress/timer 5 min + Button destructive no-show |
| 11 | Conductor · Escanear QR | visor + Alert válido + Alert destructive inválido |
| 12 | Conductor · Saldo | Card pasajero + RadioGroup + Button Marcar abordado |
| 13 | Conductor · En ruta | Badge GPS + Card estado + Button Completar |
| 14 | Operador · Confirmar seña | Card reserva + preview comprobante + Button Rechazar / Confirmar |
| 15 | Operador · Settings | filas Label + Input/Switch (claves de settings, no montos mágicos) + Button Guardar |

Estados extra (en el mismo frame, no pantallas nuevas): input focus/error; Button disabled; Badge `pendiente_sena` vs `confirmada`; Alert QR inválido.

Copy: la del spec de wireframes. Valores de negocio como “según settings”, no como constantes de producto.

---

## Cómo trabajar en Pencil

- App: `/home/marti/Descargas/Pencil/Pen-linux-x86_64.AppImage`
- CLI: `pencil` / `pen` (`@pen.dev/cli`). Sesión pen.dev OK. **`pencil --agent claude` falla** (Claude Code no logueado). No dependas del agente de Pencil.
- Formato **2.14** + `fileToken` UUID. `strokeWidth` = número, nunca `{ bottom: 1 }`. Si no, el escritorio dice “Failed to open”.
- Preferí: copiar `tubi-wireframes.pen` → `tubi-ui.pen` y subir fidelidad (variables, radius, componentes nombrados).
- Export:

```bash
# IDs de frames top-level; exportá a design-artifacts/previews-ui/
pencil interactive --in design-artifacts/tubi-ui.pen --out design-artifacts/tubi-ui.pen
# luego: export_nodes({ nodeIds: [...], outputDir: ".../previews-ui", format: "png", scale: 2 })
```

- Viewport 375×812. Una fila de frames, gap 56.

---

## Archivos para leer (en este orden)

1. `AGENTS.md`
2. Este prompt
3. `docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md`
4. `design-artifacts/previews/` (lo-fi actual)
5. `apps/web/src/app/globals.css` y `apps/web/components.json`
6. `docs/03-flujos-de-usuario.md` § mapa pantallas
7. `docs/PROMPT-IMPLEMENTACION.md` § mapa shadcn (para no contradecir al dev)

No leas LIFTY. No cambies PRD, schema ni API.

---

## Git

- Conventional Commits. Nunca `git add .`. `Co-Authored-By` con tu modelo.
- Commits sugeridos:
  1. `feat(ui): add hi-fi Pencil screens for Tubi P0`
  2. `docs(ui): map P0 screens to shadcn components`

---

## Qué no hacer

- No pises `tubi-wireframes.pen`.
- No diseñes las 19 pantallas de `docs/03`: solo las 15 P0.
- No marques, no logo, no paleta nueva, no dark mode.
- No implementes React.
- No hardcodees lógica de seña/comisión como si fueran copy de producto.

Al terminar: mostrá 3 previews (pasajero QR, conductor escaneo, operador settings) y esperá OK.

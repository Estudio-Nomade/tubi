# Tubi — UI “Ruta de la siesta” (fase 7)

**Producto:** Tubi, viajes compartidos interurbanos Tandil ↔ Buenos Aires.  
**Fecha:** 2026-08-19  
**Estado:** implementado en `design-artifacts/tubi-wireframes.pen`  
**Base:** wireframes P0 en `design-artifacts/tubi-wireframes.pen` (`docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md`)  
**Entregable:** mismo archivo `.pen` actualizado (tokens + componentes reutilizables + pantallas hi-fi en piel “Ruta de la siesta”).  
**Inventario canvas (2026-08-19):** **25 pantallas** (15 P0 + homes + gaps de flujo). Ver §6.

## 1. Objetivo

Elevar los wireframes funcionales a una UI **cálida, local y legible**, con design system reutilizable y mejor composición (especialmente formularios), sin reabrir flujos del PRD ni cerrar marca final (fase 8).

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Personalidad | Cálida y local (“viaje de confianza entre ciudades”) |
| Enfoque visual | **A — Ruta de la siesta** |
| Alcance de trabajo | Piel + componentes + **composición mejorada** (no solo recolor) |
| Formularios largos | **Wizard paso a paso** (registro pasajero/conductor, checkout seña) |
| Modo de color | **Claro cálido** (un solo tema en esta pasada) |
| Cobertura | Base 15 P0 + homes + pantallas de gap de flujo (login, seña en revisión, resultado escaneo, cuenta); los 3 roles al mismo nivel de cuidado visual |
| Viewport | 375 × 812, mobile-first |
| Archivo | Un solo `.pen`: `design-artifacts/tubi-wireframes.pen` |
| Marca final | Fuera de alcance (logo, dominio, naming legal → fase 8). Wordmark tipográfico “Tubi” alcanza. |
| Valores de negocio | Ejemplos de demo (`$5.000`, `5 min`); la fuente de verdad en producto es `settings`, no hardcode en lógica |

## 3. Qué se conserva del wireframe P0

- Inventario de **15 frames** y actores (ver spec 2026-08-18).
- Flujos y copy de negocio clave (seña por transferencia, QR, espera 5 min, no-show, confirmación manual de seña).
- Estructura de información por pantalla (qué datos se muestran), no el layout plano actual.

**Wizards vs cantidad de frames:** el inventario sigue en 15. Cada pantalla wizard del inventario muestra **un paso representativo** (el más característico) con `ProgressDots` indicando el total de pasos. No se multiplican frames por cada paso del wizard en esta pasada (evita explotar el canvas). Pasos representativos por defecto:

- Registro pasajero → paso 1 (nombre), dots 1/3
- Registro conductor → paso 1 (nombre), dots 1/3
- Checkout seña → paso 2 (monto + transferencia), dots 2/3

Si en implementación conviene un frame extra por paso, se puede agregar sin cambiar el resto de la spec.

## 4. Tokens

### 4.1 Color

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#F7F3EC` | Fondo de app |
| `surface` | `#FFFCF7` | Cards, sheets, headers elevados |
| `surface-2` | `#EFE8DC` | Inputs, chips inactivos, filas secundarias |
| `ink` | `#1C1917` | Texto principal e iconos fuertes |
| `ink-muted` | `#78716C` | Labels, hints, meta |
| `border` | `#E7E0D4` | Divisores y bordes suaves |
| `accent` | `#C45C26` | CTA primario, foco, estados activos (terracota) |
| `accent-soft` | `#F3E0D4` | Fondos de acento, pills pendientes |
| `on-accent` | `#FFFCF7` | Texto/ícono sobre `accent` |
| `sage` | `#5F7A61` | Éxito / confirmado |
| `sage-soft` | `#E4EDE5` | Fondo éxito |
| `danger` | `#B42318` | Error, no-show, rechazar |
| `danger-soft` | `#FCEBEA` | Fondo error |

Sustituye la paleta wireframe (zinc + teal `#0D9488`).

### 4.2 Tipografía

| Rol | Familia | Pesos | Tamaños |
|---|---|---|---|
| Display | **Fraunces** | 600 | 28 pantalla hero; 40 timer; montos destacados |
| UI | **DM Sans** | 400 / 500 / 600 | 12 caption · 14 body · 16 body-strong · 17 button · 18 card title · 22 section title |

- Títulos de pantalla y momentos emocionales (ruta, “Tu reserva”, countdown): Fraunces.
- Labels, body, botones, settings: DM Sans.
- Evitar Inter como familia principal (queda solo si un glifo no carga; no es el look).

### 4.3 Espaciado, radio, elevación

- Grid base **4 / 8**. Padding horizontal de pantalla **20**. Gap entre secciones **24**.
- Radios: controles **12** · cards **16** · sheets/modals **24** · pills **999**.
- Sombra de card elevada (única, suave): offset `(0, 4)`, blur `16`, color `rgba(28,25,23,0.06)`.
- Sin gradientes decorativos ni glassmorphism agresivo.
- Un solo CTA primario por pantalla. Altura táctil mínima **44**; botones primarios **52**.

### 4.4 Estados (StatusPill)

| Estado | Fondo | Texto |
|---|---|---|
| Confirmada / OK | `sage-soft` | `sage` |
| Pendiente seña / en revisión | `accent-soft` | `accent` |
| En ruta / programado | `surface-2` | `ink` |
| Cancelada / no-show / error | `danger-soft` | `danger` |

## 5. Componentes reutilizables (Pencil `reusable: true`)

Construir primero en una fila de librería arriba del canvas; las pantallas instancian con `ref`.

| Componente | Responsabilidad |
|---|---|
| `StatusBar` | Hora + indicadores; ink sobre `bg` |
| `AppHeader` | Back opcional · wordmark “Tubi” (Fraunces) · chip de rol |
| `ProgressDots` | Wizard: activo `accent`, resto `border` |
| `BottomCTA` | Barra inferior: primary obligatorio; secondary ghost opcional |
| `Field` | Label 12 muted · input h 52 · fill `surface-2` · border sutil · focus ring `accent` |
| `Segmented` | 2–3 opciones (efectivo/transferencia, etc.) |
| `TripCard` | Ruta (Fraunces ~18) · hora · asientos · precio · chevron; hit area completa |
| `InfoRow` | Ícono + label + valor |
| `StatusPill` | Estados de §4.4 |
| `EmptyHint` | Ícono suave + texto corto (sin ilustración pesada) |
| `BtnPrimary` / `BtnSecondary` / `BtnDanger` / `IconBtn` | Acciones estándar |
| `QRPass` | Boarding pass: ruta, hora, pasajero, QR hero, pill |
| `WaitTimer` | Countdown Fraunces 40 + label de política de espera |
| `MapPlaceholder` | Bloque redondeado con pin + ETA (sin mapa real) |

**Iconografía:** Lucide, stroke ~1.75, color `ink` o `ink-muted`.

**Reglas de composición**

- No apilar card dentro de card sin motivo.
- CTA de acción principal siempre al fondo (`BottomCTA`) en flujos de commit.
- Listas con aire: gap ≥ 12 entre items; no filas densas tipo planilla.
- Formularios multi-campo del P0 pasan a **wizard** (ver §6); settings puede seguir en una pantalla agrupada.

## 6. Layouts por pantalla

### Pasajero (fila canvas P1–P12)

| # | Frame | Contenido |
|---|---|---|
| P1 | Registro | Wizard 3 pasos + `ProgressDots`. Un campo foco: Nombre → DNI → Contacto. CTA Continuar / Crear cuenta. Link “Ya tengo cuenta”. |
| P2 | Home empty | Sin reserva. `EmptyHint` + CTA “Buscar viaje”. TabBar. |
| P3 | Búsqueda | “¿A dónde vas?”. Origen/destino + swap. Chips fecha. Horario. CTA Buscar. TabBar. |
| P4 | Resultados | Fecha + lista `TripCard`. TabBar. |
| P5 | Detalle | Hero ruta/hora. `InfoRow` conductor/vehículo. Timeline paradas. CTA Reservar. |
| P6 | Checkout seña | Wizard representativo (monto + transferencia). Copy confirmación manual. |
| P7 | Home | Hero reserva activa + CTA Ver mi QR / Completar seña. TabBar. |
| P8 | QR | `QRPass` centrado. Cancelar + política. TabBar. |
| P9 | Seguimiento | `MapPlaceholder` + sheet ETA/parada/conductor. |
| **P10** | **Login** | Email o teléfono + CTA Continuar + link Crear cuenta. Sin TabBar. |
| **P11** | **Seña en revisión** | Pill Pendiente. Monto seña. ETA confirmación demo. CTA Ir al inicio. Puente checkout → QR. |
| **P12** | **Cuenta** | Avatar, DNI/contacto/email, Cerrar sesión. TabBar Cuenta activo. |

### Conductor (fila canvas C1–C11)

| # | Frame | Contenido |
|---|---|---|
| C1 | Registro | Wizard nombre (representativo). |
| C2 | Home empty | Sin viajes hoy. |
| C3 | Home | Viaje hoy + Empezar recogida + TabBar 3 ítems. |
| C4 | Viajes del día | Agenda. TabBar Viajes activo. |
| C5 | Recogida | Parada hero + `WaitTimer` + Escanear / No-show. |
| C6 | Escanear QR | Visor + tip. |
| C7 | Saldo | Monto + `Segmented` + Confirmar abordado. |
| C8 | En ruta | Mapa + GPS + Finalizar. Sin incidentes. |
| **C9** | **Escaneo OK** | Check sage. Datos pasajero. CTA Confirmar abordado → saldo. |
| **C10** | **Escaneo inválido** | Error danger. Banner no autorizado. CTA Escanear de nuevo / Volver a recogida. |
| **C11** | **Cuenta** | Datos + vehículo (patente/modelo). Cerrar sesión. TabBar Cuenta activo. |

### Operador

| # | Frame | Contenido |
|---|---|---|
| O1 | Confirmar seña | Card reserva + preview comprobante. Rechazar / Confirmar. |
| O2 | Settings | Grupos tarifas, seña, espera, devolución, flags. |

**Nota StatusBar:** no se usa barra de sistema (web app). Chrome = `AppHeader` con padding superior ~16px.

## 7. Copy (español argentino)

Se mantienen y se priorizan estos mensajes:

- Recogida: “Espera máxima 5 min. Si no llega, no-show y seguís.”
- QR: “Mostralo al conductor. No compartas esta pantalla.”
- Checkout: “Transferí la seña y subí el comprobante. Te confirmamos a mano.”
- Seña en revisión: “Recibimos el comprobante. Te confirmamos a mano en cuanto lo revisemos.”
- Escaneo inválido: “Esta reserva no corresponde a este viaje, conductor o vehículo.”
- Wizard: títulos en segunda persona, cortos, sin jerga de trámite.

Montos y tiempos en UI son **ejemplos de demo**; etiquetar visualmente o en nota de frame cuando ayude (“según settings”).

## 8. Orden de implementación en Pencil

1. Actualizar `SetVariables` con la nueva paleta (deprecar/reemplazar tokens wireframe).
2. Crear fila de componentes reutilizables arriba del canvas.
3. Rediseñar pantallas en orden de riesgo visual: Registro → Checkout → QR → Resultados/Detalle → Recogida/Timer → resto pasajero → conductor → operador.
4. Verificar contraste texto/fondo, tap targets, y que no haya overflow en 375×812.
5. No borrar frames: **actualizar in-place** los 15 existentes para no romper referencias del plan P0.

## 9. Fuera de alcance

- Logo ilustrado, naming legal, dominio (fase 8).
- Tema oscuro / multi-theme.
- Código front (fase 9).
- Pantallas P1 (historial, dashboard operador completo, ratings, DNI automatizado).
- Mapa real / cámara real (placeholders).
- Consulta o copia desde LIFTY sin pedido explícito.

## 10. Criterios de aceptación

- [x] Tokens del §4 aplicados (sin teal wireframe residual como acento primario).
- [x] Componentes del §5 existen como `reusable` y se usan en pantallas.
- [x] Registro pasajero y conductor son wizard (paso representativo + dots).
- [x] Checkout seña es wizard representativo.
- [x] QR usa `QRPass` con jerarquía tipo boarding pass.
- [x] Recogida muestra `WaitTimer` legible y CTAs claros.
- [x] Tipografía Fraunces + DM Sans visible en títulos vs UI.
- [x] Un primary CTA por pantalla de acción; altura ≥ 52 en primarios.
- [x] Copy de negocio del §7 presente donde corresponde.
- [x] Viewport 375×812 sin clipping grave de contenido principal.
- [x] Gaps de flujo: Login, Seña en revisión, Escaneo OK/inválido, Cuenta pasajero/conductor.

## 11. Relación con el roadmap

- Cumple **fase 7** (Diseño UI / design system) del `docs/00-roadmap.md`.
- No adelanta fase 8 (marca) ni fase 9 (código).
- La spec de wireframes P0 sigue siendo el inventario de pantallas; esta spec la **supera en piel y composición**.

# Tubi — UI “Ruta de la siesta” (fase 7)

**Producto:** Tubi, viajes compartidos interurbanos Tandil ↔ Buenos Aires.  
**Fecha:** 2026-08-19  
**Estado:** implementado en `design-artifacts/tubi-wireframes.pen`  
**Base:** wireframes P0 en `design-artifacts/tubi-wireframes.pen` (`docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md`)  
**Entregable:** mismo archivo `.pen` actualizado (tokens + componentes reutilizables + 15 pantallas rediseñadas en piel y composición)

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
| Cobertura | **15 pantallas**, los 3 roles al mismo nivel de cuidado |
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

### Pasajero

1. **Registro** — Wizard 3 pasos + `ProgressDots`. Un campo foco por paso: Nombre → DNI → Contacto. Título Fraunces conversacional (ej. “¿Cómo te llamás?”). `BottomCTA` “Continuar” / último “Crear cuenta”. Link “Ya tengo cuenta” como secondary.
2. **Búsqueda** — Título “¿A dónde vas?”. Card con origen/destino + control swap. Chips de fecha. Horario. CTA “Buscar”.
3. **Resultados** — Cabecera con fecha. Lista de `TripCard`. `EmptyHint` si no hay viajes.
4. **Detalle** — Hero ruta + hora (Fraunces). `StatusPill` si aplica. Bloque conductor/vehículo (`InfoRow`). Timeline vertical de paradas. Precio + CTA “Reservar” en `BottomCTA`.
5. **Checkout seña** — Wizard: (A) resumen viaje (B) monto seña en display + datos transferencia demo (C) subir comprobante + “Enviar”. Copy: confirmación manual del operador.
6. **QR** — Mínimo chrome. `QRPass` centrado. Secondary “Cancelar reserva” + hint de política de devolución.
7. **Seguimiento** — `MapPlaceholder` ~45% superior. Sheet inferior: ETA, próxima parada, conductor.

### Conductor

8. **Registro** — Wizard: Nombre → Apellido → Teléfono (mismo patrón que pasajero).
9. **Viajes del día** — Lista agenda: hora | ruta | cupos | chevron.
10. **Recogida** — Parada actual hero + pasajero. `WaitTimer`. CTA “Escanear QR” y secondary “Marcar no-show”. Preview de siguiente parada.
11. **Escanear QR** — Visor full-bleed + tip “Apuntá al código del pasajero”. Banner de resultado válido/rechazado (no pantalla extra salvo el estado en el mismo frame).
12. **Saldo** — Nombre + monto grande. `Segmented` efectivo/transferencia. Confirmar abordado.
13. **En ruta** — Mapa + pasajeros a bordo + indicador GPS activo. CTA “Finalizar viaje”. Sin flujo de incidentes en P0 (queda fuera, igual que wireframes).

### Operador

14. **Confirmar seña** — Card de reserva + preview comprobante. `BtnDanger` Rechazar + `BtnPrimary` Confirmar.
15. **Settings** — Grupos con título de sección (tarifas, seña, espera, devolución, flags). Filas label + valor; look de lista iOS/settings, no tabla densa.

## 7. Copy (español argentino)

Se mantienen y se priorizan estos mensajes:

- Recogida: “Espera máxima 5 min. Si no llega, no-show y seguís.”
- QR: “Mostralo al conductor. No compartas esta pantalla.”
- Checkout: “Transferí la seña y subí el comprobante. Te confirmamos a mano.”
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

- [ ] Tokens del §4 aplicados en las 15 pantallas (sin teal wireframe residual como acento primario).
- [ ] Componentes del §5 existen como `reusable` y se usan en pantallas (no solo duplicados sueltos).
- [ ] Registro pasajero y conductor son wizard (no formulario de 3 campos en una sola vista plana).
- [ ] Checkout seña es wizard de 3 pasos.
- [ ] QR usa `QRPass` con jerarquía tipo boarding pass.
- [ ] Recogida muestra `WaitTimer` legible y CTAs claros.
- [ ] Tipografía Fraunces + DM Sans visible en títulos vs UI.
- [ ] Un primary CTA por pantalla de acción; altura ≥ 52 en primarios.
- [ ] Copy de negocio del §7 presente donde corresponde.
- [ ] Viewport 375×812 sin clipping grave de contenido principal.

## 11. Relación con el roadmap

- Cumple **fase 7** (Diseño UI / design system) del `docs/00-roadmap.md`.
- No adelanta fase 8 (marca) ni fase 9 (código).
- La spec de wireframes P0 sigue siendo el inventario de pantallas; esta spec la **supera en piel y composición**.

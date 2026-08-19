# Tubi — Homes por rol (P0+)

**Producto:** Tubi  
**Fecha:** 2026-08-19  
**Estado:** implementado en `design-artifacts/tubi-wireframes.pen` (frames 16/16b/17/17b + TabBar)  
**Base visual:** UI “Ruta de la siesta” (`docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md`)  
**Canvas:** `design-artifacts/tubi-wireframes.pen`  
**Motivo:** el inventario P0 arranca en pantallas de tarea (búsqueda, viajes del día, confirmar seña) sin un hogar post-login por rol.

## 1. Objetivo

Definir **home** como punto de aterrizaje post-sesión para **pasajero** y **conductor**, con hub de estado (“qué pasa ahora”) + navegación estable por tabs. **Operador** queda fuera de home dedicado en esta pasada.

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Modelo pasajero/conductor | **Hub de estado + navegación** (enfoque A “Momento + tabs”) |
| Modelo operador | Solo cola operativa; **sin home nuevo** (sigue Confirmar seña / Settings) |
| Navegación | **Tab bar solo con sesión** (no en registro/login/wizards de onboarding) |
| Alcance Pencil | **Solo pasajero + conductor** (2 frames home principales; empties como variante en el mismo frame o nota) |
| Estilo | Misma piel Ruta de la siesta (tokens, Fraunces + DM Sans, componentes existentes) |
| Viewport | 375 × 812 |

## 3. Navegación

### 3.1 Pasajero (post-login)

| Tab | Label | Destino |
|---|---|---|
| Inicio | Inicio | **Home pasajero** (nuevo) |
| Buscar | Buscar | Frame búsqueda existente |
| QR | QR | Frame QR / pase; empty si no hay reserva |
| Cuenta | Cuenta | Placeholder mínimo: nombre + cerrar sesión (no historial P1) |

### 3.2 Conductor (post-login)

| Tab | Label | Destino |
|---|---|---|
| Inicio | Inicio | **Home conductor** (nuevo) |
| Viajes | Viajes | Frame viajes del día |
| Cuenta | Cuenta | Placeholder mínimo |

### 3.3 Reglas

- Tras login exitoso: pasajero → Home pasajero; conductor → Home conductor.
- Registro, login y wizards de onboarding: **sin** TabBar.
- Pantallas de flujo profundo (detalle, checkout, recogida, escanear, saldo, en ruta, seguimiento) **pueden** ocultar tabs o mostrar solo back — default P0: **ocultar TabBar** en flujos de commit/operación en curso; volver al home/lista al cerrar el flujo.
- Operador: sin TabBar ni home en esta pasada.

### 3.4 Componente nuevo

**`TabBar`** (`reusable: true`):

- Alto ~64, width 375, fill `$surface`, stroke top `$border` 1, padding horizontal 8.
- Ítems en fila `space_around` / iguales: ícono Lucide 22 + label DM Sans 11.
- Activo: ícono + texto `$accent`. Inactivo: `$ink-muted`.
- Variantes por override de labels/iconos y cuántos ítems (4 pasajero / 3 conductor).

## 4. Home pasajero

### 4.1 Con reserva activa (estado principal a dibujar)

1. StatusBar  
2. Header compacto: wordmark o saludo **“Hola, Ana”** (Fraunces/DM según jerarquía) + chip rol opcional  
3. **Hero card** (`$surface`, radius 16, sombra suave):
   - `StatusPill` (Confirmada / Pendiente seña)
   - Ruta Fraunces (“Tandil → Bs.As.”)
   - Meta: fecha · hora · parada de subida
   - CTA primario según estado:
     - Confirmada → “Ver mi QR”
     - Pendiente seña → “Completar seña”
     - En viaje / en curso → “Ver seguimiento”
4. Atajos secundarios (1–2): “Buscar otro viaje” · hint corto de cancelación si aplica  
5. `TabBar` con Inicio activo  

Copy QR existente se mantiene en la pantalla QR, no hace falta repetirlo entero en home.

### 4.2 Sin reserva (empty)

- `EmptyHint`: “Todavía no tenés un viaje”  
- CTA primario “Buscar viaje” → Búsqueda  
- Misma TabBar; tab QR con empty propio al entrar  

**Representación en Pencil (cerrado):** un frame principal **con reserva**. Empty: frame hermano `16b · Pasajero · Home empty` (mismo shell + TabBar).

**CTA mapping (pasajero hero):** una sola primary visible; el estado de la reserva determina el label y el destino (QR / checkout seña / seguimiento). No mostrar las tres a la vez.

## 5. Home conductor

### 5.1 Con viaje hoy (estado principal)

1. StatusBar + saludo “Hola, {Nombre}” + chip Conductor  
2. **Hero viaje de hoy:**
   - Hora y/o ruta (Fraunces)
   - Cupos “3/4” · vehículo (patente / color)
   - CTA “Empezar recogida” → Recogida  
3. Bloque secundario: preview “Próxima parada” o lista corta de pasajeros (2–3)  
4. `TabBar` Inicio activo  

### 5.2 Sin viajes hoy (empty)

- “No hay viajes asignados hoy”  
- Hint: coordinar con el operador  
- CTA secundario “Ver agenda” → Viajes del día (también vacío)  
- TabBar presente  

**Representación en Pencil (cerrado):** frame principal **con viaje hoy** + hermano `17b · Conductor · Home empty`.

## 6. Inventario Pencil (delta)

| # | Frame (nuevo) | Notas |
|---|---|---|
| 16 | `16 · Pasajero · Home` | Con reserva activa |
| 16b | `16b · Pasajero · Home empty` | Sin reserva |
| 17 | `17 · Conductor · Home` | Con viaje hoy |
| 17b | `17b · Conductor · Home empty` | Sin viajes hoy |

Actualizar pantallas existentes post-login de pasajero/conductor para **incluir TabBar** donde corresponda (Inicio/Buscar/QR/Cuenta o Inicio/Viajes/Cuenta), sin rediseñar de cero el body ya hecho en Ruta de la siesta.

**No agregar** en esta pasada: home operador, inbox, historial, ratings, crear viaje.

## 7. Criterios de aceptación

- [ ] Existen frames Home pasajero y Home conductor 375×812, piel Ruta de la siesta  
- [ ] Existe componente `TabBar` reusable  
- [ ] Home pasajero muestra hero de reserva + CTA a QR/seña/seguimiento  
- [ ] Home conductor muestra viaje de hoy + CTA Empezar recogida  
- [ ] Empty states definidos (dibujados o documentados con variante)  
- [ ] Tab bar no aparece en registro/onboarding  
- [ ] Operador sin home nuevo  
- [ ] Previews PNG de los homes nuevos  

## 8. Fuera de alcance

- Implementación en `apps/web`  
- Dashboard operador / cola multi-item avanzada  
- Deep linking y notificaciones push  
- Marca final (fase 8)  

## 9. Relación con specs previas

- No reemplaza el inventario de 15 pantallas P0; lo **extiende** con 2 homes.  
- Depende de tokens/componentes de `2026-08-19-tubi-ui-ruta-siesta-design.md`.  
- Alinea el flujo “Login → …” de `docs/03-flujos-de-usuario.md` con un destino de aterrizaje explícito.

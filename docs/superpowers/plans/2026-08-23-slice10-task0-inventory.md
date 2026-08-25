# Slice 10 — Task 0 Inventario Pencil O2

**Fuente:** `design-artifacts/tubi-wireframes.pen` · frame **O2 · Settings** `f0391`  
**Fecha:** 2026-08-23

## Viewport

| Prop | Valor |
|---|---|
| Size | 375×812 |
| fill | `$bg` |
| layout | vertical |
| clip | true |

## Estructura

| Nodo | Id | Spec |
|---|---|---|
| AppHeader | `P80mhb` (ref zJbea) | Back 44, brand Tubi Fraunces 20/600, chip “Operador” |
| Content | `pEdV5` | vertical, gap 14, padding [12,20,16,20] |
| Title | `KIqDu` | “Configuración” Fraunces 22/600 `$ink` |

## Secciones (cards surface radius 16 border)

| Sección | Label | Filas (key / caption / valor demo) |
|---|---|---|
| TARIFAS | `AyoDg` | Precio base · Tandil→Bs.As. · $18.000 · Comisión · Sobre el viaje · 15% |
| SEÑA | `COo7I` | Monto de seña · Al reservar · $5.000 |
| ESPERA | `F0kVQQ` | Tiempo de espera · En cada recogida · 5 min |
| DEVOLUCIÓN | `L8WNMh` | >24h 100% · 12–24h 50% · <12h 0% |
| FLAGS | `OhF5o` | Ratings · Feature flag · Off |

## Componentes Ruta de la siesta a reutilizar

- `AppHeader` (`zJbea`) — back + role Operador
- `Field` (`iFTuH`) — inputs editables (wireframe es read-only; producto necesita edición)
- `BtnPrimary` (`TXQO6`) — guardar

## Delta producto vs wireframe

- Wireframe: filas label+valor estáticas.
- Implementación: formularios con `Field` + checkbox flag + CTA “Guardar cambios”.
- Extra vs wireframe: bloque **PAGOS** (banco, alias, CBU, titular) — claves seed 0010.
- Agrupación UI: Tarifa · Reserva (seña + espera + devoluciones) · Pagos transferencia · Flags.

## Mapeo clave → UI

| Clave | Sección | Control |
|---|---|---|
| `tarifa.precio_base_tandil_bsas` | Tarifa | number |
| `comision.plataforma_pct` | Tarifa | number 0–15 |
| `reserva.sena_monto` | Reserva | number |
| `reserva.espera_max_min` | Reserva | number |
| `reserva.devolucion_*_pct` | Reserva | number 0–100 |
| `pagos.transferencia_*` | Pagos | text |
| `feature.ratings_habilitado` | Flags | boolean |

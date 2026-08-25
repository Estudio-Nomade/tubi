# Slice 2A — Task A0 Inventario UI (P2/P3/P4/P5)

**Fecha:** 2026-08-21  
**Fuente:** `docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md` + previews  
`design-artifacts/previews/02|03|04|16b-*.png`  
**Nota:** Pencil MCP no disponible en esta sesión; inventario por spec + nombres de preview.

## Tokens (obligatorios)

| Token | Hex |
|---|---|
| bg | `#F7F3EC` |
| surface / card | `#FFFCF7` |
| surface-2 | `#EFE8DC` |
| ink | `#1C1917` |
| muted | `#78716C` |
| border | `#E7E0D4` |
| accent | `#C45C26` |
| on-accent | `#FFFCF7` |

- Fraunces 600: títulos pantalla / ruta  
- DM Sans: body, labels, botones  
- Padding H 20 · gap secciones 24 · primary h 52 · radius card 16 · control 12  

## Componentes a usar / crear

| Componente | Estado | Uso |
|---|---|---|
| AppHeader | existe | todas |
| TabBar | existe (fix href Buscar → `/pasajero/buscar`) | P2 P3 P4 |
| EmptyHint | existe | P2 |
| BtnPrimary | existe | CTAs |
| Field | existe | búsqueda |
| TripCard | **crear** | P4 |
| StatusPill | **crear** | P5 |
| InfoRow | **crear** | P5 |

## P2 · Home empty (`/pasajero`)

- Header Tubi  
- Título: saludo o “Tu próximo viaje”  
- EmptyHint: sin viaje / “Todavía no tenés un viaje”  
- CTA primary: **Buscar viaje** → `/pasajero/buscar`  
- TabBar: Inicio activo  

## P3 · Búsqueda (`/pasajero/buscar`)

- Título Fraunces: **¿A dónde vas?**  
- Origen / destino (defaults Tandil / Buenos Aires) + swap si cabe  
- Chips fecha: Hoy / Mañana / +2  
- Horario opcional  
- CTA: **Buscar** → query a resultados  
- TabBar: Buscar activo  

## P4 · Resultados (`/pasajero/resultados`)

- Header fecha de búsqueda  
- Lista TripCard: ruta Fraunces, hora, asientos, precio, chevron  
- EmptyHint si no hay viajes  
- TabBar  

## P5 · Detalle (`/pasajero/viajes/[id]`)

- Back + header  
- Hero: ruta + hora (Fraunces)  
- StatusPill estado  
- InfoRow: conductor, vehículo (patente/marca/modelo/color), precio, asientos  
- Timeline paradas ordenadas  
- CTA **Reservar** disabled en 2A (“Próximamente”)  

## Copy fijo

- Búsqueda título: “¿A dónde vas?”  
- Home empty CTA: “Buscar viaje”  
- Detalle CTA (2A): disabled hasta 2B  

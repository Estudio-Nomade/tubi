# G3.0 — Inventory UI operador (cancel viaje + devoluciones)

**Fecha:** 2026-08-25  
**Branch:** `feat/go-live-g3`  
**Fuentes:** previews `14-operador-confirmar-sena.png`, `15-operador-settings.png`; código `/operador` (O1 cards); plan go-live G3.  
**Pencil MCP:** no disponible en sesión — tokens desde previews + DS Ruta de la Siesta.

## Shell

| Token | Valor |
|---|---|
| Viewport | `max-w-[375px] min-h-dvh bg-background` |
| Header | `AppHeader roleLabel="Operador"` (+ back en subpáginas) |
| Título | Fraunces 28/600 |
| Meta | DM 14 muted |
| Card | `rounded-2xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(28,25,23,0.06)]` |
| StatusPill | ok / pending / danger / neutral |
| CTA danger | `BtnDanger` h-13 |
| CTA primary | `BtnPrimary` h-13 |
| Nav home | text links primary/muted (mismo patrón Settings) |

## Pantallas G3

| Ruta | Contenido |
|---|---|
| `/operador` | Señas + nav: Viajes · Devoluciones · Settings |
| `/operador/viajes` | Lista read-only (sin CTA crear) |
| `/operador/viajes/[id]` | Detalle + reservas + Cancelar |
| `/operador/devoluciones` | Cola monto > 0 no saldada |

## Copy

- Empty viajes: “No hay viajes cargados. Pedile al técnico el alta SQL o esperá la pantalla de alta.”
- Confirm cancel: “¿Cancelar este viaje? Se cancelan las reservas abiertas y se registra devolución 100% de señas confirmadas. La plata la transferís vos después desde Devoluciones.”
- Devolución pasajero: “Devolución pendiente: $X.”
- Marcar: “Marqué como transferida”

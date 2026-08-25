# Slice 8 — Task 0 Inventario Pencil (MCP)

**Fuente:** Pencil MCP sobre `design-artifacts/tubi-wireframes.pen`  
**IDs:** C5 `f0264` · WaitTimer `WqVkL`

## C5 · Recogida (`f0264`)

| Elemento | Spec |
|---|---|
| Viewport | 375×812, `$bg`, vertical, clip |
| AppHeader | Back 44, brand Fraunces 20, chip “Conductor” |
| StopTitle | Fraunces 22/600 — parada actual (ej. “1 · Tandil centro”) |
| PassengerName | DM Sans 16/600 |
| WaitCopy | DM 14/500 muted — “Espera máxima N min. Si no llega, no-show y seguís.” |
| WaitTimer | Fraunces 40/600 tabular (`04:12`) + label DM 12 muted “tiempo de espera” |
| Spacer | fill |
| CTA primary | BtnPrimary h52 r14 — “Escanear QR” |
| CTA danger | BtnDanger h52 r14 danger-soft — “Marcar no-show” |
| NextPreview | DM 13/500 muted center — “Siguiente · …” |

## WaitTimer component (`WqVkL`)

| Elemento | Spec |
|---|---|
| Layout | vertical, gap 4, center |
| WaitTime | Fraunces 40/600 `$ink` |
| WaitLabel | DM Sans 12/500 `$ink-muted` “tiempo de espera” |

## Decisiones de implementación

- Ruta: `/conductor/viajes/[id]/recogida/[reservaId]`
- `espera_max_min` desde `settings.reserva.espera_max_min` (server), no hardcode
- Countdown client-side al montar / “Iniciar espera”
- Tras no-show → hub `?ok=noshow`

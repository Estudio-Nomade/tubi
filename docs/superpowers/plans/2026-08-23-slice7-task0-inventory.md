# Slice 7 — Task 0 Inventario Pencil P8 · QR

**Fuente:** Pencil MCP `P8 · QR` `f0175`  
**Fecha:** 2026-08-23

## P8 · QR (confirmada)

| Elemento | Id | Spec |
|---|---|---|
| Viewport | `f0175` | 375×812, `$bg`, layout vertical, clip |
| CompactHeader | `sHOse` | pad [16,20,8,20] gap 12, BackBtn + title |
| HeaderTitle | `Cx1c4` | Fraunces 20/600 “Tu pase” |
| Content | `RpBdF` | fill, center, gap 20, pad [12,20,24,20] |
| QRPass | `i3pWfX` | instancia `itlkI`, status Confirmada |
| **CancelLink** | `Gn0tn` | DM Sans 14/500, `$ink-muted`, center — “Cancelar reserva” |
| **RefundHint** | `bmX5x` | DM Sans 12/normal, `$ink-muted`, center, lineHeight 1.4, fixed-width fill — hint de devolución |
| TabBar | `m2B3Qp` | active QR (accent) |

## Copy wireframe

- CancelLink: `Cancelar reserva`
- RefundHint (ejemplo diseño): `Si cancelás con +2 h de anticipación, te devolvemos la seña.`
- Producto real: hint dinámico según RN-03 + snapshot `politica_cancelacion` (franjas 24h / 12–24h / &lt;12h).

## UI a implementar

- **Pase P8** (`confirmada`): CancelLink + RefundHint debajo del QRPass.
- **Mis reservas**: CTA cancelar en `pendiente_sena` y `confirmada` con confirmación (AlertDialog / confirm nativo + BtnDanger).
- Estilo: Ruta de la siesta — muted link en pase; BtnDanger en diálogo de confirmación.

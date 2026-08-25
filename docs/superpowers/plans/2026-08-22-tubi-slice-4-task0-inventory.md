# Slice 4 — Task 0 Inventario Pencil P8 + QRPass

**Fuente:** `design-artifacts/tubi-wireframes.pen` (MCP Pencil no conectado; dump JSON) + preview `design-artifacts/previews/06-pasajero-qr.png`.

## Tokens (variables del .pen)

| Token | Hex |
|---|---|
| surface | `#FFFCF7` |
| surface-2 | `#EFE8DC` |
| bg | `#F7F3EC` |
| ink | `#1C1917` |
| ink-muted / muted | `#78716C` |
| sage | `#5F7A61` |
| sage-soft | `#E4EDE5` |
| border | `#E7E0D4` |
| accent | `#C45C26` |

## QRPass (`itlkI`) — boarding pass reutilizable

| Elemento | Spec |
|---|---|
| Contenedor | width **335**, fill `$surface` `#FFFCF7`, radius **16**, padding **20**, gap **16**, align center, layout vertical |
| Shadow | outer `#1C19170F`, y:4, blur:16 |
| Pill (QRStatusPill) | fill `$sage-soft`, radius 999, pad `[6, 10]`, label DM Sans **12/600** `$sage` — “Confirmada” |
| Ruta (QRRoute) | Fraunces **22/600** `$ink` — ej. “Tandil → Bs.As.” |
| Meta (QRMeta) | DM Sans **14/500** `$ink-muted` — `{fecha/hora} · {nombre}` |
| QRBox | **200×200**, fill `$surface-2`, radius **12**, center |
| QR real | implementación: `QRCodeSVG` ~180–200 px, alto contraste (placeholder Pencil era icon 120) |
| Tip (QRTip) | width **280**, DM Sans **12/500** muted, center: **“Mostralo al conductor. No compartas esta pantalla.”** |

### Extra producto (plan, no en Pencil base)

Debajo del tip o entre meta y QR, muted 13–14:

- Conductor (nombre)
- Vehículo (patente · marca modelo · color)

## P8 · QR (`f0175`)

| Elemento | Spec |
|---|---|
| Viewport | 375×812, fill `$bg` |
| CompactHeader | pad `[16, 20, 8, 20]`, gap 12, align center: BackBtn + título Fraunces **20/600** “Tu pase” |
| Content | fill, gap **20**, pad `[12, 20, 24, 20]`, justify center, align center |
| QRPass | ref `itlkI`, width fill |
| CancelLink | DM 14/500 muted “Cancelar reserva” — **OMITIR** en este slice (reserva confirmada) |
| RefundHint | DM 12 muted — **OMITIR** (sin cancel) |
| TabBar | ref `alqrj`, ítem QR activo → href `/pasajero/pase` |

## Checklist visual implementación

- [ ] Card surface + shadow + radius 16 + p-20 + gap-16 centrado
- [ ] Pill sage-soft / sage “Confirmada”
- [ ] Ruta Fraunces 22
- [ ] Meta DM 14 muted
- [ ] Caja QR 200×200 surface-2 radius 12
- [ ] QR real del `qr_token` (no icono)
- [ ] Tip exacto del copy Pencil
- [ ] Header “Tu pase” + back
- [ ] Sin Cancelar / sin hint devolución
- [ ] TabBar QR activo

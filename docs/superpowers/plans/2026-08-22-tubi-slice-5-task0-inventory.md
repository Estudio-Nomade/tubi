# Slice 5 — Task 0 Inventario Pencil (MCP)

**Fuente:** Pencil MCP sobre `design-artifacts/tubi-wireframes.pen`  
**IDs:** C2 `ewfc2` · C3 `DOGMp` · C6 `f0282` · C9 `J2LkdG` · C10 `ZSNsT`

## C2 · Home empty

| Elemento | Spec |
|---|---|
| Viewport | 375×812, `$bg` |
| Greeting | Fraunces 28/600 |
| Role | DM 12/500 muted “Conductor” |
| EmptyHint | ref |
| Sub | DM 14 muted “Coordiná con el operador…” |
| Btn | secondary disabled “Ver agenda” (fuera / disabled) |
| TabBar | Inicio / Viajes / Cuenta |

## C3 · Home

| Elemento | Spec |
|---|---|
| HeroCard | surface r16 p16 gap12 shadow |
| When | DM 14 muted |
| Route | Fraunces 22/600 |
| Meta | asientos · vehículo DM 14 muted |
| CTA | BtnPrimary “Empezar recogida” |
| Section | Fraunces 18 “Pasajeros” |
| Row | surface r12 pad 12/14, icon user, nombre 15/500, stop 13 muted |

## C6 · Escanear QR

| Elemento | Spec |
|---|---|
| Banner | sage-soft r12 “Listo para escanear” DM 14/600 sage |
| Camera | `#292524` r16 fill |
| Viewfinder | 220×220 stroke accent 3 |
| Tip | DM 14/500 muted center |

## C9 · Escaneo OK

| Elemento | Spec |
|---|---|
| Badge | 72 sage-soft check sage |
| Title | Fraunces 28 “Reserva válida” |
| Pill | StatusPill (UI: **Verificada**) |
| Card | surface r16, nombre Fraunces 22, InfoRow, meta 13 |
| CTA | BtnPrimary → volver lista (sin saldo en slice) |
| Hint | DM 12 muted saldo próximamente |

## C10 · Escaneo inválido

| Elemento | Spec |
|---|---|
| Badge | 72 danger-soft X |
| Title | Fraunces 28 “QR inválido” |
| Body | DM 14 muted |
| Banner | danger-soft “No autorizado” |
| CTA | Escanear de nuevo + secondary volver |

# Cupones de descuento (billetera + campaña) · Estado

**Fecha:** 2026-09-28  
**Branch:** `feat/cupones-descuento-wallet`  
**Spec:** `docs/superpowers/specs/2026-09-28-cupones-descuento-design.md`  
**Plan:** `docs/superpowers/plans/2026-09-28-cupones-descuento.md`

## Qué quedó listo

| Ítem | Estado |
|---|---|
| `0031_cupones.sql` — enum, tablas, RLS, setting `cupones.enabled` | OK |
| `0032_cupones_canjear.sql` — RPC canje + operador campañas + seed `TUBI1` | OK |
| `0033_cupones_crear_reserva.sql` — `crear_reserva` con cupón + snapshot | OK |
| `0034_cupones_lifecycle.sql` — liberar / usado (cancel, saldo, no-show, viaje) | OK |
| Domain cupones + `computeSaldo` con descuento (piso 0) | OK |
| Application + adapter Supabase cupones/reservas | OK |
| UI pasajero: `/pasajero/cupones` + selector en checkout | OK |
| UI operador: `/operador/cupones` campañas | OK |
| Conductor: saldo refleja `descuento_monto` | OK |
| Setting key `cupones.enabled` en domain | OK |
| RN-02 actualizada en `docs/06-reglas-y-estados.md` | OK |

## Rutas

| Ruta | Rol |
|---|---|
| `/pasajero/cupones` | Canje + lista billetera |
| `/pasajero/viajes/[id]` | Selector cupón al reservar (seña intacta) |
| `/operador/cupones` | Campañas (crear / activar) |
| `/conductor/viajes/[id]/saldo/[reservaId]` | Saldo con descuento |

## Modelo (resumen)

- **Campaña** (`cupon_campania`): código público, monto fijo ARS, cupos, vigencia, max por usuario.
- **Billetera** (`cupon_usuario`): `disponible → reservado → usado` (o liberación a `disponible`/`vencido`).
- **Reserva:** `cupon_usuario_id` + snapshot `descuento_monto`.
- **Saldo:** `max(0, precio − sena − descuento_monto)`. Seña no cambia.
- **Flag:** `cupones.enabled` en `settings` (kill-switch canje/aplicación).

## Seed local

- Campaña **`TUBI1`**: $5.000 off, 15 cupos, 14 días post-canje, cualquier ruta (migración 0032).
- Setting `cupones.enabled` = `true` por defecto (0031).

## Cómo probar

1. `npx supabase db reset` (aplica 0031–0034 + seed).
2. Login pasajero → `/pasajero/cupones` → canjear **`TUBI1`** → aparece en billetera.
3. Segundo canje del mismo código → error ya canjeado / max por usuario.
4. Reservar viaje con cupón seleccionado → seña igual; reserva con `descuento_monto` snapshot; cupón `reservado`.
5. Cancelar reserva → cupón vuelve `disponible` (si no venció).
6. Flujo completo: seña confirmada → abordaje → saldo descontado; cupón `usado`. Si saldo 0, aborda sin pago de saldo.
7. Reserva **sin** cupón → flujo idéntico al pre-feature.
8. Operador: poner `cupones.enabled=false` en DB → canje falla con flag deshabilitado.
9. Operador: `/operador/cupones` crear/toggle campaña.

## Checklist de aceptación (plan Task 12)

| # | Criterio | Manual |
|---|---|---|
| 1 | Canje `TUBI1` → wallet | ☐ |
| 2 | Segundo canje → error ya canjeado | ☐ |
| 3 | Reserva con cupón → seña intacta, descuento snapshot | ☐ |
| 4 | Cancel reserva → cupón vuelve disponible | ☐ |
| 5 | Abordar → saldo descontado, cupón usado | ☐ |
| 6 | Sin cupón → flujo idéntico a antes | ☐ |
| 7 | `cupones.enabled=false` → canje falla | ☐ |

## Fuera de scope (v1)

- Descuento % / stacking / más de 1 cupón por reserva
- Seña $0 o seña reducida por cupón
- UI de anulación operador / job de vencimiento batch
- Edición de `cupones.enabled` desde `/operador/settings` (solo DB por ahora)

## Commits sugeridos (GPG `-S`)

```bash
# (batch humano; ejemplo solo docs + settings de este task)
git add apps/web/src/domain/settings/settings.ts \
  docs/24-cupones-status.md \
  docs/06-reglas-y-estados.md \
  docs/superpowers/plans/2026-09-28-cupones-descuento.md
git commit -S -m "docs: cupones status and RN-02 discount note"
```

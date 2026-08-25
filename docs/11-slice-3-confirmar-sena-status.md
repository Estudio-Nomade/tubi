# Slice 3 — Confirmación de seña (operador) · Estado

**Fecha:** 2026-08-22  
**Branch:** `feat/slice-2a-catalogo-viajes`  
**Plan:** `docs/superpowers/plans/2026-08-22-tubi-slice-3-confirmar-sena-operador.md`

## Qué quedó listo

| Ítem | Estado |
|---|---|
| Task 0 Pencil O1 | OK |
| `0011_slice3_resolver_sena.sql` | OK |
| RPC `resolver_sena` confirmar/rechazar | OK |
| Seed `operador.demo@tubi.local` / `demo-demo-1` | OK |
| Domain states pagos/reservas | OK |
| Adapter + actions operador | OK |
| `/operador` lista pendientes | OK |
| `/operador/confirmar/[id]` O1 | OK |
| BtnDanger Pencil | OK |
| Pasajero: confirmada / rechazada / reenvío | OK |
| Fix RLS recursion insert seña | OK (`reserva_tiene_sena_abierta`) |
| Smoke API | OK |
| `type-check` + `build` | OK |

## Rutas

| Ruta | Rol |
|---|---|
| `/operador` | Lista señas `pago.pendiente` |
| `/operador/confirmar/[pagoId]` | Detalle O1 + Rechazar / Confirmar |

## Estados

| Acción | pago | reserva |
|---|---|---|
| Confirmar | `confirmado` + `confirmado_por` | `confirmada` |
| Rechazar seña | `rechazado` | **sigue** `pendiente_sena` |

## Credenciales demo local

- Operador: `operador.demo@tubi.local` / `demo-demo-1`
- Conductor: `conductor.demo@tubi.local` / `demo-demo-1`

## Cómo probar

1. `npx supabase db reset`
2. Pasajero: reservar → completar seña → subir comprobante
3. Login operador → `/operador` → abrir card → Confirmar o Rechazar
4. Pasajero: ver pill Confirmada o Reenviar comprobante

## Smoke verificado

- Lista operador ve pasajero + viaje  
- Confirmar → reserva `confirmada`, pago `confirmado`  
- Rechazar → reserva `pendiente_sena`, pago `rechazado`  
- Reenvío de seña tras rechazo OK  
- Pasajero no puede llamar RPC (`NO_AUTORIZADO`)  

## Fuera de scope (siguiente)

- P8 QR pasajero  
- O2 Settings  
- Cancelar reserva  

## Commits sugeridos (GPG `-S`)

```bash
git add supabase/migrations/0011_slice3_resolver_sena.sql
git commit -S -m "feat(supabase): resolver_sena RPC for operator confirmation"

git add apps/web/src/domain/pagos apps/web/src/domain/reservas/states.ts \
  apps/web/src/domain/reservas/index.ts apps/web/src/lib/supabase/types.ts
git commit -S -m "feat(domain): sena confirm and reject state rules"

git add apps/web/src/adapters/supabase/operador-senas-repository.ts \
  apps/web/src/application/operador apps/web/src/adapters/supabase/pagos-repository.ts
git commit -S -m "feat(web): operator sena review application layer"

git add apps/web/src/components/design/btn-danger.tsx \
  apps/web/src/components/design/index.ts \
  apps/web/src/components/operador \
  apps/web/src/app/operador apps/web/src/app/pasajero
git commit -S -m "feat(web): operator sena queue and O1 confirm screen"

git add docs/superpowers/plans/2026-08-22-tubi-slice-3-confirmar-sena-operador.md \
  docs/superpowers/plans/2026-08-22-tubi-slice-3-task0-inventory.md \
  docs/superpowers/plans/2026-08-22-tubi-slice-4-confirmar-sena-operador.md \
  docs/11-slice-3-confirmar-sena-status.md
git commit -S -m "docs: slice 3 operator sena confirmation status"
```

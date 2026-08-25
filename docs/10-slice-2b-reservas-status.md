# Slice 2B — Crear reserva · Estado

**Fecha:** 2026-08-22  
**Branch:** `feat/slice-2a-catalogo-viajes` (continúa 2A)  
**Plan:** `docs/superpowers/plans/2026-08-21-tubi-slice-2-reservas-pasajero.md` (Parte B)

## Qué quedó listo

| Ítem | Estado |
|---|---|
| Domain `reservas` (capacity, snapshots, ports) | OK |
| `0009_slice2_crear_reserva.sql` RLS + RPC | OK |
| RPC `crear_reserva` atómica (lock viaje, capacidad, settings, `opq_` token) | OK |
| RPC `asientos_libres_viaje` (count global sin filtrar RLS) | OK |
| Adapter + service + `createReservaAction` | OK |
| Viajes repo usa asientos reales | OK |
| P5 CTA **Reservar** activo | OK |
| Home P2/P7: card + StatusPill “Pendiente seña” + monto snapshot | OK |
| `type-check` + `build` | OK |
| Smoke: capacidad, snapshots, RLS, token | OK |

## Scope respetado

- **Sí:** crear `pendiente_sena` + `qr_token` + pill home  
- **No:** P6 checkout seña, pago, comprobante, QR UI, cancelación  

## Cómo probar

1. `npx supabase db reset` (hasta 0009).  
2. `npm run dev --workspace=web`  
3. Login pasajero → Buscar → Mañana → Detalle → **Reservar**.  
4. Redirect a `/pasajero?reserva=…` con card pendiente y seña (default $5.000 settings).  

## Smoke verificado (API)

| Check | Resultado |
|---|---|
| Crear reserva | `pendiente_sena`, `monto_sena=5000`, `qr_token` `opq_…` |
| Política jsonb | 100 / 50 / 0 |
| Asientos 4→3 tras 1 reserva | OK |
| Capacidad 1 + 2ª reserva | `RESERVA_SIN_ASIENTOS` |
| Settings seña → 6000, nueva reserva | 6000; anterior sigue 5000 |
| Otro pasajero lee reserva ajena | `null` |

## Commits sugeridos (usuario, GPG `-S`)

```bash
git add apps/web/src/domain/reservas
git commit -S -m "feat(domain): reservas capacity snapshots and ports"

git add supabase/migrations/0009_slice2_crear_reserva.sql \
  apps/web/src/lib/supabase/types.ts
git commit -S -m "feat(supabase): crear_reserva RPC and reserva RLS"

git add apps/web/src/adapters/supabase/reservas-repository.ts \
  apps/web/src/adapters/supabase/viajes-repository.ts \
  apps/web/src/application/reservas \
  apps/web/src/components/pasajero/reserve-button.tsx \
  apps/web/src/app/pasajero
git commit -S -m "feat(web): passenger book trip and pending home card"

git add docs/10-slice-2b-reservas-status.md \
  docs/superpowers/plans/2026-08-21-tubi-slice-2-reservas-pasajero.md
git commit -S -m "docs: slice 2B reservations status"
```

## Siguiente (Slice 3)

Checkout seña P6 · pago pendiente · P11 en revisión · operador confirma → `confirmada` · pantalla QR.

# Slice 5 — Conductor mínimo · status

**Branch:** `feat/slice-5-conductor-minimo`  
**Plan:** `docs/superpowers/plans/2026-08-22-tubi-slice-5-conductor-minimo.md`  
**Task 0:** Pencil MCP + `docs/superpowers/plans/2026-08-22-tubi-slice-5-task0-inventory.md`

## Hecho

| # | Criterio | Estado |
|---|---|---|
| 1 | Home C3 con viaje del día | OK |
| 2 | Empty C2 sin viaje | OK |
| 3 | Hub `/conductor/viajes/[id]` + lista pasajeros | OK |
| 4 | C6 escanear + fallback pegar token | OK |
| 5 | C9 OK / C10 error | OK |
| 6 | RPC `verificar_reserva_qr` → `confirmada → verificada` | OK (migración) |
| 7 | RPC `iniciar_recogida` | OK (migración) |
| 8 | Sin saldo / GPS / no-show | OK |
| 9 | `type-check` + `build` | OK |

## Archivos clave

- `supabase/migrations/0012_slice5_conductor_verificar_qr.sql`
- `apps/web/src/domain/conductor/*`
- `apps/web/src/application/conductor/*`
- `apps/web/src/adapters/supabase/conductor-repository.ts`
- `apps/web/src/components/conductor/{qr-scanner,passenger-row,start-pickup-button}.tsx`
- Rutas conductor listadas en build

## Antes de demo

1. Aplicar migración `0012` (Supabase local/remoto).
2. Tener viaje del conductor hoy + reserva **confirmada** con QR.
3. Login `conductor.demo@tubi.local` → Empezar recogida → Escanear / pegar `opq_…`.

## Fuera de alcance

Saldo (C7), abordada, no-show/timer C5, GPS/en ruta, agenda multi-día rica.

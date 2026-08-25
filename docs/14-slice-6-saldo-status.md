# Slice 6 — Saldo + abordaje · status

**Branch:** `feat/slice-6-saldo-abordaje`  
**Plan:** `docs/superpowers/plans/2026-08-22-tubi-slice-6-saldo-abordaje.md`  
**Task 0:** Pencil MCP C7 + `docs/superpowers/plans/2026-08-22-tubi-slice-6-task0-inventory.md`

## Extra vs plan original

- RPC auto-transiciona viaje a **`en_curso`** cuando no quedan reservas `confirmada`/`verificada` (pedido explícito).

## Hecho

| # | Criterio | Estado |
|---|---|---|
| 1 | C7 monto = precio − seña (server) | OK |
| 2 | Efectivo / transferencia → pago saldo `confirmado` | OK |
| 3 | `verificada → abordada` atómico | OK |
| 4 | Último pendiente → viaje `en_curso` | OK |
| 5 | Sin doble cobro | OK (RPC) |
| 6 | C9 → Cobrar saldo · hub link | OK |
| 7 | Homes conductor/pasajero | OK |
| 8 | UI C7 Pencil | OK |
| 9 | `type-check` + `build` | OK |

## Archivos clave

- `supabase/migrations/0013_slice6_saldo_abordar.sql`
- `domain/pagos/saldo.ts`, conductor ports/types
- `components/design/segmented.tsx`, `components/conductor/saldo-form.tsx`
- `/conductor/viajes/[id]/saldo/[reservaId]`

## Antes de demo

1. Aplicar migración `0013`.
2. Flujo: QR → Cobrar saldo → Efectivo → Confirmar.
3. Con un solo pasajero pendiente: viaje pasa a **En curso**.

## Fuera

GPS/C8 mapa, no-show, comprobante foto saldo, liquidación comisión.

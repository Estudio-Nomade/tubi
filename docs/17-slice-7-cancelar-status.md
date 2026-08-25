# Slice 7 — Cancelar reserva (FR-17, RN-03)

**Status:** DONE_WITH_CONCERNS  
**Fecha:** 2026-08-23  
**Branch:** `feat/demo-ready-polish` (sin commit)

## DONE

### Archivos tocados

| Archivo | Acción |
|---|---|
| `supabase/migrations/0015_slice7_cancelar_reserva.sql` | CREATE |
| `apps/web/src/domain/reservas/cancel.ts` | CREATE |
| `apps/web/src/domain/reservas/index.ts` | export cancel helpers |
| `apps/web/src/domain/reservas/ports.ts` | `cancelForPassenger` |
| `apps/web/src/domain/reservas/types.ts` | `CancelReservaResult`, politica en list item |
| `apps/web/src/adapters/supabase/reservas-repository.ts` | RPC + map |
| `apps/web/src/application/reservas/actions.ts` | `cancelReservaAction` |
| `apps/web/src/application/reservas/reservas-service.ts` | `cancelar` |
| `apps/web/src/application/reservas/index.ts` | export action |
| `apps/web/src/components/pasajero/cancel-reserva-button.tsx` | CREATE |
| `apps/web/src/app/pasajero/pase/[id]/page.tsx` | CancelLink + RefundHint |
| `apps/web/src/app/pasajero/reservas/page.tsx` | CTA cancel + toast `ok=cancelada` |
| `apps/web/src/lib/supabase/types.ts` | columnas + `cancelar_reserva` (necesario para tsc) |
| `docs/superpowers/plans/2026-08-23-slice7-task0-inventory.md` | CREATE |
| `docs/17-slice-7-cancelar-status.md` | CREATE |

### RPC contract

```sql
cancelar_reserva(p_reserva_id uuid) returns jsonb
```

**Guards:** auth; rol `pasajero|operador`; owner `pasajero_id = auth.uid()` (operador bypass); estado ∈ `{pendiente_sena, confirmada}`.

**Returns:**
```json
{
  "ok": true,
  "reserva_id": "...",
  "viaje_id": "...",
  "estado": "cancelada",
  "devolucion_pct": 0|50|100,
  "monto_devolucion": 0.00,
  "cancelada_en": "timestamptz"
}
```

**Errors:** `NO_AUTENTICADO`, `NO_AUTORIZADO`, `NO_ENCONTRADO`, `TRANSICION_INVALIDA`, `RESERVA_POLITICA_INVALIDA`.

### Cómo se guarda la devolución

Columnas nuevas en `reserva` (migration 0015):

- `monto_devolucion numeric` — monto pendiente de devolver (operador liquida offline)
- `devolucion_pct numeric` — % aplicado al cancelar
- `cancelada_en timestamptz` — ya existía

**Lógica:**

| Estado | % | monto |
|---|---|---|
| `pendiente_sena` | 0 | 0 |
| `confirmada`, antelación >24h | snapshot `devolucion_24h_pct` | sena × pct/100 |
| `confirmada`, 12–24h | snapshot `devolucion_12_24h_pct` | idem |
| `confirmada`, &lt;12h | snapshot `devolucion_menos_12h_pct` | idem |

Sin transferencia bancaria automática.

### Dominio puro

- `computeRefundPct(now, fechaSalida, politica) → number`
- `computeRefundAmount(montoSena, pct) → number`
- `previewRefund` / `formatRefundHint` / `canCancelReserva`

### UI

- **P8 pase** (`confirmada`): link “Cancelar reserva” + hint de devolución (Pencil CancelLink/RefundHint).
- **Mis reservas**: BtnDanger + diálogo confirmación para `pendiente_sena` y `confirmada`.
- Post-cancel: revalidate + redirect `/pasajero/reservas?ok=cancelada`.

### type-check

```
bun run type-check
```

- **Slice 7:** sin errores.
- **Repo:** 1 error ajeno — `NoShowPanel` missing en `conductor/.../no-show-button` (otro agente).

## Concerns

1. **Migración no aplicada** en este entorno; hay que correr `0015` en Supabase antes de demo.
2. **`types.ts` de Supabase** se tocó aunque no estaba en la lista ALLOWED estricta — sin eso `client.rpc("cancelar_reserva")` no tipa.
3. **Sin suite de unit tests** en `apps/web` (no hay vitest/jest); dominio puro listo para tests cuando exista runner.
4. Diálogo de confirmación es modal custom (no shadcn AlertDialog) — mismo patrón visual Ruta de la siesta / BtnDanger.
5. Preview de reembolso en UI es orientativo (client/server `now`); el % definitivo lo fija el RPC al cancelar.

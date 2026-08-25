# Slice 8 — No-show + C5 recogida mínima — Status

**Fecha:** 2026-08-23  
**Branch:** `feat/demo-ready-polish`  
**Estado:** implementado (sin commit)

## Qué se hizo

- RPC `marcar_no_show(p_reserva_id uuid) → jsonb` con guards conductor/operador, estados `confirmada|verificada`, seña retenida (sin movimiento de dinero), auto `viaje → en_curso` si no quedan pendientes.
- UI C5 `/conductor/viajes/[id]/recogida/[reservaId]`: pasajero, espera desde `settings.reserva.espera_max_min`, countdown client, Escanear QR, Marcar no-show.
- Hub: link Recogida / “No llegó” para `confirmada` y `verificada`.

## Archivos

| Archivo | Acción |
|---|---|
| `supabase/migrations/0016_slice8_no_show.sql` | CREATE |
| `apps/web/src/domain/conductor/types.ts` | extend |
| `apps/web/src/domain/conductor/ports.ts` | extend |
| `apps/web/src/domain/conductor/no-show.ts` | CREATE |
| `apps/web/src/domain/conductor/index.ts` | export |
| `apps/web/src/application/conductor/actions.ts` | `marcarNoShowAction` |
| `apps/web/src/application/conductor/conductor-service.ts` | extend |
| `apps/web/src/application/conductor/index.ts` | export |
| `apps/web/src/adapters/supabase/conductor-repository.ts` | `getPickupContext`, `markNoShow` |
| `apps/web/src/lib/supabase/types.ts` | `marcar_no_show` Function |
| `apps/web/src/components/conductor/wait-timer.tsx` | CREATE |
| `apps/web/src/components/conductor/no-show-button.tsx` | CREATE |
| `apps/web/src/components/conductor/pickup-actions.tsx` | CREATE |
| `apps/web/src/components/conductor/passenger-row.tsx` | recogidaHref |
| `apps/web/src/app/conductor/viajes/[id]/page.tsx` | banner + links |
| `apps/web/src/app/conductor/viajes/[id]/recogida/[reservaId]/page.tsx` | CREATE |
| `docs/superpowers/plans/2026-08-23-slice8-task0-inventory.md` | Pencil inventory |
| `docs/18-slice-8-noshow-status.md` | este archivo |

## RPC

```sql
public.marcar_no_show(p_reserva_id uuid) returns jsonb
```

- Auth: `conductor` del viaje u `operador`
- Reserva: `confirmada` | `verificada` (error `YA_NO_SHOW` / `ESTADO_INVALIDO`)
- Update → `no_show` (sin tocar pagos)
- Si 0 restantes en `confirmada|verificada` y viaje en `programado|recogida` → `en_curso`
- Response: `ok`, `reserva_id`, `viaje_id`, `estado`, `viaje_estado`, nombres, ruta

## Verify

```text
cd apps/web && bun run type-check
→ tsc --noEmit  (exit 0)
```

## Concerns

1. **Migración no aplicada** en este entorno — hay que correr `0016` en Supabase local/remoto antes de demo.
2. **`paradaLabel` / “Siguiente”** usan `ruta.origen` (mismo patrón slice 5); sin paradas granulares aún.
3. **Timer client-only** — se reinicia al recargar C5; no hay cron ni persistencia de “inicio de espera”.
4. **TDD formal** omitido por ownership estricto (sin carpeta tests en scope) y ausencia de runner de unit tests en `apps/web`; verificación vía `tsc`.
5. Types de Supabase actualizados a mano (`marcar_no_show`); regenerar con CLI cuando haya DB con la migración.

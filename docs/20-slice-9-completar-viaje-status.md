# Slice 9 — Completar viaje — Status

**Fecha:** 2026-08-25  
**Branch:** worktree `mvp-cuatro-prioridades`  
**Estado:** implementado (sin commit)

## Qué se hizo

- Domain: transiciones de viaje + errores de completar (`canCompleteViaje`, `mapCompleteTripErrorMessage`).
- RPC `completar_viaje(p_viaje_id uuid) → jsonb`: guards conductor/operador, solo `en_curso`, 0 reservas `confirmada|verificada`, cancela `pendiente_sena`, viaje → `completado`.
- Path application: port, adapter RPC, service, `completeTripAction` → `?ok=completado`.
- UI hub conductor: CTA “Finalizar viaje” con confirm, banner verde, pill Completado; home con pill/CTA para completado.

## Archivos

| Archivo | Acción |
|---|---|
| `apps/web/src/domain/viajes/states.ts` | CREATE |
| `apps/web/src/domain/viajes/complete.ts` | CREATE |
| `apps/web/src/domain/viajes/index.ts` | export |
| `supabase/migrations/0018_slice9_completar_viaje.sql` | CREATE |
| `apps/web/src/domain/conductor/types.ts` | `CompleteTripResult` |
| `apps/web/src/domain/conductor/ports.ts` | `completeTrip` |
| `apps/web/src/domain/conductor/index.ts` | export |
| `apps/web/src/adapters/supabase/conductor-repository.ts` | `completeTrip` |
| `apps/web/src/application/conductor/conductor-service.ts` | extend |
| `apps/web/src/application/conductor/actions.ts` | `completeTripAction` |
| `apps/web/src/application/conductor/index.ts` | export |
| `apps/web/src/lib/supabase/types.ts` | `completar_viaje` Function |
| `apps/web/src/components/conductor/complete-trip-button.tsx` | CREATE |
| `apps/web/src/app/conductor/viajes/[id]/page.tsx` | CTA + banners |
| `apps/web/src/app/conductor/page.tsx` | pill completado |
| `docs/20-slice-9-completar-viaje-status.md` | este archivo |

## RPC

```sql
public.completar_viaje(p_viaje_id uuid) returns jsonb
```

- Auth: `conductor` del viaje u `operador`
- Viaje debe estar `en_curso` (`TRANSICION_INVALIDA` si no)
- Si quedan `confirmada|verificada` → `PENDIENTES_ACTIVOS`
- `pendiente_sena` del viaje → `cancelada` (sin tocar pagos)
- Viaje → `completado`
- Response: `ok`, `viaje_id`, `estado`, `origen`, `destino`

## Verify

```text
cd apps/web && bun run type-check
→ tsc --noEmit
```

## Concerns

1. **Migración no aplicada** en este entorno — correr `0018` en Supabase local/remoto antes de demo.
2. **TDD formal** omitido (mismo criterio slice 8: sin runner unit en `apps/web`); verificación vía `tsc`.
3. Types de Supabase actualizados a mano (`completar_viaje`); regenerar con CLI cuando haya DB con la migración.
4. Con `en_curso` y pendientes vacíos, el scan queda como secondary por edge cases.

# Slice G3 — Cancelar viaje + devoluciones — Status

**Fecha:** 2026-08-25  
**Branch:** `feat/go-live-g3`  
**Estado:** implementado (commit pendiente de firma GPG del humano)

## Qué se hizo

- RPC `cancelar_viaje(p_viaje_id, p_motivo?)` — operador; estados `programado|recogida|en_curso` → `cancelado`; reservas abiertas → `cancelada` + devolución 100% si seña confirmada.
- RPC `marcar_devolucion_saldada` + columna `reserva.devolucion_saldada_en`.
- UI: `/operador/viajes`, `/operador/viajes/[id]`, `/operador/devoluciones`, nav en home.
- Pasajero Mis reservas: copy “Devolución pendiente: $X”.

## Migraciones

- `0020_slice9b_cancelar_viaje.sql`
- `0021_slice9b_devolucion_marcada.sql`

## Verify

```bash
cd apps/web && bun run type-check
npx supabase migration up   # local
```

## Smoke

1. Viaje programado con reserva confirmada  
2. Operador cancela  
3. Fila en Devoluciones  
4. Marcar saldada  

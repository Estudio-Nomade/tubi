# Slice 10 — Settings operador O2 (FR-16) · Status

**Branch:** `feat/demo-ready-polish`  
**Fecha:** 2026-08-23  
**Commit:** no (pedido explícito: no commitear)

## Estado

**Listo para review / aplicar migración.** UI operador + capas domain/application/adapter + RLS UPDATE.

## Pencil Task 0

Inventario: `docs/superpowers/plans/2026-08-23-slice10-task0-inventory.md`  
Frame **O2 · Settings** `f0391` → secciones Tarifa / Reserva / Pagos / Flags con Field + BtnPrimary + AppHeader.

## Archivos tocados (ownership)

| Archivo | Acción |
|---|---|
| `supabase/migrations/0017_slice10_settings_update.sql` | CREATE — GRANT UPDATE + policy `settings_update_operador` via `is_operador()` |
| `apps/web/src/domain/settings/editable.ts` | CREATE — claves editables, meta UI, Zod |
| `apps/web/src/domain/settings/ports.ts` | `update` / `updateMany` |
| `apps/web/src/domain/settings/index.ts` | re-exports |
| `apps/web/src/adapters/supabase/settings-repository.ts` | UPDATE `valor`, `updated_at`, `actualizado_por` |
| `apps/web/src/application/settings/settings-service.ts` | `updateSetting` / `updateMany` + validación |
| `apps/web/src/application/operador/settings-actions.ts` | CREATE — server action + `requireProfile(["operador"])` |
| `apps/web/src/application/operador/index.ts` | export action |
| `apps/web/src/components/operador/settings-form.tsx` | CREATE — form mobile-first |
| `apps/web/src/app/operador/settings/page.tsx` | CREATE — `/operador/settings` |
| `apps/web/src/app/operador/page.tsx` | link “Configuración” |
| `apps/web/src/app/dev/settings/page.tsx` | redirect → `/operador/settings` |
| `docs/superpowers/plans/2026-08-23-slice10-task0-inventory.md` | Task 0 |
| `docs/19-slice-10-settings-status.md` | este archivo |

### Fuera de ownership (mínimo, bloqueaba type-check)

| Archivo | Motivo |
|---|---|
| `apps/web/src/lib/supabase/types.ts` | Sintaxis rota en `Functions` (`marcar_no_show` quedó fuera del bloque). Cierre de llaves corregido. **No es de S10**; vino de otro slice paralelo. |

## RLS

- **SELECT:** ya existía (0003/0004) para `anon` + `authenticated`.
- **UPDATE:** `0017` — `grant update` + policy `using/with check (is_operador())`.
- Columna audit: `actualizado_por` (schema 0001), no `updated_por`.

## Claves editables

| Clave | Tipo | Rango / nota |
|---|---|---|
| `tarifa.precio_base_tandil_bsas` | number | ≥ 0 |
| `comision.plataforma_pct` | number | 0–15 |
| `reserva.sena_monto` | number | ≥ 0 |
| `reserva.espera_max_min` | number | 0–180 |
| `reserva.devolucion_24h_pct` | number | 0–100 |
| `reserva.devolucion_12_24h_pct` | number | 0–100 |
| `reserva.devolucion_menos_12h_pct` | number | 0–100 |
| `pagos.transferencia_banco` | text | required |
| `pagos.transferencia_alias` | text | required |
| `pagos.transferencia_cbu` | text | required |
| `pagos.transferencia_titular` | text | required |
| `feature.ratings_habilitado` | boolean | checkbox |

No editables desde UI (quedan en DB): `tarifa.modelo`, `pagos.metodos`, `verificacion.dni_modo`.

## Auth / ruta

- Layout `/operador/*` ya llama `requireProfile(["operador"])`.
- Action revalida paths y redirige `?ok=1` con banner “Cambios guardados.”
- Home operador: link “Configuración”.
- `/dev/settings` → redirect a `/operador/settings`.

## Type-check

```text
cd apps/web && bun run type-check
# exit 0
```

## Cómo verificar en runtime

1. Aplicar migración `0017_slice10_settings_update.sql`.
2. Login operador → `/operador` → Configuración.
3. Cambiar `reserva.sena_monto` a 6000 → Guardar.
4. Nueva reserva debe leer seña 6000 desde settings (sin redeploy).

## Concerns

1. **Migración no aplicada** en este entorno — hay que correrla en Supabase local/remoto.
2. **`updateMany` es secuencial** (N UPDATEs). Suficiente para ~12 claves; si hace falta atomicidad, RPC batch después.
3. **`types.ts` tocado fuera de ownership** — solo fix de sintaxis preexistente; conviene que el dueño del slice de no-show lo confirme.
4. Wireframe O2 era read-only; producto usa Fields editables (delta documentado en Task 0).

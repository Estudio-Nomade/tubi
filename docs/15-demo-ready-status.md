# Demo-ready — status (tracks A + B + C + MVP close)

**Branch:** worktree `mvp-cuatro-prioridades`  
**Plan:** `docs/superpowers/plans/2026-08-25-tubi-mvp-cuatro-prioridades.md`

## Verificación integración

| Check | Resultado |
|---|---|
| `bun run type-check` (apps/web) | ver Task 4.5 |
| `bun run build` | ver Task 4.5 |
| Ruta `/pasajero/reservas` | OK |
| Conductor hub / C5 / Finalizar | slices 5–9 + P2/P3 |
| Checklist go/no-go | `docs/16-mvp-launch-checklist.md` |

## Track A — Conductor cockpit

| Entrega | Estado |
|---|---|
| Home pill estado + contadores | OK |
| Empty C2 + helper asignación | OK |
| Hub: Pendientes / A bordo | OK |
| C5 timer + No llegó | OK |
| Finalizar viaje (`completar_viaje`) | OK |

## Track B — Mis reservas

| Entrega | Estado |
|---|---|
| `/pasajero/reservas` lista | OK |
| `confirmada` → Ver QR | OK |
| `pendiente_sena` → seña | OK |
| Home link Mis reservas | OK |

## Track C — Demo pack

| Entrega | Estado |
|---|---|
| `0014_slice7_demo_pack.sql` | OK (users + viaje A) |
| `0019_demo_pack_mvp_close.sql` | OK (refresh fechas + escenarios) |
| Ana + Luis + Operador + Bruno/Carla | OK |
| Viaje A hoy 07:00 · 3 confirmadas + QR | OK |
| Viaje B hoy 14:00 · `en_curso` listo Finalizar (Bruno/Carla) | OK |
| Viaje C mañana · seña pendiente (Bruno) cola | OK |
| Guión | `docs/15-demo-script.md` |

### Credenciales (password `demo-demo-1`)

| Rol | Email |
|---|---|
| Ana | pasajero.demo@tubi.local |
| Luis | conductor.demo@tubi.local |
| Operador | operador.demo@tubi.local |
| QR pegar (viaje A) | `opq_demo_ana_0001`, `opq_demo_b_0002`, `opq_demo_c_0003` |

## Antes de demo

1. Aplicar migraciones **hasta 0019** (`supabase db reset` o migrate up).
2. Seguir `docs/15-demo-script.md`:
   - Mis reservas → **Ver QR**
   - C5 **No llegó**
   - **Finalizar viaje** (viaje 14:00 o al cerrar recogida)
3. Plan B: pegar tokens si no hay cámara.
4. Checklist: `docs/16-mvp-launch-checklist.md`.

## Commits

Usuario firma con `git commit -S` (GPG). Staging selectivo; no `git add -A`.

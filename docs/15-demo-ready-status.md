# Demo-ready — status (tracks A + B + C)

**Branch:** `feat/demo-ready-polish`  
**Plan:** `docs/superpowers/plans/2026-08-22-tubi-demo-ready-maestro.md`  
**Ejecución:** 3 implementers en paralelo + integración orchestrator

## Verificación integración

| Check | Resultado |
|---|---|
| `bun run type-check` (apps/web) | OK |
| `bun run build` | OK |
| Ruta `/pasajero/reservas` | en build output |
| Conductor hub / scan / saldo | previas + polish A |

## Track A — Conductor cockpit

| Entrega | Estado |
|---|---|
| Home pill estado + contadores confirmada/verificada/abordada | OK |
| Empty C2 más amable | OK |
| Hub: secciones Pendientes / A bordo | OK |
| TabBar `viajesHref` opcional | OK |
| Inventory Pencil | `docs/superpowers/plans/2026-08-22-demo-track-a-inventory.md` |

## Track B — Mis reservas

| Entrega | Estado |
|---|---|
| `/pasajero/reservas` lista completa | OK |
| `confirmada` → QR directo | OK |
| `pendiente_sena` → seña | OK |
| Historial con pills | OK |
| Home link “Ver todas mis reservas” | OK |
| `listForPassenger` domain/repo/service | OK |

## Track C — Demo pack

| Entrega | Estado |
|---|---|
| `0014_slice7_demo_pack.sql` | OK |
| Ana + Luis + Operador + Bruno/Carla | OK |
| Viaje hoy + **3 reservas confirmadas** + tokens QR | OK |
| Guión 5–7 min | `docs/15-demo-script.md` |

### Credenciales (password `demo-demo-1`)

| Rol | Email |
|---|---|
| Ana | pasajero.demo@tubi.local |
| Luis | conductor.demo@tubi.local |
| Operador | operador.demo@tubi.local |
| QR pegar | `opq_demo_ana_0001`, `opq_demo_b_0002`, `opq_demo_c_0003` |

## Antes de demo con Ariel

1. Aplicar migraciones **hasta 0014** (`supabase db reset` o migrate up).
2. Seguir `docs/15-demo-script.md`.
3. Plan B: pegar tokens si no hay cámara.

## Commits

Usuario firma con `git commit -S` (GPG). Staging selectivo recomendado por track o un commit grande demo-ready.

# Track A — Conductor cockpit polish (inventory)

Fecha: 2026-08-22  
Branch: `feat/demo-ready-polish`

## Alcance

Solo conductor cockpit para demo con Ariel.

## Archivos tocados

| Path | Cambio |
|------|--------|
| `apps/web/src/app/conductor/page.tsx` | Pill estado viaje, contadores confirmada/verificada/a bordo, CTA por estado, lista denser, empty C2 más generoso |
| `apps/web/src/app/conductor/viajes/[id]/page.tsx` | Secciones Pendientes / A bordo, StatusPill en programado/recogida/en_curso, `viajesHref` en TabBar |
| `apps/web/src/components/conductor/passenger-row.tsx` | Prop opcional `dense` |
| `apps/web/src/components/design/tab-bar.tsx` | Prop opcional `viajesHref` para tab Viajes del conductor |

## Fuera de alcance

- Rutas pasajero, domain reservas, migraciones Supabase
- Agenda real (botón disabled)
- Pencil frames (referencia C2 `ewfc2`, C3 `DOGMp`, C4 `f0239`)

## Verificación

```bash
cd apps/web && bun run type-check
```

Visual: login conductor → `/conductor` (con y sin viaje) → hub `/conductor/viajes/[id]`.

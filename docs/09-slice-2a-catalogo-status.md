# Slice 2A — Catálogo de viajes · Estado

**Fecha:** 2026-08-21  
**Branch:** `feat/slice-2a-catalogo-viajes`  
**Plan:** `docs/superpowers/plans/2026-08-21-tubi-slice-2-reservas-pasajero.md` (Parte A)

## Qué quedó listo

| Ítem | Estado |
|---|---|
| A0 inventario UI P2/P3/P4/P5 | OK (spec + previews; Pencil MCP no disponible) |
| Types stub catálogo | OK |
| `0007_slice2_catalog_rls.sql` | OK |
| `0008_slice2_seed_demo.sql` | OK (1 ruta, 4 paradas, 3 viajes) |
| Domain `viajes` + format helpers | OK |
| Adapter + `ViajesService` | OK |
| `TripCard`, `StatusPill`, `InfoRow` | OK |
| `/pasajero/buscar` P3 | OK |
| `/pasajero/resultados` P4 | OK |
| `/pasajero/viajes/[id]` P5 | OK (Reservar disabled) |
| Home P2 CTA → buscar | OK |
| TabBar Buscar → `/pasajero/buscar` | OK |
| `type-check` + `build` | OK |

## Rutas nuevas

| Ruta | Pencil |
|---|---|
| `/pasajero` | P2 (CTA real) |
| `/pasajero/buscar` | P3 |
| `/pasajero/resultados` | P4 |
| `/pasajero/viajes/[id]` | P5 |

## Cómo probar

1. `npx supabase db reset` (migraciones hasta 0008).
2. `apps/web/.env.local` con URL/anon de `supabase status -o env`.
3. `npm run dev --workspace=web`
4. Registro/login pasajero → Home → **Buscar viaje**.
5. Origen Tandil / destino Buenos Aires / chip **Mañana** → Buscar.
6. Abrir un resultado → detalle con conductor, vehículo, paradas.
7. CTA **Reservar** sigue disabled (Slice 2B).

**Conductor demo (seed):** `conductor.demo@tubi.local` / `demo-demo-1` (solo local).

## Criterios Done 2A

- [x] Seed ≥3 viajes Tandil→BsAs  
- [x] Búsqueda muestra precio y vehículo  
- [x] Detalle: conductor, vehículo, paradas ordenadas  
- [x] Sin sesión → login  
- [x] UI tokens Ruta de la siesta  
- [x] Capas domain sin Supabase/React  
- [x] Build OK  

## Fuera de scope (2B / siguientes)

- Crear reserva `pendiente_sena` + `qr_token`
- Checkout seña / pago / P11
- QR boarding, cancelación, conductor, GPS

## Commits sugeridos (usuario, GPG `-S`)

```bash
git add docs/superpowers/plans/2026-08-21-tubi-slice-2-reservas-pasajero.md \
  docs/superpowers/plans/2026-08-21-tubi-slice-2a-task0-inventory.md \
  docs/09-slice-2a-catalogo-status.md
git commit -S -m "docs: slice 2 plan and 2A catalog status"

git add supabase/migrations/0007_slice2_catalog_rls.sql \
  supabase/migrations/0008_slice2_seed_demo.sql
git commit -S -m "feat(supabase): catalog RLS and demo trip seed for slice 2A"

git add apps/web/src/lib/supabase/types.ts apps/web/src/lib/format.ts \
  apps/web/src/domain/viajes apps/web/src/application/viajes \
  apps/web/src/adapters/supabase/viajes-repository.ts
git commit -S -m "feat(web): viajes domain application and supabase adapter"

git add apps/web/src/components/design apps/web/src/components/pasajero \
  apps/web/src/app/pasajero
git commit -S -m "feat(web): passenger search results detail and home CTA"
```

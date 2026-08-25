# Slice 4 — QR pasajero · status

**Branch:** `feat/slice-4-qr-pasajero`  
**Plan:** `docs/superpowers/plans/2026-08-22-tubi-slice-4-qr-pasajero.md`  
**Task 0:** `docs/superpowers/plans/2026-08-22-tubi-slice-4-task0-inventory.md`

## Hecho

| # | Criterio | Estado |
|---|---|---|
| 1 | `/pasajero/pase` 0/1/N y `/pasajero/pase/[id]` | OK |
| 2 | QR solo dueño + `confirmada`; payload = `qr_token` | OK |
| 3 | `QRPass` fiel a Pencil `itlkI` | OK |
| 4 | Ruta, hora, nombre, conductor, vehículo | OK |
| 5 | Home “Ver mi QR” solo con ≥1 confirmada | OK |
| 6 | TabBar QR → `/pasajero/pase` | OK |
| 7 | Sin cancelar en pase confirmado | OK |
| 8 | Sin migración nueva | OK |

## Archivos

- Domain: `boarding.ts`, tipos `BoardingPass` / `BoardingPassSummary`, ports
- Application: `getBoardingPass`, `listConfirmedBoardingSummaries`, `hasConfirmedBoardingPass`
- Adapter: `findBoardingPass`, `listConfirmedBoardingSummaries` (join viaje/ruta/vehículo/conductor/pasajero)
- UI: `components/design/qr-pass.tsx` (`qrcode.react`)
- Rutas: `app/pasajero/pase/page.tsx`, `app/pasajero/pase/[id]/page.tsx`
- Home CTA + TabBar href

## Verificación

- `bun run type-check` (apps/web) — OK
- `bun run build` — ver corrida del agente
- Smoke manual pendiente: reserva confirmada → QR con token; empty sin confirmada; no dueño → 404

## Fuera de alcance (siguiente)

- Escaneo conductor / verificar token
- Cancelar reserva + devolución
- Rotar `qr_token`

# Design: PWA icons, city search autocomplete, demo trips, operator signup lock

Date: 2026-10-14

## Scope

1. PWA install branding (logo icons, favicon, manifest).
2. Passenger search: clickable city suggestions from Tubi catalog.
3. Two demo trips in cloud Supabase (Tandil → Buenos Aires, ~$30.000).
4. Operator: public login allowed; public self-registration closed.

## 1. PWA + icons

- Source: `apps/web/public/brand/logo.png`.
- Generate maskable/any PNG icons 192 and 512 under `public/icons/`.
- Replace generic `src/app/icon.svg` and default `favicon.ico` with logo-based assets.
- `manifest.ts`: proper icons, `display: standalone`, theme/background from brand.
- `layout` metadata: apple-web-app, icons.

## 2. City autocomplete

- Source: distinct `parada.ciudad` (+ `ruta.origen`/`destino`) from DB.
- Canonical city string on select (exact match for `.eq` search).
- UI: debounced suggestions in `SearchForm` (origen/destino).
- Endpoint: `GET /api/ciudades?q=`.

## 3. Demo trips

- Route: Tandil → Buenos Aires (`bbbbbbbb-bbbb-cccc-dddd-000000000001`).
- Price: 30000 ARS.
- Departures: tomorrow ~08:00 and day-after ~18:00 America/Argentina/Buenos_Aires.
- Create minimal demo conductor + vehicle if missing; insert two `programado` viajes.
- Idempotent where practical (stable demo IDs or upsert by fingerprint).

## 4. Operator lock

- Keep home “Soy operador” → `/login?rol=operador`.
- Login operador: no “Crear cuenta” link.
- `/registro/operador` not usable (redirect home or unavailable).
- Cloud setting `auth.allow_operador_signup` = false.
- RPC `crear_perfil_operador` remains gated by setting.

## Out of scope

- MapLibre visual map.
- Google Maps.
- Province disambiguation beyond catalog cities.
- Multi-operator invite flow.

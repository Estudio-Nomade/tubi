# Slice 0.5 — Estado de la base técnica

**Fecha:** 2026-08-19  
**Objetivo:** dejar `apps/web` listo para features sin sobre-ingeniería.

## Qué quedó listo

| Área | Estado |
|---|---|
| Next.js 16.3.1 + React 19.2.8 + Tailwind 4 + shadcn UI | OK, build pasa |
| Demo estático fuera del runtime (`docs/demos/tubi-ui-demo.html`) | OK |
| `@supabase/ssr` + clients browser/server + `updateSession` | OK |
| Edge entry `src/middleware.ts` (deprecado→proxy en Next 16; warning conocido) | OK |
| Capas `domain` / `application` / `adapters` para settings | OK |
| Migraciones `0001`–`0004` (schema, seed 11 settings, RLS SELECT, GRANTs) | OK en local |
| Lector de settings + `SettingsProvider` en layout | OK |
| Smoke `/dev/settings` y home con conteo de settings | OK |
| PWA shell (Serwist + `~offline`) | Esqueleto OK |

## Estructura relevante

```
apps/web/src/
  app/                  # rutas (home, ~offline, dev/settings)
  components/           # UI + theme + settings-provider + pwa
  lib/supabase/         # client, server, middleware helper, types stub
  domain/settings/      # keys + tipos + puerto (sin Supabase)
  application/settings/ # casos de uso + wiring
  adapters/supabase/    # settings-repository (client inyectado)
  middleware.ts         # refresh sesión + protege /conductor /operador
supabase/migrations/    # 0001_init … 0004_settings_grants
```

## Cómo correr en local

1. `npx supabase start` (aplica migraciones).
2. `apps/web/.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `supabase status -o env`).
3. `npm run dev` (usa webpack por Serwist).
4. Abrir `/` y `/dev/settings`.

## Fuera de scope (próximos slices)

- UI de login / signup y roles reales.
- Policies de escritura en `settings` (solo operador).
- Reservas, QR, tracking, mapas.
- Types generados con `supabase gen types`.
- Tests automatizados.

## Criterio de cierre Slice 0.5

- [x] Build de `apps/web` OK  
- [x] Settings leídos desde DB (no hardcode de negocio)  
- [x] Capas mínimas respetando AD-1 / AD-5  
- [x] Sin redirect a demo HTML  

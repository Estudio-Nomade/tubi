# Slice 1 — Auth + perfiles · Estado

**Fecha:** 2026-08-19  
**Branch de trabajo:** `feat/slice-1-auth`  
**Plan:** `docs/superpowers/plans/2026-08-19-tubi-slice-1-auth.md`

## Qué quedó listo

| Ítem | Estado |
|---|---|
| Tokens Ruta de la siesta + Fraunces / DM Sans | OK |
| Componentes design: AppHeader, Field, BtnPrimary/Secondary, ProgressDots | OK |
| Migración `0005_profiles_auth.sql` (`current_rol`, RLS profiles, grants) | OK (local) |
| Domain/application auth + Server Actions | OK |
| Middleware sesión → `/login?next=` | OK |
| Layouts por rol (`requireProfile`) | OK |
| `/login` (Pencil P10) | OK |
| `/registro` wizard pasajero (P1 + pasos extra) | OK |
| `/registro/conductor` wizard conductor (C1) | OK |
| Homes stub `/pasajero`, `/conductor`, `/operador` | OK |
| `/cuenta` + logout | OK |
| Root `/` redirect si hay sesión / landing auth | OK |
| AuthProvider client | Omitido (YAGNI, server-first) |

## Rutas

| Ruta | Acceso |
|---|---|
| `/`, `/login`, `/registro`, `/registro/conductor` | Público |
| `/pasajero` | Sesión + rol pasajero\|operador |
| `/conductor` | Sesión + rol conductor\|operador |
| `/operador` | Sesión + rol operador |
| `/cuenta` | Sesión (cualquier rol) |

## Cómo probar local

1. `npx supabase start` (migraciones 0001–0005).
2. Auth local: confirmación de email **OFF** (default local suele alcanzar).
3. `apps/web/.env.local` con URL + anon de `supabase status -o env`.
4. `npm run dev --workspace=web`
5. Flujo: registro pasajero → home → cuenta → logout → login.

## Smoke API (verificado)

Registro pasajero + conductor vía Supabase JS + insert `profiles` + login: **OK**.

## Aceptación Slice 1

- [x] Registro pasajero persiste `profiles.rol = pasajero`
- [x] Registro conductor persiste `profiles.rol = conductor`
- [x] Login email/password
- [x] Sin sesión no entra a áreas protegidas
- [x] Logout
- [x] Build `apps/web` OK
- [x] UI alineada a tokens Pencil (estructura P10/P1/C1)

## Fuera de scope (siguiente)

- OTP / OAuth
- Cifrado DNI
- Self-signup operador
- TabBar completa + búsqueda/reservas
- Types generados `supabase gen types`

## Commits sugeridos (usuario, GPG `-S`)

Agrupar o partir por logical commits del branch `feat/slice-1-auth` + restos Slice 0.5 aún unstaged.

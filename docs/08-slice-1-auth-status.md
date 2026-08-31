# Slice 1 — Auth + perfiles · Estado

**Fecha:** 2026-08-19 (setup local actualizado 2026-08-31)  
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
| SessionProvider + `useCurrentProfile()` | OK (perfil seed desde RSC; sin fetch client al montar) |
| TabBar + EmptyHint (homes empty / cuenta) | OK (stub Slice 1) |

## Rutas

| Ruta | Acceso |
|---|---|
| `/`, `/login`, `/registro`, `/registro/conductor` | Público |
| `/pasajero` | Sesión + rol pasajero\|operador |
| `/conductor` | Sesión + rol conductor\|operador |
| `/operador` | Sesión + rol operador |
| `/cuenta` | Sesión (cualquier rol) |

## Cómo probar local

1. `supabase start` (migraciones aplicadas; Auth básico no depende de imgproxy/edge/pooler).
2. Auth local: confirmación de email **OFF** (default local suele alcanzar).
3. Crear **`apps/web/.env.local`** (prioridad sobre `.env`; **nunca commitear**):
   ```bash
   supabase status -o env
   # API_URL  → NEXT_PUBLIC_SUPABASE_URL
   # ANON_KEY → NEXT_PUBLIC_SUPABASE_ANON_KEY  (preferí JWT eyJ… legacy)
   ```
   Si solo hay `sb_publishable_…` y el client falla, usá el `ANON_KEY` JWT del mismo `status -o env`.

   **Puerto real de Kong:** `supabase status` puede reportar `http://127.0.0.1:54321` aunque otro proyecto local (p.ej. Tumo) ya ocupe ese puerto. Verificá con:
   ```bash
   docker port supabase_kong_Tubi   # ej. 0.0.0.0:54421->8000/tcp
   curl -sS -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:54421/auth/v1/health"
   curl -sS -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
     "http://127.0.0.1:54421/rest/v1/profiles?select=id&limit=1"
   ```
   Si REST responde tablas de **otro** producto (orders/turnos/…), estás en el Kong equivocado: usá el host port de `supabase_kong_Tubi` en `NEXT_PUBLIC_SUPABASE_URL`.
4. Reiniciar el dev server para que Next tome el env: `bun run dev` (o workspace web).
5. Flujo: `/registro` → pasos → email+password → home `/pasajero` → `/cuenta` → logout → `/login`.

### Síntoma: UI muestra `fetch failed`

| Señal | Lectura |
|---|---|
| `POST /registro 200` + action ~10s+ | Server Action devolvió `{ error }`; espera de red a Auth |
| Mensaje crudo `fetch failed` | undici no completó HTTP (DNS muerto, host caído, URL mal apuntada) |
| Wizard “Continuar” | Ya no es el bug de reset de form (`fd25d2c`) |

**Causa frecuente:** `apps/web/.env` apunta a un project cloud (`*.supabase.co`) sin DNS, mientras Supabase **local** corre en `127.0.0.1:54321` **sin** `.env.local`.  
Fix: `.env.local` local + reiniciar dev. El código mapea errores de red a copy en español accionable (`map-auth-error.ts`); errores de negocio de Auth (email tomado, password débil) siguen pasando el mensaje original.

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

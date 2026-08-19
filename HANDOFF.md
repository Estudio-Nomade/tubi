# HANDOFF — Plataforma de Viajes Compartidos Interurbanos

> **Para quién es esto:** un agente de IA (o humano) que retoma el proyecto sin contexto previo.
> **Qué es:** el estado completo del proyecto + decisiones cerradas + qué falta. Leé todo antes de tocar nada.
> **Repo:** `https://github.com/Estudio-Nomade/tubi` (privado). Rama `main`.

---

## 1. Qué es el proyecto

Plataforma para organizar **viajes compartidos interurbanos programados**, tramo principal **Tandil ↔ Buenos Aires** (Argentina), con paradas intermedias (Rauch, Flores, etc.). Convierte la dinámica informal actual de viajes entre ciudades en un servicio **organizado, trazable y confiable**. Es una **web app mobile-first** (375px), no apps nativas.

**Actores:** pasajero · conductor · operador.
**Equipo:** Nóbel (tech) · Martina (socia) · Ariel (idea y operación) · José (consulta, 30+ años en el rubro).
**Nombre:** Tubi. Paleta, dominio y logo quedan para la fase 8.

---

## 2. Estado del proyecto

**Completado (fases 0–5, la parte de "definir"):**

| Doc | Contenido |
|---|---|
| `docs/00-roadmap.md` | Hoja de ruta y prompt maestro |
| `docs/01-prd.md` | Requisitos de producto (fuente de verdad) |
| `docs/02-arquitectura.md` | Arquitectura de solución (spine, 14 ADs) |
| `docs/03-flujos-de-usuario.md` | Flujos por actor + mapa a pantallas |
| `docs/04-modelo-de-datos.md` | Schema Postgres/Supabase + RLS + migración |
| `docs/05-api.md` | API REST + canal realtime |
| `docs/06-reglas-y-estados.md` | Máquinas de estado + reglas de negocio |

**Pendiente (fases 6–11, la parte de "diseñar y construir"):**

| Fase | Qué es | Entregable |
|---|---|---|
| 6 | Wireframes | `design-artifacts/tubi-wireframes.pen` (P0, en revisión) |
| 7 | Diseño UI | design system (tokens, componentes) |
| 8 | Marca | `docs/07-marca.md` (nombre, dominio, paleta, logo) |
| 9 | Implementación MVP (P0) | código |
| 10 | Demo y validación | demo funcional con Ariel (+ José) |
| 11 | Deploy | dominio, hosting, producción |

> **Aclaración de "fases":** el roadmap usa **fase 0–11** para el *desarrollo*. En el PRD, "fase 1" y "fase 2" se refieren a **etapas del producto** (fase 1 = MVP/verificación manual; fase 2 = post-MVP/ratings). No confundir.

---

## 3. Decisiones cerradas (NO re-litigar)

- Web app mobile-first (375px), no apps nativas. Ruta principal Tandil ↔ Buenos Aires con paradas intermedias.
- **Seña** de compromiso al reservar (por **transferencia**, con comprobante y confirmación manual del operador). **Saldo** al subir, en **efectivo** o **transferencia**. **NO hay pasarela ni MercadoPago.**
- Identificación del pasajero por **QR** (token opaco) que escanea el conductor; validación server-side contra viaje↔conductor↔vehículo.
- Estados del viaje: `programado → recogida → en_curso → completado / cancelado`.
- Seguimiento GPS en vivo con **cola offline** (IndexedDB, idempotente) para tramos sin cobertura.
- Política de espera en recogida (default 5 min) + recogida secuencial tipo Uber (sobre todo en Tandil).
- Registro pasajero: nombre + DNI + contacto. Registro conductor: nombre + apellido + teléfono.
- Vehículo: patente, marca, modelo, color, capacidad. Viajes programados todos los días, incluso con un solo pasajero al inicio.
- **Arquitectura:** monolito modular por capas con puertos y adaptadores. Supabase (Postgres + Auth + Realtime + RLS + Storage + Edge Functions). Pagos/mapas/DNI detrás de interfaces (`PaymentProvider`, `MapsProvider`, `IdentityVerifier`).
- **GPS en background:** MVP = conductor con pantalla encendida (primer plano). El tracking real con pantalla apagada se habilita post-MVP con **Capacitor** (mismo código), no apps nativas.
- **Config en dos capas:** `.env` (secretos: URL Supabase, API key de mapas) + tabla `settings` (negocio, editable sin redeploy). **Nunca hardcodear valores de negocio.**

**Parámetros de negocio (settings, defaults):** precio base por ruta (a definir) · tarifa fija por ruta · comisión 15% (0–15) · seña $5.000 · espera 5 min · devolución de seña (>24h 100%, 12–24h 50%, <12h/no-show 0%) · pagos efectivo+transferencia · DNI manual · ratings deshabilitado.

---

## 4. Arquitectura (resumen)

- **Paradigma:** capas → Presentación (Next.js) → Aplicación (casos de uso) → Dominio (entidades + reglas puras) → Puertos (interfaces) → Adaptadores (Google Maps, Supabase, pagos manuales). El dominio no depende de nada externo.
- **Stack (verificado 2026-08):** Next.js 16 + React 19 + Tailwind 4 + shadcn/ui + Supabase (`@supabase/supabase-js` 2.x) + Google Maps + Serwist (PWA) + Zod. npm (Node 22).
- **Posición en vivo (AD-6):** el conductor escribe en `tracking_events`; los pasajeros se suscriben a **Postgres Changes** de esa tabla (una sola fuente: vivo + historial).
- **Cola offline (AD-7):** IndexedDB en el dispositivo, flush ordenado por `ts`, idempotente por `client_id`.
- **QR (AD-11):** token opaco, sin datos personales, validación server-side.
- **DNI (AD-13):** cifrado (pgcrypto), acceso restringido a dueño + operador; el conductor no lo ve.

---

## 5. Modelo de datos (resumen)

Tablas (singular; Supabase-idiomáticas en plural): `profiles` (rol, nombre, apellido, telefono, dni cifrado) · `vehiculo` · `ruta` · `parada` · `viaje` (snapshot de precio) · `reserva` (snapshot de seña + política, `qr_token` único) · `pago` (tipo sena/saldo, metodo efectivo/transferencia) · `tracking_events` (client_id único, ts del dispositivo) · `settings` (clave PK, valor jsonb).

RLS activo en todo. Migración completa en `docs/04-modelo-de-datos.md`.

---

## 6. API (resumen)

Base `/api`, auth Supabase JWT, envelope `{ data }` / `{ error: { code, message } }`. Endpoints clave: `GET /viajes`, `POST /reservas`, `GET /reservas/{id}/qr`, `POST /reservas/verificar`, `POST /pagos/seña`, `POST /pagos/{id}/confirmar`, `POST /pagos/saldo`, `POST /viajes/{id}/posicion` (+ `/batch`), `GET/PUT /settings`. Canal realtime = Postgres Changes sobre `tracking_events` (sin polling). Códigos de error de negocio en `docs/05-api.md`.

---

## 7. Reglas de negocio (resumen)

- **Seña:** al reservar, transferencia + comprobante → reserva `pendiente_sena`; el operador confirma → `confirmada` → recién ahí QR utilizable.
- **Saldo** = `viaje.precio − monto_seña`, al subir.
- **Devolución por cancelación:** antelación >24h → 100%, 12–24h → 50%, <12h/no-show → 0%.
- **Espera:** máx 5 min por pasajero; vencido → `no_show`, seña retenida, el viaje continúa.
- **Capacidad:** `asientos_libres = capacidad − reservas activas`; si ≤ 0 → `RESERVA_SIN_ASIENTOS`.
- Máquinas de estado completas (viaje, reserva, pago) en `docs/06-reglas-y-estados.md`.

---

## 8. Convenciones de trabajo

- **Idioma:** español argentino, formal pero claro, concreto, sin relleno.
- **Git (estándar BMAD):** Conventional Commits (`feat`/`fix`/`docs`/`chore`/`refactor`), branches `<agent>/<desc>`, un cambio por commit, nunca `git add .`, nunca force-push a main, `Co-Authored-By` cuando un agente escribe el commit.
- **Nunca** hardcodear valores de negocio: siempre settings.
- Proveedores siempre detrás de interfaces. `.env` nunca se commitea.
- **LIFTY** (`~/Documentos/LIfty`) es un proyecto aparte: solo consultar por herramientas/flujos reutilizables y **siempre con confirmación explícita** del usuario.
- **BMAD** (framework) vive en `~/Documentos/Estudio Nomade/Tumo/_bmad`; sus fases y estándar de git son referencia.

---

## 9. Instrucciones para el agente

1. **Arrancá por la fase 6** (wireframes) salvo que te indiquen otra. Una fase a la vez: terminá el entregable y esperá OK antes de pasar a la siguiente.
2. **Respetá las decisiones cerradas** (sección 3). Si algo te parece mal, no lo cambies por tu cuenta: señalalo y preguntá.
3. **No re-decidas** el nombre (Tubi), stack, ni modelo de pago (efectivo/transferencia, sin pasarela). Paleta/dominio/logo siguen en fase 8.
4. Antes de implementar (fase 9), releé `docs/02` (ADs), `docs/04` (schema), `docs/06` (reglas). La configuración en dos capas y las interfaces de providers se respetan en TODO el código.
5. Respondé en español argentino, concreto, sin relleno. La IA es herramienta de implementación; el criterio técnico y las decisiones son del equipo.

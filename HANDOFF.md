# HANDOFF — Tubi

> **Para quién es esto:** un agente de IA (o humano) que retoma el proyecto sin contexto previo.
> **Prompt listo para pegar:** [`docs/PROMPT-AGENTE.md`](docs/PROMPT-AGENTE.md) (orquestación) · [`docs/PROMPT-UI-PENCIL.md`](docs/PROMPT-UI-PENCIL.md) (UI en Pencil / shadcn) · [`docs/PROMPT-IMPLEMENTACION.md`](docs/PROMPT-IMPLEMENTACION.md) (código MVP).
> **Repo:** `https://github.com/Estudio-Nomade/tubi` (privado). Trabajo actual en `grok/fase-6-wireframes` (no mergeado a `main`).

---

## 1. Qué es el proyecto

**Tubi** organiza **viajes compartidos interurbanos programados**, tramo principal **Tandil ↔ Buenos Aires**, paradas intermedias (Rauch, Flores). Web app mobile-first (375px), no nativas.

**Actores:** pasajero · conductor · operador.
**Equipo:** Nóbel (tech) · Martina (socia) · Ariel (idea y operación) · José (consulta).
**Nombre:** Tubi. Paleta, dominio y logo = fase 8.

---

## 2. Estado del proyecto

**Hecho (definir + wireframes P0 + base código Slice 0.5):**

| Doc / artefacto | Contenido |
|---|---|
| `docs/00-roadmap.md` | Hoja de ruta |
| `docs/01-prd.md` | PRD (fuente de verdad) |
| `docs/02-arquitectura.md` | Spine, 15 ADs |
| `docs/03-flujos-de-usuario.md` | Flujos + contrato de pantallas |
| `docs/04-modelo-de-datos.md` | Schema + RLS + migración |
| `docs/05-api.md` | REST + realtime |
| `docs/06-reglas-y-estados.md` | Máquinas de estado |
| `docs/07-slice-0.5-status.md` | **Base Next/Supabase/settings lista** |
| `docs/08-slice-1-auth-status.md` | **Auth + roles + login/registro** |
| `docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md` | Spec de 15 frames |
| `design-artifacts/tubi-wireframes.pen` | Pencil 2.14 |
| `design-artifacts/previews/*.png` | Capturas 01–15 |
| `apps/web` | Next 16 app: supabase clients, middleware, settings layers, PWA shell |
| `supabase/migrations` | 0001–0004 (schema, seed settings, SELECT policies + grants) |

**Pendiente:**

| Fase | Qué | Nota |
|---|---|---|
| 6 | OK visual de wireframes | Entregable existe; falta OK del usuario |
| 8 | Marca | Nombre ya cerrado. Falta doc de marca (dominio, paleta, tipo, logo) |
| 7 | UI / design system | Después de marca (tokens definitivos) |
| 9 | Código MVP | **Slice 0.5 + Slice 1 (auth) cerrados** → sigue reservas, QR, tracking |
| 10 | Demo Ariel (+ José) | |
| 11 | Deploy | |

**Código (Slice 0.5):** base sólida para features. Detalle en `docs/07-slice-0.5-status.md`.  
**Siguiente implementación sugerida:** Auth + login, o flujo de reservas.

Roadmap 0–11 = desarrollo. PRD “fase 1/2” = etapas de producto. No confundir.

---

## 3. Decisiones cerradas (NO re-litigar)

- Web app 375px. Ruta Tandil ↔ Buenos Aires + intermedias.
- Seña por transferencia + comprobante + confirmación manual. Saldo al subir: efectivo o transferencia. **Sin pasarela / MercadoPago.**
- QR opaco, escaneo del conductor, validación server-side.
- Viaje: `programado → recogida → en_curso → completado / cancelado`.
- GPS en vivo + cola offline. MVP = pantalla encendida. Capacitor post-MVP.
- Espera 5 min + recogida secuencial. Viaje sale aunque haya un solo pasajero.
- Registro mínimo pasajero / conductor / vehículo como en `AGENTS.md`.
- Stack: Next.js 16, React 19, Tailwind 4, shadcn, Supabase, Google Maps vía puerto, Serwist, Zod.
- Config: `.env` secretos + tabla `settings` negocio. Nunca hardcodear negocio.
- Wireframe accent `#0D9488` no es paleta final.

**Settings defaults:** tarifa fija por ruta · comisión 15% · seña $5.000 · espera 5 min · devolución 100/50/0 · ratings off.

---

## 4–7. Arquitectura, datos, API, reglas

Sin cambios. Ver secciones equivalentes del HANDOFF anterior o los docs `02`–`06`. Resumen corto:

- Capas + puertos (`PaymentProvider`, `MapsProvider`, `IdentityVerifier`).
- Tablas: `profiles`, `vehiculo`, `ruta`, `parada`, `viaje`, `reserva`, `pago`, `tracking_events`, `settings`.
- API `/api` + Postgres Changes sobre `tracking_events`.
- Seña: `pendiente_sena` → operador confirma → `confirmada` → QR usable.

---

## 8. Convenciones

Ver `AGENTS.md`. BMAD en `~/Documentos/Estudio Nomade/Tumo/_bmad`. LIFTY es otro repo: no copiar sin OK.

**Pencil:** AppImage en `~/Descargas/Pencil`. CLI `@pen.dev/cli`. Escritorio abre solo `.pen` **2.14** con `fileToken`. Claude Code no está logueado.

---

## 9. Instrucciones para el agente

1. La base de código Slice 0.5 ya está: leé `docs/07-slice-0.5-status.md` antes de features.
2. No re-decidas nombre, stack ni pagos. Nunca hardcodees negocio: usá `settings`.
3. Antes de features: `docs/02`, `docs/04`, `docs/06` + capas en `apps/web/src/{domain,application,adapters}`.
4. Prompts: `docs/PROMPT-AGENTE.md` · `docs/PROMPT-UI-PENCIL.md` · `docs/PROMPT-IMPLEMENTACION.md`.
5. Español argentino, concreto. Esperá OK al cerrar cada entregable.

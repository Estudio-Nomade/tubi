# HANDOFF — Tubi

> **Para quién es esto:** un agente de IA (o humano) que retoma el proyecto sin contexto previo.
> **Prompt listo para pegar:** [`docs/PROMPT-AGENTE.md`](docs/PROMPT-AGENTE.md) (orquestación) · [`docs/PROMPT-IMPLEMENTACION.md`](docs/PROMPT-IMPLEMENTACION.md) (implementación del MVP).
> **Repo:** `https://github.com/Estudio-Nomade/tubi` (privado). Trabajo actual en `grok/fase-6-wireframes` (no mergeado a `main`).

---

## 1. Qué es el proyecto

**Tubi** organiza **viajes compartidos interurbanos programados**, tramo principal **Tandil ↔ Buenos Aires**, paradas intermedias (Rauch, Flores). Web app mobile-first (375px), no nativas.

**Actores:** pasajero · conductor · operador.
**Equipo:** Nóbel (tech) · Martina (socia) · Ariel (idea y operación) · José (consulta).
**Nombre:** Tubi. Paleta, dominio y logo = fase 8.

---

## 2. Estado del proyecto

**Hecho (definir + wireframes P0):**

| Doc / artefacto | Contenido |
|---|---|
| `docs/00-roadmap.md` | Hoja de ruta |
| `docs/01-prd.md` | PRD (fuente de verdad) |
| `docs/02-arquitectura.md` | Spine, 14 ADs |
| `docs/03-flujos-de-usuario.md` | Flujos + contrato de pantallas |
| `docs/04-modelo-de-datos.md` | Schema + RLS + migración |
| `docs/05-api.md` | REST + realtime |
| `docs/06-reglas-y-estados.md` | Máquinas de estado |
| `docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md` | Spec de 15 frames |
| `design-artifacts/tubi-wireframes.pen` | Pencil 2.14 |
| `design-artifacts/previews/*.png` | Capturas 01–15 |

**Pendiente:**

| Fase | Qué | Nota |
|---|---|---|
| 6 | OK visual de wireframes | Entregable existe; falta OK del usuario |
| 8 | Marca | Nombre ya cerrado. Falta `docs/07-marca.md` (dominio, paleta, tipo, logo) |
| 7 | UI / design system | Después de marca |
| 9 | Código MVP | No hay app todavía |
| 10 | Demo Ariel (+ José) | |
| 11 | Deploy | |

**Orden acordado:** OK wireframes → marca (8) → UI (7) → código (9).

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

1. Empezá por el OK de wireframes o, si ya está, por **fase 8 (marca)**. Una fase a la vez.
2. No re-decidas nombre, stack ni pagos.
3. Antes de código: `docs/02`, `docs/04`, `docs/06`.
4. Prompt de orquestación: `docs/PROMPT-AGENTE.md`. Prompt de implementación: `docs/PROMPT-IMPLEMENTACION.md`.
5. Español argentino, concreto. Esperá OK al cerrar cada entregable.

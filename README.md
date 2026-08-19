# Tubi

> Viajes compartidos interurbanos programados. Nombre cerrado: **Tubi**. Paleta, dominio y logo quedan para la fase 8.

Plataforma para organizar viajes compartidos interurbanos programados, con tramo principal **Tandil ↔ Buenos Aires** (Argentina) y paradas intermedias (Rauch, Flores, etc.). Convierte la dinámica informal actual de viajes entre ciudades en un servicio **organizado, trazable y confiable**.

## Estado

Fases 0–5 hechas (PRD, arquitectura, flujos, datos, API, reglas). En curso: fase 6 (wireframes). Pendientes: UI, marca, MVP, demo y deploy.

## Documentación

| Doc | Contenido |
|---|---|
| [`docs/00-roadmap.md`](docs/00-roadmap.md) | Hoja de ruta, orden de trabajo y prompt maestro |
| [`docs/01-prd.md`](docs/01-prd.md) | Requisitos de producto — **fuente de verdad** |
| [`docs/02-arquitectura.md`](docs/02-arquitectura.md) | Arquitectura de solución (spine) |
| [`docs/03-flujos-de-usuario.md`](docs/03-flujos-de-usuario.md) | Flujos de usuario (pasajero, conductor, operador) |
| [`docs/04-modelo-de-datos.md`](docs/04-modelo-de-datos.md) | Modelo de datos (schema Postgres/Supabase) |
| [`docs/05-api.md`](docs/05-api.md) | API y contratos (endpoints + realtime) |
| [`docs/06-reglas-y-estados.md`](docs/06-reglas-y-estados.md) | Reglas de negocio y máquinas de estado |
| [`design-artifacts/tubi-wireframes.pen`](design-artifacts/tubi-wireframes.pen) | Wireframes P0 (Pencil) |

## Roadmap (resumen)

`0 Setup → 1 Arquitectura → 2 Flujos de usuario → 3 Modelo de datos → 4 API → 5 Reglas y estados → 6 Wireframes → 7 Diseño UI → 8 Marca → 9 MVP → 10 Demo → 11 Deploy`

## Roles del proyecto

- **Nóbel** — tecnología y desarrollo de la plataforma
- **Martina** — socia
- **Ariel** — idea original y operación del servicio
- **José** — consulta práctica (30+ años en el rubro)

## Convenciones de trabajo

Ver [`AGENTS.md`](AGENTS.md). Handoff: [`HANDOFF.md`](HANDOFF.md). Prompt para otro agente: [`docs/PROMPT-AGENTE.md`](docs/PROMPT-AGENTE.md).

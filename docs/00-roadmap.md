# Roadmap y Prompt Maestro — Plataforma de Viajes Compartidos

> Este archivo es la **guía de trabajo** del proyecto. Contiene: (A) la fuente de verdad condensada, (B) el orden de los próximos pasos, (C) un prompt maestro autocontenido para reusar, y (D) prompts disparadores por fase.
>
> Documentos relacionados: `docs/01-prd.md` (requisitos de producto, fuente de verdad completa).

---

## A. Fuente de verdad (resumen condensado de la app)

**Qué es:** plataforma para organizar viajes compartidos interurbanos programados, tramo principal **Tandil ↔ Buenos Aires**, con paradas intermedias (Rauch, Flores, etc.). Convierte una dinámica hoy informal en un servicio organizado, trazable y confiable.

**Actores:** pasajero, conductor, operador.

**Decisiones cerradas (no se discuten):**
- Web app, no nativas. Mobile-first (375px), se usa del celular.
- Ruta principal Tandil ↔ Buenos Aires con paradas intermedias.
- Seña de compromiso al reservar; saldo se paga al subir.
- Identificación del pasajero con QR que escanea el conductor.
- Estados del viaje: programado → recogida → en curso → completado / cancelado.
- Seguimiento GPS en vivo con cola offline para tramos sin cobertura.
- Política de espera en recogida (default 5 min).
- Recogida secuencial tipo Uber (sobre todo en Tandil).
- Registro mínimo del pasajero: nombre + DNI + contacto.
- Vehículo con patente, marca, modelo, color, capacidad.
- Viajes programados todos los días, incluso con un solo pasajero al inicio.

**Parámetros de negocio (configurables, NO hardcodeados):**

| Parámetro | Default |
|---|---|
| Precio base Tandil↔BsAs | a definir por el operador |
| Modelo de tarifa | fijo por ruta |
| Comisión plataforma | 15% (0–15%) |
| Monto de seña | $5.000 |
| Tiempo máx. espera | 5 min |
| Devolución de seña | >24h → 100%, 12–24h → 50%, <12h o no-show → 0% |
| Pasarela de pago | MercadoPago (detrás de `PaymentProvider`) |
| Mapas/GPS | Google Maps (detrás de `MapsProvider`) |
| Verificación DNI | manual fase 1 (detrás de `IdentityVerifier`) |
| Ratings | deshabilitado (fase 2, feature flag) |

**Configuración en dos capas:** `.env` (secretos: keys MercadoPago, URL Supabase) + tabla de `settings` en DB (parámetros de negocio editables sin redeploy).

**Requisito no funcional clave:** el dispositivo del conductor debe transmitir posición en background (pantalla apagada) y encolar posiciones offline sincronizando al recuperar conexión. *La implementación (web vs PWA vs app) se decide en arquitectura, no en producto.*

**Entidades:** pasajero, conductor, vehículo, ruta, parada, viaje, asiento, reserva, pago, evento de seguimiento GPS, setting.

**Contexto del equipo:** Nóbel = tecnología/desarrollo · Martina = socia · Ariel = impulsa la idea y opera · José (30+ años en el rubro) = consulta práctica eventual. Ariel quiere propiedad y control de la plataforma (no se entrega a terceros).

**Hitos:** demo funcional la semana siguiente a la reunión. Presupuesto inicial: dominio ~$12.000–20.000 ARS/año; ~USD 30 para herramientas de IA. Infra de servidores inicialmente con recursos disponibles sin costo significativo.

---

## B. Roadmap ordenado (qué hacer primero, qué después)

El criterio de orden: **primero definir (arquitectura, flujos y datos), después diseñar (UX y marca), recién después construir.** Los flujos de usuario van antes de los wireframes: definen el contrato de pantallas. La marca va al final porque el nombre, el dominio y la paleta dependen de lo que la plataforma *sea* y *haga*, no al revés.

| # | Fase | Entregable | Por qué en este orden |
|---|---|---|---|
| 0 | Setup del repo | git init, `.gitignore`, `README.md`, `AGENTS.md`, repo en GitHub | Todo lo demás vive acá; sin esto no hay trazabilidad |
| 1 | Arquitectura | `docs/02-arquitectura.md` | Decide stack, web vs PWA, realtime y providers; condiciona todo |
| 2 | Flujos de usuario | `docs/03-flujos-de-usuario.md` | Diagrama todos los flujos por actor; define el contrato de pantallas |
| 3 | Modelo de datos | `docs/04-modelo-de-datos.md` + migraciones | Formaliza las entidades del PRD en schema real |
| 4 | API y contratos | `docs/05-api.md` | Define endpoints + canal realtime de posición |
| 5 | Reglas y estados | `docs/06-reglas-y-estados.md` | Máquina de estados de viaje/reserva + reglas de negocio en función de settings |
| 6 | Wireframes UX | wireframes por flujo (Pencil) | Valida los flujos antes de gastar en diseño visual |
| 7 | Diseño UI / design system | componentes y tokens | Base visual consistente |
| 8 | Marca | `docs/07-marca.md` (nombre, dominio, paleta, tipografía, logo) | Nombre y paleta se eligen cuando ya se sabe qué es el producto |
| 9 | Implementación P0 (MVP) | código del MVP, por partes | Construir sobre decisiones ya tomadas |
| 10 | Demo y validación | demo funcional con Ariel (+ José) | Hito acordado |
| 11 | Deploy y operación | dominio, hosting, puesta en producción | Cierre del ciclo inicial |

**Reglas de trabajo transversales (aplican a todas las fases):**
- El sistema de configuración (`.env` + settings) se diseña desde la fase 1 y se respeta en todas.
- Pagos/mapas/DNI siempre detrás de interfaces (`PaymentProvider`, `MapsProvider`, `IdentityVerifier`).
- No hardcodear valores de negocio: siempre settings.
- La IA se usa como **herramienta de implementación**, no como reemplazo del criterio técnico: primero se define, después se construye.
- Antes de tomar algo de **LIFTY** (proyecto aparte), pedir confirmación explícita.

---

## C. Prompt maestro (autocontenido, para reusar)

> Copiar todo el bloque siguiente y pegarlo para arrancar (o retomar) el proceso guiado. Es autocontenido: no necesita el resto del repo para arrancar.

````markdown
Estamos construyendo una plataforma de viajes compartidos interurbanos programados,
tramo principal Tandil ↔ Buenos Aires (Argentina), con paradas intermedias (Rauch, Flores).
Es una web app mobile-first (375px), no apps nativas.

DECISIONES CERRADAS (no las discutas, incorporalas):
- Seña de compromiso al reservar; el saldo se paga al subir al vehículo.
- Identificación del pasajero por QR que escanea el conductor.
- Estados del viaje: programado → recogida → en curso → completado / cancelado.
- Seguimiento GPS en vivo con cola offline para tramos sin cobertura.
- Política de espera en recogida (default 5 min), recogida secuencial tipo Uber.
- Registro mínimo de pasajero: nombre + DNI + contacto.
- Vehículo: patente, marca, modelo, color, capacidad.
- Viajes programados todos los días, incluso con un solo pasajero al inicio.

PARÁMETROS DE NEGOCIO CONFIGURABLES (modelar como settings editables por el operador, no constantes):
precio base por ruta (a definir) · tarifa fija por ruta · comisión 15% (0–15%) ·
seña $5.000 · espera máx 5 min · devolución de seña (>24h 100%, 12–24h 50%, <12h/no-show 0%) ·
pasarela MercadoPago (detrás de PaymentProvider) · mapas Google Maps (detrás de MapsProvider) ·
verificación de DNI manual fase 1 (detrás de IdentityVerifier) · ratings deshabilitado (fase 2, feature flag).

CONFIGURACIÓN EN DOS CAPAS: .env (secretos: keys MercadoPago, URL Supabase) +
tabla de settings en DB (negocio, editable sin redeploy).

REQUISITO NO FUNCIONAL CLAVE: el dispositivo del conductor transmite posición en background
(pantalla apagada) y encola posiciones offline sincronizando al recuperar conexión.
La implementación (web vs PWA vs app) se resuelve en la fase de arquitectura.

ENTIDADES: pasajero, conductor, vehículo, ruta, parada, viaje, asiento, reserva,
pago, evento de seguimiento GPS, setting.

ORDEN DE TRABAJO (guiame paso a paso, una fase a la vez, sin saltear):
0) Setup: git, .gitignore, README, AGENTS.md, repo GitHub.
1) Arquitectura (docs/02-arquitectura.md): stack, web vs PWA para el GPS en background,
   realtime, providers detrás de interfaces.
2) Flujos de usuario (docs/03-flujos-de-usuario.md): diagramas de todos los flujos por actor.
3) Modelo de datos (docs/04-modelo-de-datos.md): schema real de las entidades.
4) API y contratos (docs/05-api.md): endpoints + canal realtime de posición.
5) Reglas y estados (docs/06-reglas-y-estados.md): máquina de estados + reglas de negocio.
6) Wireframes UX por flujo (Pencil).
7) Diseño UI / design system (componentes, tokens).
8) Marca (docs/07-marca.md): nombre, dominio, paleta de colores, tipografía, logo.
9) Implementación P0 (MVP) por partes.
10) Demo y validación con el cliente (+ consulta a un experto del rubro).
11) Deploy y operación (dominio, hosting).

REGLAS DE TRABAJO:
- Empezá SIEMPRE por la fase en curso y terminá su entregable antes de pasar a la siguiente.
- Al terminar cada fase, mostrame el entregable y esperá mi OK antes de seguir.
- No hardcodees valores de negocio: siempre settings.
- La IA es herramienta de implementación; el criterio técnico y las decisiones son mías.
- No definas nombre/marca hasta la fase 8 (usá placeholder "la plataforma" hasta entonces).
- Respondé en español argentino, concreto, sin relleno.

Decime qué fase querés arrancar (o si arranco por la 0) y avanzá.
````

---

## D. Prompts disparadores por fase

Cada uno asume que ya existe el contexto del prompt maestro. Para arrancar una fase puntual, pegar el maestro + el disparador correspondiente.

- **Fase 0 — Setup:** "Ejecutá la fase 0: inicializá el repo (git, .gitignore), escribí README.md y AGENTS.md con las convenciones del proyecto y prepará todo para subir a GitHub."
- **Fase 1 — Arquitectura:** "Ejecutá la fase 1 y escribí docs/02-arquitectura.md: definí el stack, resolvé web vs PWA vs app para el GPS en background (NFR-02), el canal realtime de posición, y cómo quedan PaymentProvider / MapsProvider / IdentityVerifier."
- **Fase 2 — Flujos de usuario:** "Ejecutá la fase 2 y escribí docs/03-flujos-de-usuario.md: diagramá todos los flujos por actor (pasajero, conductor, operador) con mermaid, y mapeá cada flujo a las pantallas que alimentarán los wireframes."
- **Fase 3 — Modelo de datos:** "Ejecutá la fase 3 y escribí docs/04-modelo-de-datos.md: schema real (tablas, columnas, enums, índices, RLS) a partir de las entidades del PRD, más las migraciones SQL."
- **Fase 4 — API:** "Ejecutá la fase 4 y escribí docs/05-api.md: endpoints/RPC, contratos request/response, errores y el canal realtime de posición."
- **Fase 5 — Reglas y estados:** "Ejecutá la fase 5 y escribí docs/06-reglas-y-estados.md: máquina de estados de viaje y reserva y las reglas de negocio expresadas en función de los settings."
- **Fase 6 — Wireframes:** "Ejecutá la fase 6: armá wireframes por flujo (búsqueda, detalle, reserva, pago de seña, QR, escaneo del conductor, seguimiento, panel operador)."
- **Fase 7 — Diseño UI:** "Ejecutá la fase 7: definí el design system (tokens de color/espaciado/tipografía y componentes base)."
- **Fase 8 — Marca:** "Ejecutá la fase 8 y escribí docs/07-marca.md: proponé nombres con dominio disponible (~$12–20k ARS/año), paleta de colores, tipografía y dirección de logo."
- **Fase 9 — Implementación:** "Ejecutá la fase 9: construí el MVP (P0) por partes, usando IA como herramienta, respetando el sistema de configuración y las interfaces de providers."
- **Fase 10 — Demo:** "Ejecutá la fase 10: prepará y probá la demo funcional de los flujos principales."
- **Fase 11 — Deploy:** "Ejecutá la fase 11: definí dominio, hosting e infra para puesta en producción."

# Prompt de Implementación — Tubi (MVP P0)

> **Para quién es esto:** un agente de implementación (Claude Code, Codex, etc.) que va a **construir el código del MVP** de Tubi.
> **Cómo usarlo:** pegá este archivo entero como primer mensaje del agente. Es autocontenido.
> **Repo:** `/home/marti/Documentos/Estudio Nomade/Tubi` · rama de trabajo `grok/fase-6-wireframes` (o la que indique el usuario). Remoto: `https://github.com/Estudio-Nomade/tubi` (privado).

---

## Tu rol

Sos el agente de **implementación** de Tubi. Todo el *qué* ya está especificado (PRD, arquitectura, modelo de datos, API, reglas) y el *cómo se ve* está en wireframes (15 pantallas). Tu trabajo es **construir el MVP por partes, respetando esas especificaciones sin re-decidirlas**. No sos arquitecto ni product manager: si algo de la spec te parece mal, lo señalás y preguntás, no lo cambiás por tu cuenta.

**UI con shadcn/ui.** Construís toda la interfaz con **shadcn/ui** (componentes sobre Tailwind CSS + Radix). No inventes estilos a mano donde ya exista un componente de shadcn.

Respondé en **español argentino**, formal pero claro, concreto, sin relleno.

---

## Qué es Tubi

Web app **mobile-first (375px)** de **viajes compartidos interurbanos programados**, tramo principal **Tandil ↔ Buenos Aires**, paradas intermedias (Rauch, Flores). No es Uber on-demand, no es app nativa.

**Actores:** pasajero · conductor · operador.

**Flujo feliz (la demo):** buscar viaje → reservar + pagar seña (transferencia) → recibir QR → conductor escanea QR → pagar saldo (efectivo/transferencia) → GPS en vivo hasta destino.

---

## Decisiones cerradas (NO re-litigar)

- **Nombre:** Tubi. **Sin MercadoPago.** Pagos = **efectivo + transferencia** (confirmación manual).
- Seña al reservar por transferencia + comprobante + confirmación **manual del operador**. Saldo al subir: efectivo o transferencia.
- QR **opaco** (sin datos personales), lo escanea el conductor, validación **server-side** contra viaje↔conductor↔vehículo.
- Estados viaje: `programado → recogida → en_curso → completado / cancelado`. Reserva: `pendiente_sena → confirmada → verificada → abordada / cancelada / no_show`. Pago: `pendiente → confirmado / rechazado`.
- GPS en vivo + **cola offline** (IndexedDB, idempotente por `client_id`). MVP: conductor con pantalla encendida (background real = Capacitor, post-MVP).
- Espera 5 min por pasajero → no-show y se sigue. Recogida secuencial tipo Uber.
- Registro: pasajero (nombre + DNI + contacto) · conductor (nombre + apellido + teléfono). Vehículo: patente, marca, modelo, color, capacidad.
- Viajes todos los días, incluso con un solo pasajero.
- **Config en dos capas:** `.env` = secretos (nunca commitear). Tabla `settings` = negocio. **Nunca hardcodear valores de negocio** ($5.000, 15%, 5 min → siempre settings).
- Settings defaults: tarifa fija por ruta (precio a definir) · comisión 15% · seña $5.000 · espera 5 min · devolución >24h 100% / 12–24h 50% / <12h o no-show 0% · ratings off · pagos `["efectivo","transferencia"]`.

---

## Stack y arquitectura (obligatorio)

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + **shadcn/ui** + Supabase (`@supabase/supabase-js` 2.x: Postgres, Auth, Realtime, RLS, Storage, Edge Functions) + Google Maps detrás de `MapsProvider` + Serwist (PWA) + Zod. npm, Node 22.
- **UI = shadcn/ui.** Todos los componentes de UI salen de shadcn (vía `npx shadcn@latest add …`). No crees botones, inputs, cards, dialogs ni toasts a mano si shadcn ya los tiene.
- **Paradigma:** monolito modular por capas con **puertos y adaptadores**. El dominio no importa React, Supabase, shadcn ni SDKs. Dependencias siempre hacia adentro: presentación → aplicación → dominio/puertos → adaptadores.
- **Puertos (interfaces) obligatorios:** `PaymentProvider` (pagos efectivo/transferencia, confirmación manual), `MapsProvider` (Google Maps), `IdentityVerifier` (DNI manual fase 1).
- **Estructura** (AD-14): `apps/web/` (Next.js) + `supabase/` (migraciones y funciones) + `packages/` (solo si hay dominio compartido real; si no, saltealo). `docs/` y `design-artifacts/` quedan en la raíz.
- **Tiempo real:** el conductor escribe en `tracking_events`; los pasajeros se suscriben a **Postgres Changes** de esa tabla (sin polling, sin WebSocket propio).
- **DNI:** cifrado (pgcrypto), acceso restringido a dueño + operador. El conductor no lo ve.

### UI con shadcn/ui — tema y convenciones

- **Tema vía CSS variables** (Tailwind 4 + shadcn). Configurá los tokens para que coincidan con la paleta del wireframe (provisional, hasta que la marca de la fase 8 la reemplace):
  - `--background: #FFFFFF` · `--foreground: #18181B` · `--muted-foreground: #71717A` · `--border: #E4E4E7` · `--primary: #0D9488` (turquesa) · `--destructive: #B91C1C` · tarjetas `#FFFFFF` (separadas por `ring-foreground/10`).
- **Mobile-first 375px.** Header sticky 56px (wordmark "Tubi" + rol). CTA primario `Button size="lg"` full-width, 48px, abajo del contenido (alcance del pulgar).
- **Acento turquesa** solo en: wordmark, CTA primario, foco de input, chip de estado activo y marco del QR. No abuses del color.
- **Notificaciones** con `sonner` (toasts) para: seña enviada, seña confirmada, QR inválido, no-show, cambio de estado.
- Componentes shadcn que vas a usar sí o sí: `Button`, `Input`, `Label`, `Card`, `Badge`, `Separator`, `Dialog`, `Sheet`, `AlertDialog`, `Select`, `Switch`, `RadioGroup`, `Textarea`, `Tabs`, `Progress`, `Skeleton`, `Sonner`, `Calendar` (fecha).

**Mapa pantallas → shadcn (guía, no límite):**

| # | Pantalla | shadcn / UI |
|---|---|---|
| 1 | Registro pasajero | `Card`, `Input`, `Label`, `Button`, `Separator` |
| 2 | Búsqueda | `Card`, `Select` (origen/destino), `Calendar` (fecha), `Input` (hora), `Button` |
| 3 | Resultados | `Card` (lista), `Badge` (asientos/estado), `Button` |
| 4 | Detalle | `Card`, `Badge`, `Separator`, `Button` |
| 5 | Checkout seña | `Card`, `Input`, `Label`, `Textarea` (comprobante), `Button`, `Alert` |
| 6 | QR | `Card`, `Badge` (estado), QR con `qrcode.react`, `AlertDialog` (cancelar) |
| 7 | Seguimiento | `Card`, mapa (`MapsProvider`), `Skeleton` (carga), `Badge` (ETA) |
| 8 | Registro conductor | `Card`, `Input`, `Label`, `Button` |
| 9 | Viajes del día | `Tabs`, `Card` (lista), `Badge` (ocupación) |
| 10 | Recogida | `Card`, lista de paradas, `Badge` (timer), `Progress`, `Button` (no-show) |
| 11 | Escanear QR | visor de cámara (ej. `@zxing/browser` o `html5-qrcode`), `Alert` (válido/rechazado), `Badge` |
| 12 | Saldo | `Card`, `RadioGroup` (efectivo/transferencia), `Input` (monto), `Button` |
| 13 | En ruta | `Card`, `Badge` (estado), `Switch` (GPS activo), `Button` (completar) |
| 14 | Confirmar seña | `Card`, imagen del comprobante, `Button` (confirmar/rechazar), `Alert` |
| 15 | Settings | `Card`, `Input`, `Label`, `Switch`, `Select`, `Button` (guardar) |

> QR: generarlo con `qrcode.react`; escanearlo con una lib de cámara. Son dependencias funcionales (no shadcn), pero la pantalla que las contiene usa shadcn para el resto.

---

## Fuentes de verdad (leé ANTES de codear)

| Archivo | Para qué |
|---|---|
| `AGENTS.md` | Convenciones. Leelo primero. |
| `docs/01-prd.md` | Fuente de verdad de producto. P0 = FR-01..18. |
| `docs/02-arquitectura.md` | 15 ADs. Obligatorio. |
| `docs/03-flujos-de-usuario.md` | Flujos por actor. |
| `docs/04-modelo-de-datos.md` | Schema + RLS + **migración SQL lista** (extraéla a `supabase/migrations/0001_init.sql`). |
| `docs/05-api.md` | Endpoints + realtime + códigos de error. |
| `docs/06-reglas-y-estados.md` | Máquinas de estado + reglas de negocio. |
| `docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md` | Inventario de las 15 pantallas P0 + copy. |
| `design-artifacts/tubi-wireframes.pen` + `previews/` | Los wireframes (375×812) que debés implementar. |

---

## Alcance del MVP (P0)

**15 pantallas** (viewport 375×812), todas con shadcn/ui:

| # | Pantalla | Actor |
|---|---|---|
| 1 | Registro | Pasajero |
| 2 | Búsqueda | Pasajero |
| 3 | Resultados | Pasajero |
| 4 | Detalle | Pasajero |
| 5 | Checkout seña | Pasajero |
| 6 | QR | Pasajero |
| 7 | Seguimiento | Pasajero |
| 8 | Registro | Conductor |
| 9 | Viajes del día | Conductor |
| 10 | Recogida | Conductor |
| 11 | Escanear QR | Conductor |
| 12 | Saldo | Conductor |
| 13 | En ruta | Conductor |
| 14 | Confirmar seña | Operador |
| 15 | Settings | Operador |

**Fuera de P0 (no lo hagas):** historial de pasajero, incidentes, dashboard/gestión operador, verificación DNI automatizada, ratings, tarifa por km, multi-destino ampliado.

---

## Orden de construcción (slices)

Avanzá un slice a la vez; al terminar cada uno, verificá y commitée (Conventional Commits). No saltees. En cada slice usá shadcn para todo lo visual.

### Slice 0 — Fundaciones
- Scaffold `apps/web` (create-next-app, TS, Tailwind 4), npm, Node 22. **Inicializá shadcn** (`npx shadcn@latest init`) y configurá el tema con los tokens de la paleta del wireframe. Agregá Serwist (PWA) y Zod.
- Supabase: `supabase init` + extraé la migración de `docs/04` a `supabase/migrations/0001_init.sql` + seed de `settings` (11 defaults). Levantá local (`supabase start`) o creá proyecto cloud (pedile al usuario la URL/keys → `.env`, **nunca commitear**).
- `.env.example` con las claves necesarias (Supabase URL/anon, Google Maps key).
- **Aceptación:** `apps/web` compila y corre con shadcn funcionando; migración aplicada; tabla `settings` con los defaults.

### Slice 1 — Auth y perfiles
- Supabase Auth (email+password en MVP). Trigger que crea `profiles` al registrarse.
- Registro pasajero (nombre+DNI+contacto) y conductor (nombre+apellido+teléfono) → pantallas 1 y 8 (shadcn: `Card` + `Input` + `Button`).
- RLS de `profiles` (dueño + operador).
- **Aceptación:** me registro como pasajero y como conductor; el perfil queda persistido con su rol.

### Slice 2 — Dominio y configuración
- Config en dos capas: lector de `settings` con caché corta (AD-5). Nada de negocio hardcodeado.
- Máquinas de estado de viaje, reserva y pago (`docs/06`) como código puro, sin deps externas.
- Puertos `PaymentProvider`, `MapsProvider`, `IdentityVerifier` (con adaptadores stub/real).
- **Aceptación:** las transiciones inválidas se rechazan (`TRANSICION_INVALIDA`); los valores salen de settings.

### Slice 3 — Viajes (búsqueda/detalle)
- Seed demo: ruta Tandil↔BsAs + paradas (Rauch, Flores) + un vehículo + un conductor + viajes programados.
- `GET /viajes` (origen/destino/fecha) y `GET /viajes/{id}` (detalle + paradas). Pantallas 2, 3, 4.
- **Aceptación:** busco Tandil→BsAs y veo los viajes con conductor, vehículo, precio, asientos libres.

### Slice 4 — Reserva + seña + QR
- `POST /reservas` (control de capacidad `RN-CAPACIDAD`), `POST /pagos/seña` (comprobante).
- Generación de `qr_token` opaco (`qrcode.react`). `GET /reservas/{id}/qr`. Cancelación + devolución (`RN-03`). Pantallas 5, 6.
- **Aceptación:** reservo, la reserva queda `pendiente_sena`, recibo QR; sin capacidad → `RESERVA_SIN_ASIENTOS`.

### Slice 5 — Operador: confirmar seña + settings
- `POST /pagos/{id}/confirmar` (verifica comprobante → reserva `confirmada`). `GET/PUT /settings`. Pantallas 14, 15.
- **Aceptación:** el operador confirma una seña y recién ahí el QR queda utilizable; edita un setting y las nuevas reservas usan el valor.

### Slice 6 — Conductor: recogida, escaneo, saldo, estados
- `GET /viajes/{id}/paradas`, `POST /viajes/{id}/estado`, `POST /reservas/verificar` (QR server-side), `POST /pagos/saldo`, `POST /reservas/{id}/abordar`. Espera 5 min + no-show. Pantallas 9, 10, 11, 12, 13.
- **Aceptación:** el conductor escanea un QR válido → `verificada`; QR de otro viaje → `QR_INVALIDO`; registra saldo → `abordada`; sin espera → no-show y continúa.

### Slice 7 — Tracking + realtime + cola offline
- `POST /viajes/{id}/posicion` y `/posiciones/batch` (idempotente por `client_id`).
- Suscripción realtime a `tracking_events` (Postgres Changes). Cola offline en IndexedDB. Pantalla 7.
- **Aceptación:** la posición del conductor se refleja en el mapa del pasajero en vivo; con red cortada, las posiciones se encolan y sincronizan al volver (sin duplicar).

### Slice 8 — PWA + integración + demo
- Serwist: shell offline + instalable. Recorré el **flujo feliz end-to-end**: buscar → seña → QR → escanear → saldo → GPS.
- **Aceptación:** la demo funciona de punta a punta en 375px, con settings editables y sin valores hardcodeados.

---

## Reglas duras (no negociables)

- **UI siempre con shadcn/ui**: no reinventes componentes ni estilos globales a mano.
- **Nunca hardcodees** $5.000, 15%, 5 min, ni ningún valor de negocio: siempre `settings`.
- Proveedores siempre detrás de puertos (`PaymentProvider`, `MapsProvider`, `IdentityVerifier`). No importes SDKs en el dominio.
- **RLS** en todas las tablas (matriz en `docs/04`). La autorización es a nivel de base, no solo en el cliente.
- Transiciones de estado solo por la máquina de estados (`docs/06`).
- QR validado **server-side**, token opaco. DNI cifrado y no visible para el conductor.
- `.env` ignorado y nunca commiteado. `Co-Authored-By` en commits que escriba un agente. Nunca `git add .`.

---

## Definición de "done" del MVP

1. Flujo feliz end-to-end funcionando en 375px (buscar → seña → QR → escanear → saldo → GPS).
2. Los tres roles operativos: pasajero reserva, conductor verifica/opera, operador confirma seña y edita settings.
3. Cero valores de negocio hardcodeados; todo editable en `settings`.
4. Tracking en vivo con cola offline idempotente.
5. Migración SQL reproducible y semillas de settings cargadas.
6. UI 100% shadcn/ui, mobile-first, consistente con los 15 wireframes.

---

## Trampas

- **LIFTY** (`~/Documentos/LIfty`) es otro producto: no copies código sin confirmación explícita del usuario.
- BMAD (en `~/Documentos/Estudio Nomade/Tumo/_bmad`) es metodología, no dependencia de código.
- No inventes MercadoPago, ratings, tarifa/km, historial, incidentes ni pantallas P1.
- La paleta del wireframe (`#0D9488`) no es la marca final (fase 8) — usala como acento de wireframe hasta que exista la marca, y centralizala en los tokens del tema para cambiarla fácil.
- No montes la demo sobre datos fake en el frontend: la seña, los estados y el tracking deben pasar por el backend real.

---

## Al terminar

Reportá en 10 líneas: qué slices completaste, cómo verificar la demo (comandos), qué dejaste pendiente, y **una sola pregunta** (normalmente: "¿querés que lo pruebe con vos o lo probás vos?"). No des por cerrada la fase hasta el OK del usuario.

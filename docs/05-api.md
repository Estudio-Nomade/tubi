# API y Contratos — Plataforma de Viajes Compartidos Interurbanos

**Producto:** plataforma de viajes compartidos interurbanos (tramo principal Tandil ↔ Buenos Aires).
**Documento:** 05-api.md · Contrato de la API (REST) y canal realtime.
**Rol:** define los endpoints, request/response, errores y el canal de posición en vivo que la implementación debe cumplir. Sigue el modelo de datos (`04-modelo-de-datos.md`) y la arquitectura (`02-arquitectura.md`): posición vía `tracking_events` + Postgres Changes (AD-6), cola offline idempotente (AD-7), QR como token opaco (AD-11), settings (AD-5).

---

## Convenciones

- **Base URL:** `/api` (Next.js route handlers como BFF sobre Supabase).
- **Auth:** Supabase Auth. El cliente envía el JWT de sesión (`Authorization: Bearer …` o cookie). RLS actúa como segunda capa.
- **Roles:** pasajero · conductor · operador. Cada endpoint indica el rol requerido.
- **Formato:** JSON. `Content-Type: application/json`.
- **Ids:** UUID. **Timestamps:** ISO 8601 UTC.

## Envelope de respuesta

Éxito:

```json
{ "data": { } }
```

Listas:

```json
{ "data": [ ], "meta": { "total": 12 } }
```

Error:

```json
{ "error": { "code": "QR_INVALIDO", "message": "El QR no corresponde a este viaje." } }
```

**Códigos de error estables de negocio** (además de los HTTP estándar):

| Código | Cuándo |
|---|---|
| `RESERVA_SIN_ASIENTOS` | el viaje no tiene capacidad libre |
| `SEÑA_PENDIENTE` | la seña aún no fue confirmada |
| `QR_INVALIDO` | el token no corresponde a este viaje/conductor/vehículo |
| `QR_YA_VERIFICADO` | la reserva ya fue verificada/abordada |
| `TRANSICION_INVALIDA` | el cambio de estado no es válido |
| `ESPERA_VENCIDA` | pasó el tiempo máximo de espera (no-show) |
| `PAGO_NO_CONFIRMADO` | el pago referido no está confirmado |
| `NO_ENCONTRADO` | recurso inexistente |
| `NO_AUTORIZADO` / `NO_AUTENTICADO` | permisos insuficientes / sin sesión |

---

## 1. Auth y perfiles

Auth delegada a Supabase (email+password en MVP; OTP por SMS post-MVP).

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/profiles` | autenticado | Crea el perfil tras el signup (rol + datos) |
| GET | `/profiles/me` | autenticado | Perfil propio |
| PATCH | `/profiles/me` | autenticado | Editar datos propios |
| POST | `/profiles/{id}/verificar-dni` | operador | Marcar `dni_verificado` (IdentityVerifier, fase 1 manual) |

**POST `/profiles`** (registro de conductor o pasajero):

```json
{ "rol": "conductor", "nombre": "Juan", "apellido": "Pérez", "telefono": "+5492215550000" }
```

Pasajero, además: `"dni": "…"` (se cifra en el servidor).

---

## 2. Viajes

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/viajes` | autenticado | Búsqueda por origen, destino, fecha, horario |
| GET | `/viajes/{id}` | autenticado | Detalle: conductor, vehículo, ruta, paradas, precio, estado |
| GET | `/viajes/{id}/paradas` | autenticado | Secuencia ordenada de paradas de recogida |
| POST | `/viajes` | operador | Crear viaje programado |
| POST | `/viajes/{id}/estado` | operador / conductor del viaje | Transición de estado (AD-12) |
| POST | `/viajes/{id}/incidentes` | conductor | Reportar incidente (notifica pasajeros) |

**GET `/viajes`** — query: `origen`, `destino`, `fecha` (YYYY-MM-DD), `hora_desde` (opcional).

```json
{
  "data": [
    {
      "id": "…",
      "ruta": { "origen": "Tandil", "destino": "Buenos Aires" },
      "fecha_salida": "2026-08-20T07:30:00Z",
      "precio": 25000,
      "estado": "programado",
      "asientos_libres": 3,
      "vehiculo": { "patente": "AB123CD", "marca": "Toyota", "modelo": "Corolla", "color": "blanco" }
    }
  ],
  "meta": { "total": 4 }
}
```

**POST `/viajes/{id}/estado`**:

```json
{ "estado": "en_curso" }
```

Transiciones válidas (AD-12): `programado → recogida → en_curso → completado`; en cualquier punto previo, `cancelado`. Una transición inválida responde `TRANSICION_INVALIDA`.

---

## 3. Reservas

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/reservas` | pasajero | Crear reserva (inicia seña por transferencia) |
| GET | `/reservas` | pasajero / operador | Mis reservas (o todas, operador) |
| GET | `/reservas/{id}/qr` | pasajero dueño | Token/QR de la reserva |
| POST | `/reservas/{id}/cancelar` | pasajero dueño | Cancelar + aplicar devolución (RN-03) |
| POST | `/reservas/verificar` | conductor | Escanear QR y validar reserva ↔ viaje ↔ conductor ↔ vehículo |
| POST | `/reservas/{id}/abordar` | conductor del viaje | Marcar abordado (saldo ya pagado) |

**POST `/reservas`**:

```json
{ "viaje_id": "…", "asiento_num": 2 }
```

Respuesta `201`:

```json
{
  "data": {
    "id": "…",
    "estado": "pendiente_sena",
    "monto_sena": 5000,
    "qr_token": "opq_…",
    "instrucciones_pago": { "metodo": "transferencia", "alias": "…", "cbu": "…" }
  }
}
```

> La seña queda `pendiente_sena` hasta que el operador confirme el comprobante. El `qr_token` es opaco (AD-11), no expone datos personales.

**POST `/reservas/verificar`** (el conductor escanea):

```json
{ "qr_token": "opq_…" }
```

Respuesta `200` (válido) o `QR_INVALIDO` / `QR_YA_VERIFICADO`. La validación es **server-side**: comprueba que la reserva pertenezca al viaje, al conductor y al vehículo de la sesión.

**POST `/reservas/{id}/cancelar`** — devolución según `politica_cancelacion` snapshot (RN-03: >24h 100%, 12–24h 50%, <12h/no-show 0%).

---

## 4. Pagos (efectivo + transferencia, sin pasarela)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/pagos/seña` | pasajero | Registrar intento de seña (adjunta comprobante) |
| POST | `/pagos/{id}/confirmar` | operador | Confirmar seña por transferencia (verifica comprobante) |
| POST | `/pagos/saldo` | conductor del viaje | Registrar pago de saldo (efectivo/transferencia) al subir |
| GET | `/pagos` | pasajero / operador | Listar pagos (propios o todos) |

**POST `/pagos/seña`**:

```json
{ "reserva_id": "…", "metodo": "transferencia", "comprobante": "https://…" }
```

Estado inicial `pendiente`. El operador confirma con `POST /pagos/{id}/confirmar` → `estado: confirmado` → la reserva pasa a `confirmada`.

**POST `/pagos/saldo`**:

```json
{ "reserva_id": "…", "metodo": "efectivo", "monto": 20000 }
```

---

## 5. Tracking (posición en vivo) — AD-6 / AD-7

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/viajes/{id}/posicion` | conductor del viaje | Registrar una posición |
| POST | `/viajes/{id}/posiciones/batch` | conductor del viaje | Flush de la cola offline (idempotente) |

**POST `/viajes/{id}/posicion`**:

```json
{ "client_id": "…", "lat": -37.3217, "lng": -59.1332, "precision_m": 8, "ts": "2026-08-20T09:15:00Z" }
```

**POST `/viajes/{id}/posiciones/batch`** (cola offline, AD-7):

```json
{
  "posiciones": [
    { "client_id": "…", "lat": -37.32, "lng": -59.13, "ts": "2026-08-20T09:10:00Z" },
    { "client_id": "…", "lat": -37.30, "lng": -59.10, "ts": "2026-08-20T09:12:00Z" }
  ]
}
```

Respuesta `200`: `{ "data": { "insertadas": 2, "duplicadas": 0 } }`. La idempotencia la da `tracking_events.client_id` (unique): re-enviar la cola no duplica.

### Canal realtime (lectura)

Los pasajeros **no** hacen polling. Se suscriben a **Postgres Changes** sobre `tracking_events` filtrado por `viaje_id` (AD-6):

```json
{
  "type": "INSERT",
  "table": "tracking_events",
  "record": {
    "viaje_id": "…",
    "lat": -37.30,
    "lng": -59.10,
    "precision_m": 8,
    "ts": "2026-08-20T09:12:00Z"
  }
}
```

El pasajero con una reserva válida del viaje tiene permiso de lectura (RLS) y recibe cada evento en vivo. La ETA se calcula en el cliente (o vía `MapsProvider`) a partir de la última posición.

---

## 6. Settings y administración (operador)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/settings` | autenticado | Parámetros de negocio (lectura) |
| PUT | `/settings/{clave}` | operador | Editar un setting (sin redeploy, AD-5) |
| POST/GET/PATCH/DELETE | `/vehiculos` | operador | CRUD de vehículos |
| POST/GET/PATCH/DELETE | `/rutas`, `/rutas/{id}/paradas` | operador | CRUD de rutas y paradas |
| GET | `/viajes/{id}/tracking` | operador | Trazabilidad completa del viaje |
| GET | `/reservas` · `/pagos` | operador | Vista global de reservas y pagos |

**PUT `/settings/{clave}`**:

```json
{ "valor": 6000 }
```

Aplica desde la siguiente lectura (caché corta en el runtime, AD-5). Los snapshots ya tomados en viajes/reservas no se alteran.

---

## Mapa flujo → endpoints (trazabilidad del contrato)

| Flujo (03-flujos) | Endpoints |
|---|---|
| Búsqueda y reserva | `GET /viajes` → `GET /viajes/{id}` → `POST /reservas` → `POST /pagos/seña` |
| Confirmación de seña (operador) | `POST /pagos/{id}/confirmar` |
| QR y subida | `GET /reservas/{id}/qr` → `POST /reservas/verificar` → `POST /pagos/saldo` → `POST /reservas/{id}/abordar` |
| Recogida | `GET /viajes/{id}/paradas` → `POST /viajes/{id}/estado` (recogida) |
| Seguimiento | `POST /viajes/{id}/posicion` + canal realtime `tracking_events` |
| Cancelación/no-show | `POST /reservas/{id}/cancelar` · no-show vía `POST /viajes/{id}/estado` + marca en reserva |
| Operador | `GET/PUT /settings` · CRUD `/vehiculos`, `/rutas`, `/viajes` · `POST /profiles/{id}/verificar-dni` |

---

## Notas de implementación

- El canal realtime usa **Supabase Realtime (Postgres Changes)**; no hay un WebSocket propio. La única vía de escritura es `tracking_events` (AD-6): vivo + historial unificados.
- La cola offline se implementa en el cliente con **IndexedDB** y flush en `batch` al volver la conexión (AD-7).
- La confirmación de seña es **manual** (operador) — no hay webhooks ni callback de pasarela.
- Los valores de negocio (seña, precio, espera) **nunca** vienen hardcodeados: se leen de `settings`.

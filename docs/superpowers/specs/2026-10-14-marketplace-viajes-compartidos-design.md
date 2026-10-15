# Design — Marketplace de viajes compartidos (Tubi)

**Fecha:** 2026-10-14  
**Estado:** aprobado en brainstorming · pendiente de review del archivo  
**Producto:** Tubi  
**Relacionado:** `docs/01-prd.md` (PRD actual: operador vende asientos) · este doc redefine el modelo hacia marketplace de dos orígenes de oferta

---

## 1. Problema y objetivo

### Hoy
Tubi opera viajes propios: publica asientos, paga conductores por acuerdo interno y vende lugares. Eso es un **viaje particular ofrecido por la plataforma**, no un marketplace de viajes compartidos entre particulares.

### Objetivo del pivot
Abrir un **marketplace mínimo** al costado del MVP actual para:

1. **Escalar oferta** sin poner más capital en flota/conductores propios.
2. **Capturar la dinámica informal** (gente que ya viaja y lleva pasajeros) y monetizar con comisión.
3. **Diferenciar** la oferta propia con el badge **“Operado por Tubi”** (narrativa de marca, no prioridad artificial en el listado).

### Enfoque elegido
**Marketplace mínimo en la misma app** (no dos productos, no big-bang con escrow/chat rico/ratings día 1):

- Un solo listado.
- Dos orígenes de oferta en el **viaje** (`peer` | `tubi_operated`).
- Mismos flujos de negocio base, extendidos (solicitud → aceptación, seña %, liquidación peer, etc.).
- Feature-flageable donde convenga.

---

## 2. Principios no negociables

1. **No regular un mercado que aún no existe.** No se distingue “viaje real” vs “línea vacía”: la intención no es observable. Se regula lo medible (KYC, plata, cancelaciones, bypass, ToS).
2. **Badge en el viaje, no en la persona.** La misma persona puede un día publicar peer y otro ser asignada a un viaje Operado por Tubi.
3. **Una persona = una cuenta.** Roles son capabilities; el login partido pasajero/conductor desaparece.
4. **Flujo de negocio único** para peer y Operado por Tubi (solicitud → aceptación → seña → QR → saldo…).
5. **Seña a Tubi** (no escrow en este corte). Escrow es evolución.
6. **Comisión 15% solo en peer.** Viajes Operado por Tubi mantienen acuerdo interno con el conductor.
7. **Mapas:** MapLibre + OSM detrás de `MapsProvider` si hace falta ruteo. No Google como dependencia de este diseño.
8. **Valores de negocio en settings**, nunca hardcodeados.
9. **Proveedores detrás de interfaces** (`PaymentProvider`, `MapsProvider`, `IdentityVerifier`).

---

## 3. Modelo de oferta

### Tipos de viaje

| | **Operado por Tubi** | **Peer (compartido)** |
|---|---|---|
| Cómo nace | El **operador** crea el viaje y **asigna** un conductor verificado | El conductor verificado **publica** cupos en un viaje suyo |
| Badge | **“Operado por Tubi”** | Particular verificado (post-KYC); sin badge Tubi |
| Precio asiento (tramo completo) | Lo fija Tubi | Lo fija el conductor (libre) |
| Comisión 15% | No (acuerdo interno al chofer) | Sí — la liquida el **conductor** post-viaje |
| Seña | → Tubi | → Tubi |
| Listado | Misma grilla, **sin** prioridad artificial por ser Tubi | Idem |

### Campo conceptual
- `trip.offer_source`: `tubi_operated` | `peer`

### Qué no entra
- Policía de motivo del viaje (línea vacía vs “voy igual”).
- Priorizar Tubi en el sort solo por ser Tubi (la **confiabilidad** sí puede influir después).

---

## 4. Identidad, roles y UX dual-modo

### Industria (referencia)
- **BlaBlaCar:** un Member; Driver/Passenger son roles por participación, no cuentas distintas; se puede ser ambos.
- **Airbnb:** una cuenta + switch **Traveling | Hosting** que cambia el shell. Help Center: switch explícito (no long-press como único path).
- **Uber:** apps/superficies separadas Ride vs Drive — anti-patrón para Tubi (PWA, programado, no “go online”).

**Híbrido Tubi:** dominio BlaBlaCar + shell Airbnb, con switch **siempre visible**.

### Invariantes de identidad

| ID | Invariante |
|---|---|
| I1 | Un solo registro/login. No existe login pasajero vs login conductor. |
| I2 | Roles = capabilities: `passenger` (default al signup), `driver` (post-KYC), `operator` (staff). |
| I3 | KYC (`IdentityVerifier`, Didit al inicio) obligatorio para **cualquier** acción de conductor: publicar peer **o** ser asignado a Operado por Tubi. |
| I4 | DNI verificado ↔ como máximo una cuenta con capability driver activa. |
| I5 | Badge / `offer_source` vive en el **viaje**, no en el user. |
| I6 | `ui_mode`: `travel` \| `drive` es preferencia de shell, **no** autorización. Autoriza la capability + reglas del viaje. |
| I7 | Historial de riesgo unificado en la persona (cancelaciones, strikes, comisión, detective). |
| I8 | Publicar requiere driver verified + al menos un vehículo válido. |
| I9 | Migración: cuentas duplicadas actuales (mismo teléfono/email/DNI) → persona canónica. |
| I10 | Sesión única; logout único; scopes por capability. |

### Switch UX
- Control **segmented siempre visible** en usuarios logueados: **Viajar | Conducir**.
- **Prohibido** long-press u otros gestos ocultos como único path (nadie los descubre).
- Cada modo tiene su **bottom nav** propia (3–5 ítems), no un megamenú mezclado.
- `ui_mode` persiste en el dispositivo.
- Push/deep link abre el modo correcto del evento.
- Primera vez en Conducir sin KYC → funnel Didit (no muro vacío).
- CTA en Viajar: “Ofrecer viajes” → KYC o flip a Conducir.

### Operator
- Capability `operator` en users de staff (puede coexistir con driver/passenger).
- El panel operador puede ser shell/ruta aparte, **misma sesión**.
- Crear viaje Operado por Tubi: buscar conductor verified → asignar → `offer_source = tubi_operated`.

### Solapamiento
- Por defecto **no** se permite ser pasajero y conductor en el **mismo tramo temporal** (bloqueo de conflicto de agenda).

### Estados conductor (capability)
`unverified` → `pending_kyc` → `verified` | `rejected` | `suspended`

### Pasajero
- Registro mínimo actual (nombre + DNI + contacto).
- KYC fuerte de pasajero **fuera** de este corte.

---

## 5. Flujo de negocio: solicitud → aceptación

### Cambio respecto al PRD actual
El pasajero **no reserva un asiento de forma unilateral**. **Solicita** un lugar; el conductor **acepta o rechaza**.

Es el **único** flujo para peer y Operado por Tubi (sirve también cuando el conductor Tubi prefiere un tramo completo antes que un intermedio más barato).

### Pasos
1. Pasajero busca A → B y elige un viaje cuyo trazo permita ese tramo.
2. Ve precio del tramo (calculado) y **solicita** asiento.
3. Conductor recibe notificación: tramo, precio, datos mínimos del pasajero.
4. Conductor **acepta** o **rechaza** (o vence por timeout — setting).
5. Si acepta → push al pasajero → corre **seña** (% del tramo) a Tubi, con política de cancelación tipificada (base: política actual).
6. Si rechaza/vence → cupo sigue disponible; el pasajero puede solicitar otro viaje.
7. Sigue el resto: QR, saldo al subir, estados de viaje, etc.

### Copy de producto
- Término de trabajo: **solicitud** / **solicitar lugar** (copy final de marca puede suavizar: “pedir lugar”, etc.).
- Evitar “reservar” como verbo primario del happy path (puede quedar en UI legacy hasta migrar).

### Estados conceptuales (solicitud/reserva)
`requested` → `accepted` → `deposit_pending` → `deposit_confirmed` → … (abordado, completado)  
o `rejected` | `expired` | `cancelled` (con tipificación de quién canceló).

### Incentivo del conductor
Precio de intermedios menor (proporción por distancia) + derecho a rechazar → puede esperar solicitudes de tramo completo si le rinde más. No hace falta regla extra de “solo destino final”.

---

## 6. Plata y liquidación

### Seña
- **Porcentaje del precio del tramo aceptado** (`sena_pct` en settings).
- Deja de ser el default de producto un monto fijo global (evita seña $5.000 sobre tramo $4.000).
- Floor/techo opcionales en settings si el operador los define.
- Destino de la seña: **Tubi** (confirmación según flujo actual de transferencia/comprobante).
- Política de devolución: **reutilizar el marco actual** (ventanas y %), tipificando actor y causa.

### Precio
| Quién | Qué define |
|---|---|
| Conductor (peer) o Tubi (operado) | Precio por asiento del **tramo completo** origen→destino del viaje |
| Plataforma | Precio de **tramos intermedios** = proporción por **distancia** sobre el precio lleno (fórmula y redondeo en settings) |

Ejemplo: lleno $40.000 · 400 km · parada a 100 km → ~$10.000 (25%).

### Comisión (solo peer)
- **15%** (rango configurable) sobre el **precio del tramo aceptado** (lo que paga ese pasajero).
- **Cuándo nace la obligación de comisión (default):**
  - Pasajero **abordado** y viaje **completado** → comisión sobre el precio del tramo de ese pasajero.
  - **No-show** del pasajero (seña retenida según política) → **no** genera comisión peer sobre ese asiento (la seña retenida es ingreso Tubi / compensación operativa según reglas de seña; no se trata como “venta peer completa”).
  - **Cancelación** antes de abordar → **no** genera comisión peer; aplica solo política de seña tipificada.
  - Si más adelante se quiere comisión sobre no-show, es un setting explícito (`commission.on_noshow`), default **off**.
- La liquida el **conductor** a Tubi post-viaje (no es deuda del pasajero).
- Viajes Operado por Tubi: **sin** esta comisión al chofer; acuerdo interno aparte.

### UX de liquidación (tono optimista, montos grandes)
En publicación, aceptación y post-viaje el conductor ve en grande:

- Precio del asiento / tramo  
- **Tu parte: $X**  
- Comisión Tubi (15%): $Y  

Post-viaje: no “debés castigo a la app”, sino **“Liquidá tu comisión — te quedaste $X”** con CTA único, monto exacto, datos de transferencia Tubi, estados `pending` → `submitted` → `confirmed`.

### Efectivo
- El conductor peer cobra el saldo en mano; Tubi no intercepta ese cash.
- La comisión queda como obligación del conductor hacia Tubi.

### Fuera de este corte
- Escrow / custodia de seña (evolución deseable más adelante).
- Pasarela automática.

---

## 7. Anti-bypass, cancelaciones y detective

### Objetivo
Que el bypass sea más caro/riesgoso que cerrar en Tubi — sin pretender 0%.

### Gates de información (peer; Operado por Tubi puede reutilizar el mismo esquema)
| Momento | Visible |
|---|---|
| Antes de solicitar | Ruta, horario, precio tramo, cupos, badge, métricas blandas si hay historial |
| Solicitud / seña en curso | Datos útiles de viaje (vehículo, punto de encuentro) **sin** teléfono/WhatsApp del otro |
| Seña confirmada | Contacto y/o chat in-app desbloqueado |
| En viaje | QR, GPS, estados (valor off-app no replica) |

### Chat (mínimo si entra)
- Solo con seña confirmada.
- Filtro básico de patrones de teléfono / “mandame al WhatsApp”.
- CTA **Reportar intento de eludir la plataforma**.

### Cancelaciones como contraincentivo
Tipificación (reutiliza política actual de seña/ventanas):

| Tipo | Impacta métrica de |
|---|---|
| Canceló pasajero | Pasajero |
| Canceló conductor | Conductor |
| No-show pasajero | Pasajero (+ seña según política) |
| Canceló plataforma / fuerza mayor | Neutro o peso bajo |
| Cancelación rápida post-match, misma dupla repetida | Señal de investigación (bypass) |

Uso en fases: (1) interno operador, (2) visible como confiabilidad / % completados, (3) gates suaves por umbral en settings.

### Detective mínimo (obligatorio)
Cola chica en panel operador (5–10 filas), auto-generada. Señales:

1. Dupla pasajero–conductor con ≥2 cancelaciones en ventana corta  
2. Tasa de cancelación sobre umbral (setting)  
3. Reporte de bypass  
4. Comisión peer impaga vencida  
5. Cancelación muy rápida post-aceptación en la misma dupla (opcional)

Cada ítem: actores, señal, link al viaje, acciones **OK / avisar / pausar**.  
Si la cola está vacía, no molesta; si no, no depende de que el operador “se acuerde”.

### Consecuencias
- Conductor: strikes → pausa de publicación; comisión impaga → no publica.
- Pasajero: strikes graves → limitar solicitudes.
- Multicuenta: mitigada por KYC conductor.

---

## 8. Rutas, mapas y búsqueda

### Stack
- `MapsProvider` con implementación **MapLibre + OSM** (geocoding + ruteo) para este diseño.
- No Google Directions como dependencia.

### Publicar ruta (waypoints de primera clase, UX no tortuosa)
1. Origen y destino por geocoder / pin (estructurados, no textarea).
2. Motor devuelve **2–3 alternativas** de trazo.
3. Conductor **elige una**.
4. Plataforma propone **lista de tramos/paradas sugeridas** sobre esa geometría.
5. Conductor acepta el set o saca sugeridas.
6. **+ Agregar parada** (búsqueda/pin) → se **inserta sola** en el orden geográfico correcto del trazo y se recalcula. **No** hay reordenado manual libre (evita Flores → Rauch al revés).
7. Persistencia estructurada: origin, destination, geometry/polyline, stops ordenados, distance, duration_est.

### Precio y tramos
- Precio lleno en el viaje; precio pedible por par de stops = f(distancia del subtramo).

### Búsqueda pasajero (sin “radio mágico” como producto)
El pasajero declara **quiero ir de A → B** (lugares reales; ej. Necochea aunque Tubi nunca haya operado ahí):

1. Geocodifica A y B (place-id / localidad resuelta).
2. Match de viajes cuya ruta estructurada **sirva el pedido en orden**: el trazo tiene un punto/parada alineado a A y después uno alineado a B (misma localidad/place, no string libre ni radio arbitrario tipo “30 km a la redonda” como regla de negocio central).
3. Resultado = viajes con **tramo pedible** A→B y precio calculado.
4. Si no hay oferta, lista vacía — la búsqueda **no** está limitada al catálogo histórico de corredores Operado por Tubi.

Principio: **el mapa/geometría es el catálogo**, no una lista fija de rutas oficiales.

---

## 9. Notificaciones

Columna transversal; incentivan instalar la PWA.

| Actor | Ejemplos |
|---|---|
| Pasajero | Solicitud enviada · **Aceptada** · Rechazada · Seña pendiente/confirmada · Recordatorio · Cancelación · En camino |
| Conductor | Nueva solicitud · Seña confirmada · Recordatorio salida · Pasajero canceló · Liquidación pendiente |
| Operador | Seña por confirmar · Ítems detective · KYC · Liquidación peer · Incidentes |

- Canal día 1: **push Web/PWA** + in-app.
- Cada evento de negocio emite notificación (diseño event-driven, no ad-hoc suelto).
- Deep link respeta `ui_mode` correcto.
- Copy de install PWA: valor concreto (“enterate cuando te acepten”).

---

## 10. Settings nuevos / afectados (conceptual)

Todo configurable sin redeploy, entre otros:

- `marketplace.enabled` (feature flag)
- `commission.peer_pct` (default 15)
- `deposit.pct` (seña % del tramo)
- `deposit.floor` / `deposit.ceiling` (opcionales)
- `request.accept_timeout` (tiempo del conductor para responder)
- `reliability.cancel_rate_threshold_*`
- `detective.*` (ventanas, umbrales de duplas)
- `maps.*` (tolerancia de match localidad si aplica a nivel provider, no radio de producto arbitrario)
- Política de devolución existente (se mantiene y se tipifica)

---

## 11. Delta al PRD y entidades

### Cambia
- De “solo Tubi vende asientos” → marketplace con `offer_source`.
- Reserva unilateral → **solicitud + aceptación**.
- Seña fija default → **% del tramo**.
- Comisión 15% → solo **peer**, liquidada por conductor.
- Conductor: de recurso operativo a **cuenta verificable** que puede publicar.
- Auth: de dos logins a **una persona + switch Viajar/Conducir**.
- Descubrimiento: de corredor fijo a **búsqueda A→B sobre geometría**.
- Mapas: MapLibre/OSM para ruteo de este diseño.

### Se mantiene
- Web mobile-first / PWA.
- Seña a Tubi + política de ventanas de cancelación (marco).
- QR, estados de viaje, GPS offline queue, espera en recogida.
- Providers e interfaces.
- Settings en DB + `.env` para secretos.

### Entidades / conceptos nuevos o extendidos
- `User` unificado + capabilities + `ui_mode`
- `DriverKyc` / estado vía `IdentityVerifier`
- `Trip.offer_source`, geometry, stops, full_price
- `SeatRequest` (o extensión de `Reservation` con estados de solicitud)
- `CommissionObligation` (peer)
- `ReliabilityStats` / eventos de cancelación tipificados
- `DetectiveSignal` (cola operador)
- `Notification` / outbox de eventos
- `Vehicle` ligado al user driver

---

## 12. Fuera de alcance (este diseño)

- Escrow de seña / pasarela completa
- Chat rico, ratings completos, reputación elaborada
- Apps nativas
- Google Maps como dependencia
- Policía de “línea vacía”
- KYC fuerte de pasajero
- Prioridad artificial de Tubi en el listado
- Detective forense pesado / bans automáticos agresivos sin humano al inicio

---

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Bypass off-platform | Gate de contacto, seña a Tubi, valor QR/GPS, reportes, detective, métricas |
| Conductor no liquida 15% | UX clara “tu parte”, bloqueo de publicación, detective |
| Multicuenta conductor | KYC Didit al primer uso conductor |
| Migración auth dual | Plan de fusión de cuentas; feature flag marketplace |
| Complejidad de ruteo | Tramos sugeridos + auto-insert de paradas; alternativas 2–3 del motor |
| Sobrecarga operador (señas manuales) | Mismo proceso actual; detective acotado; escrow después |
| Confusión de marca peer vs Tubi | Badge “Operado por Tubi” + copy honesto |

---

## 14. Criterios de éxito (producto)

1. Un pasajero puede solicitar A→B en un viaje peer o Tubi con el mismo flujo.
2. Un conductor verificado publica con precio lleno, ve **tu parte** vs comisión, acepta/rechaza solicitudes.
3. Operador asigna conductor verified → viaje “Operado por Tubi” sin crear otra identidad.
4. Switch Viajar/Conducir visible; una sola sesión.
5. Seña = % del tramo; no seña absurda sobre tramos baratos.
6. Cola detective no vacía solo cuando hay señales reales.
7. Búsqueda por lugar real no limitada al historial de corredores Tubi.
8. Push de “te aceptaron” llega y abre el contexto correcto.

---

## 15. Orden de implementación sugerido (no plan detallado)

Orientativo para el plan posterior:

1. Auth unificada + capabilities + switch UI  
2. KYC conductor (`IdentityVerifier` / Didit)  
3. `offer_source` + badge + alta viaje operador vs publicación peer  
4. Solicitud/aceptación + notificaciones  
5. Precio por tramo + seña %  
6. Liquidación comisión peer  
7. Mapas/rutas/waypoints + búsqueda A→B  
8. Cancelaciones tipificadas + detective mínimo  
9. Gates de contacto / anti-bypass  
10. Migración de cuentas legacy + flag marketplace  

---

## 16. Decisiones cerradas (checklist)

- [x] Enfoque: marketplace mínimo en la misma app  
- [x] Listado en igualdad; badge “Operado por Tubi”  
- [x] Precio peer libre (tramo completo)  
- [x] Intermedios por distancia  
- [x] Comisión 15% solo peer; liquida conductor  
- [x] Seña → Tubi; seña = % del tramo  
- [x] Sin escrow en este corte  
- [x] Solicitud + aceptación = flujo único  
- [x] KYC Didit todos los conductores  
- [x] Badge/origen en el viaje; conductor desacoplado del aval  
- [x] Una cuenta; switch Viajar/Conducir siempre visible (no long-press)  
- [x] No regular “línea vacía”  
- [x] MapLibre + OSM; waypoints auto-ordenados; búsqueda A→B  
- [x] Detective mínimo + notificaciones PWA  
- [x] Cancelaciones tipificadas como contraincentivo  

---

*Documento generado en sesión de brainstorming. Próximo paso tras aprobación del archivo: plan de implementación (`writing-plans`).*

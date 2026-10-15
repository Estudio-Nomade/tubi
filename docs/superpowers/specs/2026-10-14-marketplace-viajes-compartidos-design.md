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
**Marketplace mínimo en la misma app** (no dos productos, no big-bang con escrow/ratings día 1):

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
7. **Sin mapas ni GPS en vivo en este diseño.** PWA: la ubicación en background no es confiable cross-device; no se promete tracking ni UI de mapa. Rutas = lugares y paradas **estructurados** (listas ordenadas), no canvas de mapa.
8. **Chat in-app = único canal de comunicación** entre pasajero y conductor. No se desbloquea teléfono/WhatsApp en el producto.
9. **Valores de negocio en settings**, nunca hardcodeados.
10. **Proveedores detrás de interfaces** (`PaymentProvider`, `IdentityVerifier`; geocoding/distancias server-side si hace falta, sin `MapsProvider` de UI).

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

### Peer y viaje con pocos pasajeros
- No hay obligación de plataforma de “salir igual con un solo pasajero” en peer (eso es política Operado por Tubi / etapa a pérdida del PRD actual).
- El conductor peer decide si mantiene, cancela o espera más solicitudes; si cancela con señas activas, aplica §5 cancelación de viaje completo.

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
- Por defecto **no** se permite ser pasajero activo y conductor activo en ventanas que se solapan.
- Definición operativa (settings): una participación “activa” es solicitud aceptada con seña confirmada, o viaje en estados `programado|recogida|en_curso` como conductor, cuyo intervalo `[salida_estimada - margen, llegada_estimada + margen]` (márgenes en settings, default p.ej. 1h) se intersecta con otra participación activa de la misma persona.
- Al detectar conflicto: se bloquea la nueva solicitud o la nueva publicación/asignación con mensaje claro.

### Estados conductor (capability)
`unverified` → `pending_kyc` → `verified` | `rejected` | `suspended`

### Pasajero
- Registro mínimo actual (nombre + DNI + contacto).
- KYC fuerte de pasajero **fuera** de este corte.

### Conductores Tubi ya existentes (migración KYC)
- Los conductores operativos previos deben pasar por el mismo funnel Didit antes de volver a ser asignados o de publicar.
- Hasta estar `verified`: no asignables a nuevos viajes Operado por Tubi ni pueden publicar peer (viajes ya en curso se definen en plan de migración: terminar o reasignar).

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

### Cupos, concurrencia y seña no pagada
- Al **solicitar**, el cupo no se quema en firme: varias solicitudes pueden coexistir sobre el mismo asiento hasta aceptación.
- Al **aceptar**, ese asiento/cupo queda **hold** para esa solicitud (otras solicitudes al mismo cupo pasan a rechazadas o “cupo no disponible”).
- Tras aceptar: ventana de pago de seña (`deposit.pay_timeout` setting). Si el pasajero no inicia/completa la seña a tiempo → solicitud `expired`, hold liberado, push al conductor.
- Capacidad del viaje = cupos libres − holds activos por aceptaciones con seña pendiente/confirmada.
- **Mismo flujo con marketplace flag off:** si solo hay oferta Operado por Tubi, igual rige solicitud → aceptación (no se reintroduce reserva unilateral).

### Cancelación de viaje completo (conductor o operador)
- Si se cancela el viaje entero con solicitudes/señas activas: seña según política tipificada `cancelled_by_driver` / `cancelled_by_platform` (default: devolución 100% de seña al pasajero cuando cancela la oferta); métrica de confiabilidad impacta al conductor si fue él; no nace comisión peer.

### Auto-aceptación
- Default: **manual** (conductor toca aceptar/rechazar).
- Setting futuro opcional `request.auto_accept` (por conductor o por viaje Operado por Tubi) — **fuera del corte mínimo**, pero el modelo de estados no lo impide.

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

### Efectivo y transferencia del saldo
- **Efectivo:** el conductor peer cobra el saldo en mano; Tubi no intercepta ese cash.
- **Transferencia del saldo (peer):** el pasajero transfiere al **alias/CBU del conductor**. Esos datos de **pago** se muestran solo post-seña en pantalla de pago in-app o se pegan en el **chat** (no es teléfono/WhatsApp de contacto personal); no es custodia Tubi.
- La comisión queda como obligación del conductor hacia Tubi en ambos casos.

### Waterfall de plata (peer) — invariante contable

La seña **no es un fee aparte apilado encima del 15%**. Es un **anticipo del precio del tramo** que recibe Tubi; al cerrar el viaje se compensa con la comisión.

Notación, por pasajero abordado y viaje completado:

- `P` = precio del tramo aceptado  
- `s` = `deposit.pct` (seña) → monto seña `S = P * s` (con floor/ceiling si aplican)  
- `c` = `commission.peer_pct` (default 0.15) → comisión `C = P * c`  
- Saldo al subir `B = P - S` (lo paga el pasajero al conductor en efectivo o transferencia directa)

**Al completar:**

| Bolsillo | Monto |
|---|---|
| Pasajero pagó en total | `P` (= `S` a Tubi + `B` al conductor) |
| Tubi debe terminar con | `C` (comisión) |
| Conductor debe terminar con | `P - C` |

**Liquidación conductor → Tubi post-viaje:**

- Si `S >= C`: Tubi ya cubrió la comisión con la seña. Tubi **devuelve / acredita al conductor** el excedente `S - C` (o lo deja a favor en cuenta interna). El conductor **no** transfiere comisión adicional. UX: “Ya está liquidado — te quedaste $P−C” (y si hubo excedente de seña, “Tubi te acredita $S−C”).
- Si `S < C`: el conductor **transfiere a Tubi** la diferencia `C - S`. UX: “Liquidá $C−S — te quedaste $P−C”.
- Si `S == C`: neto cero de liquidación post-viaje.

Así no hay doble cobro seña+comisión. La seña sigue cumpliendo rol de compromiso (política de cancelación/no-show sobre `S`); la comisión es el take-rate sobre viajes completados.

**Operado por Tubi:** no aplica este waterfall de comisión peer; seña y tarifa según acuerdo interno / settings de precio Tubi (sin `CommissionObligation` al chofer).

### Fuera de este corte
- Escrow / custodia de seña más allá del anticipo contable anterior (liberación automática tipo BlaBlaCar).
- Pasarela automática.

---

## 7. Anti-bypass, cancelaciones y detective

### Objetivo
Que el bypass sea más caro/riesgoso que cerrar en Tubi — sin pretender 0%.

### Gates de información (peer; Operado por Tubi puede reutilizar el mismo esquema)
| Momento | Visible |
|---|---|
| Antes de solicitar | Ruta (paradas ordenadas), horario, precio tramo, cupos, badge, métricas blandas si hay historial |
| Solicitud / seña en curso | Datos útiles de viaje (vehículo, punto de encuentro acordado como texto/parada) **sin** teléfono ni WhatsApp |
| Seña confirmada | **Chat in-app desbloqueado** (único canal) |
| En viaje | QR, estados del viaje (sin mapa ni tracking en vivo en este diseño) |

### Chat in-app (obligatorio — único medio)
- **Único canal de comunicación** pasajero ↔ conductor. El producto **no** muestra ni desbloquea teléfono, WhatsApp ni otros contactos directos.
- Se habilita solo con **seña confirmada** (y solicitud aceptada).
- Filtro de contenido: detectar/bloquear patrones de teléfono, @handles, “mandame al WhatsApp”, links de evasión.
- CTA permanente: **Reportar intento de eludir la plataforma**.
- ToS: coordinar el viaje solo por chat Tubi; compartir contacto personal para cerrar el viaje afuera es violación.

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

### ToS (producto)
- Condiciones de uso explícitas: prohibido eludir la plataforma; **toda** la coordinación pasajero–conductor va por chat Tubi; cobrar/pagar el viaje afuera sin liquidar comisión es violación.
- Violación reiterada + señales detective → pausa/suspensión (humano en el loop al inicio).

---

## 8. Rutas y búsqueda (sin mapas)

### Qué queda fuera (explícito)
- **UI de mapa** (MapLibre, Google, tiles, canvas).
- **GPS / tracking en vivo** del vehículo (background location en PWA no es confiable cross-device; no se promete).
- Dependencia de `MapsProvider` orientado a mapas en cliente.
- Cualquier feature de este diseño que asuma “ver el auto en el mapa”.

### Modelo de ruta (listas estructuradas)
La ruta es una **secuencia ordenada de lugares**, no un dibujo:

1. Origen y destino por **búsqueda de lugar** (texto / catálogo de places: ciudad, parada conocida, POI con id estable) — **sin pin en mapa**.
2. El backend puede devolver **2–3 alternativas de corredor** como **listas distintas de paradas sugeridas** (misma idea que “tres rutas”, pero como tramos/ciudades, no polylines en pantalla).
3. Conductor **elige una** lista.
4. Puede **sacar** paradas sugeridas o **+ Agregar parada** (misma búsqueda de lugar).
5. Al agregar, el sistema **inserta en el orden correcto** según orden de corredor / distancia conocida entre places (tabla o cálculo server-side). **No** hay drag libre que permita Flores → Rauch al revés.
6. Persistencia: `origin_place_id`, `destination_place_id`, `stops[]` ordenados (`place_id`, label, orden), `distance_m` / `duration_s` opcionales **server-side** para precio — sin geometry expuesta al cliente como mapa.

### Precio y tramos
- Precio lleno en el viaje; precio pedible por par de stops = f(distancia del subtramo) usando distancias **server-side** entre places (no UI de mapa).

### Búsqueda pasajero
El pasajero declara **quiero ir de A → B** (lugares del catálogo/geocoder de texto; ej. Necochea aunque Tubi nunca haya operado ahí):

1. Resuelve A y B a `place_id` (o localidad canónica).
2. Match de viajes cuya secuencia de stops **contenga A y después B** (mismo place / misma localidad canónica — no radio mágico ni string libre).
3. Resultado = viajes con **tramo pedible** A→B y precio calculado.
4. Si no hay oferta, lista vacía — la búsqueda **no** está limitada al historial de corredores Operado por Tubi.

Principio: **el catálogo de lugares + paradas ordenadas es el índice de descubrimiento**, no un mapa ni una lista fija hardcodeada solo de lo que Tubi operó.

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

- `marketplace.enabled` (feature flag de oferta peer; el flujo solicitud→aceptación aplica igual)
- `commission.peer_pct` (default 15; rango configurable p.ej. 0–15 o el que defina el operador)
- `commission.on_noshow` (default false)
- `deposit.pct` (seña % del tramo)
- `deposit.floor` / `deposit.ceiling` (opcionales)
- `deposit.pay_timeout` (plazo post-aceptación para pagar seña)
- `request.accept_timeout` (tiempo del conductor para responder)
- `schedule.conflict_margin_*` (solapamiento pasajero/conductor)
- `reliability.cancel_rate_threshold_*`
- `detective.*` (ventanas, umbrales de duplas)
- `places.*` (resolución de localidad / place_id server-side, sin UI de mapa)
- Política de devolución existente (se mantiene y se tipifica; + causa `cancelled_by_driver` / `cancelled_by_platform`)

---

## 11. Delta al PRD y entidades

### Cambia
- De “solo Tubi vende asientos” → marketplace con `offer_source`.
- Reserva unilateral → **solicitud + aceptación**.
- Seña fija default → **% del tramo**.
- Comisión 15% → solo **peer**, liquidada por conductor.
- Conductor: de recurso operativo a **cuenta verificable** que puede publicar.
- Auth: de dos logins a **una persona + switch Viajar/Conducir**.
- Descubrimiento: de corredor fijo a **búsqueda A→B sobre lugares/paradas ordenadas**.
- Comunicación: **solo chat in-app** (no teléfono/WhatsApp entre partes).
- Sin mapas ni GPS en vivo en el alcance de este diseño (PWA).

### Se mantiene
- Web mobile-first / PWA.
- Seña a Tubi + política de ventanas de cancelación (marco).
- QR, estados de viaje, espera en recogida.
- Providers e interfaces (`PaymentProvider`, `IdentityVerifier`).
- Settings en DB + `.env` para secretos.

### Entidades / conceptos nuevos o extendidos
- `User` unificado + capabilities + `ui_mode`
- `DriverKyc` / estado vía `IdentityVerifier`
- `Trip.offer_source`, stops ordenados (`place_id`), full_price
- `Place` (catálogo / id estable de localidad o parada)
- `SeatRequest` (o extensión de `Reservation` con estados de solicitud)
- `CommissionObligation` (peer)
- `ChatThread` / mensajes (único canal post-seña)
- `ReliabilityStats` / eventos de cancelación tipificados
- `DetectiveSignal` (cola operador)
- `Notification` / outbox de eventos
- `Vehicle` ligado al user driver

---

## 12. Fuera de alcance (este diseño)

- Escrow de seña / pasarela completa
- Ratings completos, reputación elaborada
- Apps nativas
- **UI de mapas** (MapLibre, Google, tiles) y **GPS / tracking en vivo** (background location PWA)
- Desbloqueo de teléfono/WhatsApp entre pasajero y conductor
- Policía de “línea vacía”
- KYC fuerte de pasajero
- Prioridad artificial de Tubi en el listado
- Detective forense pesado / bans automáticos agresivos sin humano al inicio

---

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Bypass off-platform | Chat único post-seña, filtro de teléfonos, seña a Tubi, QR, reportes, detective, métricas |
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
7. Rutas por places/paradas + búsqueda A→B (sin UI de mapa)  
8. Chat in-app post-seña (único canal) + anti-bypass  
9. Cancelaciones tipificadas + detective mínimo  
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
- [x] Rutas por places/paradas ordenadas; búsqueda A→B; **sin mapas ni GPS**  
- [x] Chat in-app **único** canal post-seña (sin teléfono/WhatsApp)  
- [x] Detective mínimo + notificaciones PWA  
- [x] Cancelaciones tipificadas como contraincentivo  
- [x] Waterfall seña↔comisión sin doble cobro  
- [x] Hold de cupo al aceptar + timeout de seña  
- [x] Solicitud→aceptación también con marketplace flag off  
- [x] Solapamiento agenda con márgenes en settings  
- [x] Migración KYC conductores Tubi existentes  

---

## 17. Self-review (2026-10-14, post-commit)

### Hallazgos corregidos en este archivo
1. **Waterfall seña vs comisión** — era el hueco más grave: seña a Tubi + 15% extra podía leerse como doble take. Quedó invariante contable: seña = anticipo de `P`; Tubi termina en `C`; conductor en `P−C`; liquidación = `C−S` o crédito `S−C`.
2. **Concurrencia de cupos** — hold al aceptar; multi-solicitud hasta aceptación; timeout de seña.
3. **Flag marketplace** — peer se apaga con flag; solicitud→aceptación **no**.
4. **Solapamiento** — definición con intervalos y márgenes en settings.
5. **KYC conductores legacy Tubi** — deben verificarse antes de nuevas asignaciones.
6. **Chat in-app** — único canal; sin teléfono/WhatsApp (corregido: ya no es opcional).
7. **Sin mapas/GPS** — PWA no garantiza background location; rutas = places ordenados (corregido: se saca MapLibre/tracking del diseño).
8. **Cancelación de viaje completo** y **peer sin obligación de salir con 1 pax**.
9. **Saldo por transferencia peer** — al conductor (datos de pago in-app/chat), no custodia Tubi.
10. **ToS anti-bypass** — coordinación solo por chat Tubi.

### Invariantes de sesión — cobertura

| Decisión de brainstorming | ¿En spec? |
|---|---|
| Objetivos A+B (+C badge) | §1 |
| Listado igualdad + badge “Operado por Tubi” | §3 |
| Precio peer libre; Tubi fija operados | §3 |
| Intermedios por distancia | §6, §8 |
| Comisión 15% solo peer; liquida conductor | §6 |
| Seña a Tubi; % del tramo; no escrow big-bang | §2, §6 |
| No deuda de comisión del pasajero (era B) | §6 |
| Solicitud→aceptación flujo único | §5 |
| KYC Didit todos los conductores | §4 |
| Identidad ≠ aval (offer_source en viaje) | §3, §4 |
| Una cuenta; switch visible; no long-press | §4 |
| No regular línea vacía | §2, §3 |
| Rutas places/paradas; búsqueda A→B; sin mapas/GPS | §8 |
| Chat in-app único canal | §7 |
| Anti-bypass + cancelaciones + detective mínimo | §7 |
| Notificaciones PWA | §9 |
| UX “tu parte” optimista | §6 |
| Operator asigna → tubi_operated | §3, §4 |
| Acuerdo interno chofer Tubi sin 15% | §3, §6 |

### Riesgos / bordes aún deliberadamente abiertos (plan, no spec bloqueante)
- Montos exactos default de `deposit.pct`, márgenes de solapamiento y timeouts (settings de operador al implementar).
- Catálogo de places y matching de localidad (server-side, sin mapa).
- UI concreta de bottom nav por modo y de chat (wireframes).
- Fusión mecánica de users legacy duplicados (paso de migración en plan).
- Si Operado por Tubi usa auto-accept más adelante (`request.auto_accept`).

### Consistencia interna
- Sin TBD/TODO.
- §12: sin mapas/GPS, sin teléfono entre partes, chat obligatorio, sin escrow pasarela.
- §16 checklist alineado al self-review.

---

*Documento generado en sesión de brainstorming. Self-review post-commit aplicado. Próximo paso tras OK del archivo: plan de implementación (`writing-plans`).*

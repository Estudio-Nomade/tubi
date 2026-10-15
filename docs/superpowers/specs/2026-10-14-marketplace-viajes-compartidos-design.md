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
- **Transferencia del saldo (peer):** el pasajero transfiere al **alias/CBU del conductor** (visible solo con seña confirmada), o registra comprobante en app; no es custodia Tubi.
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
| Antes de solicitar | Ruta, horario, precio tramo, cupos, badge, métricas blandas si hay historial |
| Solicitud / seña en curso | Datos útiles de viaje (vehículo, punto de encuentro) **sin** teléfono/WhatsApp del otro |
| Seña confirmada | Contacto y/o chat in-app desbloqueado |
| En viaje | QR, GPS, estados (valor off-app no replica) |

### Contacto post-seña (alcance de este corte)
- **Día 1 obligatorio:** desbloqueo de **teléfono/WhatsApp** (o canal de contacto del perfil) solo con seña confirmada + CTA **Reportar bypass**.
- **Chat in-app:** opcional en el mismo corte si es barato; si no, se posterga. No es blocker del marketplace mínimo.
- Si hay chat: solo post-seña; filtro básico de patrones de teléfono / “mandame al WhatsApp”.

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
- Condiciones de uso explícitas: prohibido eludir la plataforma para cerrar el viaje; el contacto off-app para coordinar logistica puntual post-seña no equivale a cobrar/pagar el viaje afuera sin liquidar comisión.
- Violación reiterada + señales detective → pausa/suspensión (humano en el loop al inicio).

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
- `maps.*` (tolerancia de match localidad a nivel provider)
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
- [x] Waterfall seña↔comisión sin doble cobro  
- [x] Hold de cupo al aceptar + timeout de seña  
- [x] Solicitud→aceptación también con marketplace flag off  
- [x] Solapamiento agenda con márgenes en settings  
- [x] Migración KYC conductores Tubi existentes  
- [x] Contacto post-seña día 1; chat in-app no blocker  

---

## 17. Self-review (2026-10-14, post-commit)

### Hallazgos corregidos en este archivo
1. **Waterfall seña vs comisión** — era el hueco más grave: seña a Tubi + 15% extra podía leerse como doble take. Quedó invariante contable: seña = anticipo de `P`; Tubi termina en `C`; conductor en `P−C`; liquidación = `C−S` o crédito `S−C`.
2. **Concurrencia de cupos** — hold al aceptar; multi-solicitud hasta aceptación; timeout de seña.
3. **Flag marketplace** — peer se apaga con flag; solicitud→aceptación **no**.
4. **Solapamiento** — definición con intervalos y márgenes en settings.
5. **KYC conductores legacy Tubi** — deben verificarse antes de nuevas asignaciones.
6. **Chat** — desbloqueado como no-blocker; contacto post-seña sí es día 1.
7. **Cancelación de viaje completo** y **peer sin obligación de salir con 1 pax**.
8. **Saldo por transferencia peer** — al conductor, no custodia Tubi.
9. **ToS anti-bypass** — párrafo explícito.

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
| MapLibre+OSM; waypoints auto; búsqueda A→B | §8 |
| Anti-bypass + cancelaciones + detective mínimo | §7 |
| Notificaciones PWA | §9 |
| UX “tu parte” optimista | §6 |
| Operator asigna → tubi_operated | §3, §4 |
| Acuerdo interno chofer Tubi sin 15% | §3, §6 |

### Riesgos / bordes aún deliberadamente abiertos (plan, no spec bloqueante)
- Montos exactos default de `deposit.pct`, márgenes de solapamiento y timeouts (settings de operador al implementar).
- Algoritmo fino de “parada alineada a localidad” del geocoder (detalle de `MapsProvider`).
- UI concreta de bottom nav por modo (wireframes).
- Fusión mecánica de users legacy duplicados (paso de migración en plan).
- Si Operado por Tubi usa auto-accept más adelante (`request.auto_accept`).

### Consistencia interna
- Sin TBD/TODO.
- §12 (fuera de alcance) alineado con chat no-blocker y sin escrow pasarela.
- §16 checklist actualizado con invariantes del self-review.

---

*Documento generado en sesión de brainstorming. Self-review post-commit aplicado. Próximo paso tras OK del archivo: plan de implementación (`writing-plans`).*

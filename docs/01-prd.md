# PRD — Plataforma de Viajes Compartidos Interurbanos

**Producto:** plataforma de viajes compartidos interurbanos (tramo principal Tandil ↔ Buenos Aires).
**Documento:** 01-prd.md · Requisitos de producto.
**Estado:** borrador inicial (etapa de conceptualización).
**Nota:** el proyecto aún no tiene nombre ni marca definidos. En todo el documento se usa el placeholder neutro "la plataforma".

---

## 1. Visión y problema

Hoy, viajar entre ciudades como Tandil y Buenos Aires depende en gran parte de una dinámica informal: la gente contacta directamente a conductores particulares o conocidos que hacen el trayecto, y existen conductores que llevan pasajeros en un sentido y vuelven con el vehículo vacío pudiendo aceptar gente de manera informal en el regreso. La plataforma busca transformar esa dinámica en un servicio organizado, trazable y confiable, en el que el pasajero sepa qué viaje reserva, cuánto cuesta, quién lo lleva, en qué vehículo, dónde debe esperar, cómo identifica su reserva, qué pasa si se retrasa y dónde está el vehículo; el conductor sepa a quién recoger, dónde, cuánto esperar y quiénes están autorizados a subir; y el operador mantenga un registro completo de cada viaje y de lo ocurrido durante el mismo.

---

## 2. Objetivos y no-objetivos

### Objetivos

- Convertir la dinámica informal de viajes entre ciudades en un servicio **organizado, trazable y confiable**.
- Permitir buscar, reservar y pagar la seña de un asiento en viajes **programados** Tandil ↔ Buenos Aires, con paradas intermedias (Rauch, Flores u otras).
- Dar al pasajero **previsibilidad** sobre viaje, conductor, vehículo, ruta, horario y paradas.
- Dar al conductor **orden y control**: secuencia de recogida, verificación de pasajeros por QR y política de espera.
- Dar al operador **trazabilidad y operación**: estados de viaje, seguimiento GPS y registro de eventos.
- Arrancar con un **MVP web mobile-first** que permita iterar rápido y validar con una demo funcional en la primera semana.

### No-objetivos (qué NO es el MVP)

- No es un Uber tradicional bajo demanda: son **viajes interurbanos programados** con rutas y horarios definidos.
- No es una app nativa iOS/Android: es **web app mobile-first**.
- No es un sistema multi-destino generalizado: la ruta principal es Tandil ↔ Buenos Aires con paradas intermedias de esa ruta.
- No incluye ratings ni reputación (fase 2, detrás de feature flag).
- No incluye tarifa por kilómetro (modelo de tarifa fija por ruta).
- No incluye verificación de DNI automatizada (fase 1 es manual).
- No es un producto para entregar a terceros: se desarrolla **para este proyecto**, con propiedad y control de quien lo opera.

---

## 3. Actores y roles

| Actor | Qué hace | Desde qué dispositivo |
|---|---|---|
| **Pasajero** | Se registra (nombre + DNI + contacto). Busca viajes por origen, destino, fecha y horario. Ve el detalle del viaje (conductor, vehículo, ruta, paradas, horario). Reserva un asiento pagando una seña. Recibe un QR de reserva. Sigue el vehículo en vivo. Paga el saldo al subir. Puede cancelar según la política de devolución. | Celular (web mobile-first) |
| **Conductor** | Publica/opera viajes programados. Recibe la secuencia ordenada de paradas de recogida. Escanea el QR de cada pasajero para verificar la reserva antes de dejarlo subir. Registra el pago del saldo. Sigue/transmite posición durante el viaje. Marca estados del viaje y reporta incidentes. | Celular (web mobile-first), con transmisión de posición en background |
| **Operador** | Administra la plataforma. Configura parámetros de negocio (tarifas, comisión, seña, tiempos de espera, política de cancelación, feature flags). Gestiona viajes, conductores y vehículos. Monitorea estados, reservas, pagos y seguimiento. Verifica identidad de pasajeros (fase 1: manual). Resuelve incidentes. | Web (escritorio/celular) |

Nota: una misma persona física puede desempeñar más de un rol (por ejemplo, el operador puede ser a su vez conductor). A nivel de sistema, los roles se modelan por separado.

---

## 4. Modelo de negocio y monetización

El modelo se apoya en **parámetros configurables** (ver sección 10). Los valores indicados son los defaults de arranque y el operador puede modificarlos sin redeploy.

- **Precio del viaje:** precio base por ruta, definido por el operador. Modelo de tarifa **fijo por ruta** (el más simple; la tarifa por km queda fuera del MVP).
- **Comisión de la plataforma:** **15%** (rango configurable 0–15%) sobre el precio del viaje.
- **Seña de compromiso:** **$5.000** al reservar. No se exige el pago total anticipado (una plataforma nueva y desconocida generaría desconfianza). La seña compromete al pasajero: si cambia de decisión o no se presenta bajo ciertas condiciones, puede perderla.
- **Saldo:** se paga **al subir al vehículo**, a través de la plataforma (o por transferencia/otro medio contemplado).
- **Retención por cancelación/no-show:** según la política de devolución de seña (sección 7), la seña retenida es ingreso para el negocio y compensa combustible, peajes, tiempo del conductor y costos operativos.
- **Etapa inicial a pérdida:** en una primera etapa, si hay un solo pasajero reservado el viaje se realiza igual, asumiendo pérdidas operativas como costo inicial de poner en funcionamiento el servicio y generar confianza y demanda.

---

## 5. Flujos clave (journey por actor)

### 5.1 Buscar y reservar (pasajero)

1. El pasajero ingresa a la plataforma y busca viajes por **origen, destino, fecha y horario**.
2. Ve las opciones disponibles y el detalle de cada viaje: conductor, vehículo (patente, marca, modelo, color), ruta, horario aproximado y paradas.
3. Selecciona un viaje y reserva un asiento.
4. Paga la **seña** mediante la pasarela (MercadoPago, detrás de `PaymentProvider`).
5. La reserva queda asociada inequívocamente a un **viaje, un pasajero y (eventualmente) un asiento** concretos.
6. El pasajero recibe un **QR de reserva**.

### 5.2 Identificación y pago del saldo (subida al vehículo)

1. Al llegar al punto de recogida, el pasajero muestra su **QR** al conductor.
2. El conductor lo **escanea**. El sistema verifica que la reserva pertenece al **viaje concreto, al conductor concreto y al vehículo** correspondiente.
3. Si la verificación es válida, el pasajero **paga el saldo** (a través de la plataforma o por transferencia/otro medio contemplado) y sube.
4. La reserva queda marcada como verificada/abordada.

### 5.3 Recogida de pasajeros (conductor)

1. Antes de salir, el conductor recibe la **secuencia ordenada de paradas** de recogida (experiencia tipo navegación, como Uber; especialmente relevante en Tandil por ser una ciudad chica).
2. El conductor se dirige a cada parada en orden y escanea el QR de cada pasajero.
3. Aplica la **política de espera** (máximo configurable, default **5 min**). Si el pasajero no aparece, se lo marca como **no presentado** y se continúa la ruta, para no perjudicar a quienes llegaron a tiempo.

### 5.4 Viaje en curso + seguimiento (pasajero y conductor)

1. El conductor actualiza el estado del viaje: **recogida → en curso**.
2. El dispositivo del conductor **transmite posición**; los pasajeros visualizan en un **mapa** dónde está el vehículo y una estimación de llegada a los puntos de la ruta.
3. En tramos sin cobertura, las posiciones se **encolan localmente** y se sincronizan al recuperar conectividad.
4. Ante un **incidente** (accidente, problema mecánico, inconveniente en ruta), el conductor puede reportarlo; la plataforma lo comunica a los pasajeros.

### 5.5 Finalización

1. Al llegar a destino, el conductor marca el viaje como **completado**.
2. El sistema cierra el viaje y deja registro de: salida, recorrido, paradas, verificaciones de QR, pagos, incidentes y horario de finalización.

### 5.6 Cancelación y no-show

1. El pasajero puede cancelar una reserva; la **devolución de la seña** depende de la antelación (sección 7).
2. Si el pasajero no se presenta en la parada dentro del tiempo de espera, se lo marca como **no presentado** y la seña no se devuelve (según la política configurada).
3. El viaje puede **cancelarse** por el operador/conductor; en ese caso se aplican las reglas de devolución que correspondan.

---

## 6. Entidades y modelo de datos conceptual

### Entidades

| Entidad | Atributos principales | Notas |
|---|---|---|
| **Pasajero** | id, nombre, DNI, contacto (teléfono/email), estado de verificación de identidad | Registro mínimo: nombre + DNI + contacto |
| **Conductor** | id, nombre, DNI, contacto, estado | El operador puede ser también conductor |
| **Vehículo** | id, patente, marca, modelo, color, capacidad, conductor responsable | Información visible para el pasajero antes de subir |
| **Ruta** | id, nombre, origen, destino, tramos | Ruta principal Tandil ↔ Buenos Aires; contempla tramos/intermedios |
| **Parada** | id, ruta, nombre/ciudad, coordenadas, orden, tipo (origen / intermedio / destino) | Puntos de recogida o paso (Rauch, Flores, etc.) |
| **Viaje** | id, ruta, conductor, vehículo, fecha y horario de salida, horario estimado de llegada, precio, estado | Estados: programado → recogida → en curso → completado / cancelado |
| **Asiento** | id, vehículo, número/posición, estado | En el MVP puede operarse como contador de capacidad; la reserva *puede* referenciar un asiento concreto |
| **Reserva** | id, pasajero, viaje, asiento (opcional), estado, monto de seña, QR, fecha, política de cancelación aplicada | Vínculo inequívoco pasajero ↔ viaje ↔ conductor ↔ vehículo |
| **Pago** | id, reserva, tipo (seña / saldo), monto, método, estado (pendiente / confirmado / rechazado), referencia de pasarela, fecha | Seña vía pasarela; saldo al subir |
| **Evento de seguimiento GPS** | id, viaje, latitud, longitud, precisión, timestamp, origen (conductor), sincronizado | Permite cola offline en tramos sin cobertura |
| **Setting** | clave, valor, tipo, descripción, actualizado_por, fecha | Parámetros de negocio editables por el operador |

### Relaciones

- **Ruta 1—N Parada** (ordenada por `orden` dentro de la ruta).
- **Viaje N—1 Ruta**, **Viaje N—1 Conductor**, **Viaje N—1 Vehículo**.
- **Vehículo N—1 Conductor** (responsable del vehículo).
- **Reserva N—1 Pasajero**, **Reserva N—1 Viaje**, **Reserva 0—1 Asiento**.
- **Pago N—1 Reserva**.
- **Evento de seguimiento GPS N—1 Viaje**.

---

## 7. Reglas de negocio

Las reglas se expresan en función de los **settings** (sección 10). Los valores citados son los defaults.

- **RN-01 — Seña:** al reservar, el pasajero abona la seña (`reserva.sena_monto`, default **$5.000**). El asiento queda comprometido.
- **RN-02 — Saldo al subir:** el saldo (precio − seña − lo que corresponda según comisión) se paga al subir al vehículo, por plataforma o transferencia/otro medio contemplado.
- **RN-03 — Devolución de seña por cancelación del pasajero:**
  - Antelación **> 24 h** → devolución **100%** (`reserva.devolucion_24h_pct`).
  - Antelación **12–24 h** → devolución **50%** (`reserva.devolucion_12_24h_pct`).
  - Antelación **< 12 h** o **no-show** → devolución **0%** (`reserva.devolucion_menos_12h_pct`).
- **RN-04 — Política de espera en recogida:** el conductor espera un máximo de `reserva.espera_max_min` (default **5 min**) por pasajero en la parada. Vencido el tiempo, continúa la ruta y el pasajero se marca como **no presentado**, para no perjudicar a quienes cumplieron el horario.
- **RN-05 — Verificación por QR:** solo puede subir el pasajero cuya reserva sea verificada por QR como perteneciente al **viaje, conductor y vehículo** concretos. No se usan listas manuales ni se admite un pasajero de otro viaje.
- **RN-06 — Máquina de estados del viaje:** los estados válidos son **programado → recogida → en curso → completado**, y en cualquier punto previo a completar, **cancelado**. Cada transición queda registrada.
- **RN-07 — Viaje con un solo pasajero:** en la etapa inicial, un viaje programado **se realiza igual** aunque haya un único pasajero reservado (pérdida asumida como costo inicial).
- **RN-08 — Comisión:** la plataforma retiene `comision.plataforma_pct` (default **15%**, rango 0–15%) sobre el precio del viaje.
- **RN-09 — Precio:** `tarifa.modelo` = "fijo_por_ruta"; el precio base de la ruta Tandil ↔ Buenos Aires es `tarifa.precio_base_tandil_bsas` (a definir por el operador).

---

## 8. Requisitos funcionales

Prioridad: **P0** = MVP / demo de la primera semana · **P1** = inmediato post-MVP · **P2** = posterior.

### P0 — núcleo del MVP

- **FR-01 — Búsqueda de viajes.** El sistema debe permitir buscar viajes por origen, destino, fecha y horario. *Testeable:* dada una búsqueda Tandil→Buenos Aires para una fecha con viaje programado, el resultado incluye ese viaje.
- **FR-02 — Detalle de viaje.** El sistema debe mostrar, antes de reservar: conductor, vehículo (patente, marca, modelo, color), ruta, horario aproximado y paradas. *Testeable:* el detalle de un viaje muestra los campos obligatorios completos.
- **FR-03 — Registro de pasajero.** El sistema debe registrar al pasajero con nombre, DNI y contacto (teléfono/email) como mínimo. *Testeable:* un registro sin DNI es rechazado.
- **FR-04 — Reserva de asiento.** El sistema debe crear una reserva asociada inequívocamente a un viaje, un pasajero y (eventualmente) un asiento. *Testeable:* la reserva creada referencia viaje y pasajero correctos.
- **FR-05 — Pago de seña.** El sistema debe cobrar la seña a través de la pasarela (`PaymentProvider`, default MercadoPago). *Testeable:* al confirmar el pago, la reserva pasa a estado "seña pagada".
- **FR-06 — Generación de QR.** El sistema debe generar un QR único asociado a cada reserva. *Testeable:* dos reservas distintas generan QR distintos.
- **FR-07 — Verificación por QR (conductor).** El sistema debe permitir al conductor escanear el QR y verificar que la reserva pertenece al viaje, al conductor y al vehículo correctos. *Testeable:* un QR de otro viaje es rechazado; un QR válido es aceptado.
- **FR-08 — Pago del saldo al subir.** El sistema debe permitir registrar/confirmar el pago del saldo al momento de subir. *Testeable:* tras registrar el saldo, la reserva queda "abordada/pagada".
- **FR-09 — Registro de vehículo.** El sistema debe registrar vehículos con patente, marca, modelo, color y capacidad. *Testeable:* un vehículo sin patente o capacidad es rechazado.
- **FR-10 — Creación de viajes programados.** El sistema debe permitir crear viajes programados (ruta, conductor, vehículo, fecha/horario). *Testeable:* un viaje creado aparece como "programado" con sus datos.
- **FR-11 — Estados del viaje.** El sistema debe soportar el ciclo programado → recogida → en curso → completado / cancelado, con registro de cada transición. *Testeable:* cada cambio de estado queda persistido con timestamp.
- **FR-12 — Secuencia de recogida.** El sistema debe mostrar al conductor la secuencia ordenada de paradas de recogida. *Testeable:* las paradas se presentan en el orden definido para la ruta.
- **FR-13 — Política de espera.** El sistema debe aplicar un tiempo máximo de espera por pasajero (default 5 min) y permitir marcarlo como no presentado al vencer. *Testeable:* al vencer el tiempo, el pasajero se marca "no presentado" y el flujo permite continuar.
- **FR-14 — Seguimiento en vivo.** El sistema debe mostrar a los pasajeros la posición del vehículo en un mapa durante el viaje. *Testeable:* la posición reportada se refleja en el mapa del pasajero.
- **FR-15 — Cola offline de posiciones.** El sistema debe persistir posiciones GPS localmente cuando no hay conexión y sincronizarlas al recuperar conectividad. *Testeable:* posiciones capturadas sin red se envían automáticamente al volver la conexión, en orden.
- **FR-16 — Settings editables.** El sistema debe permitir al operador editar los parámetros de negocio (tarifa, comisión, seña, espera, devoluciones, feature flags) sin redeploy. *Testeable:* al cambiar un setting, las nuevas reservas usan el nuevo valor.
- **FR-17 — Cancelación de reserva.** El sistema debe permitir cancelar una reserva aplicando la política de devolución de seña según antelación. *Testeable:* una cancelación con >24 h devuelve 100% de la seña; con <12 h devuelve 0%.
- **FR-18 — Notificación de eventos del viaje.** El sistema debe notificar al pasajero eventos relevantes (salida, retraso, llegada, cancelación). *Testeable:* al cambiar el estado a "en curso", el pasajero recibe notificación.

### P1 — inmediato post-MVP

- **FR-19 — Reporte de incidentes.** El sistema debe permitir al conductor reportar incidentes en ruta (accidente, mecánico, etc.) y comunicarlos a los pasajeros. *Testeable:* un incidente reportado queda asociado al viaje y notifica a los pasajeros.
- **FR-20 — Verificación de identidad (DNI).** El sistema debe soportar verificación de identidad detrás de `IdentityVerifier` (fase 1: manual por el operador). *Testeable:* el operador puede marcar un pasajero como verificado; el estado queda persistido.
- **FR-21 — Historial del pasajero.** El sistema debe mostrar el historial de viajes/reservas del pasajero. *Testeable:* el historial lista las reservas del pasajero con su estado.
- **FR-22 — Panel de operador.** El sistema debe ofrecer un panel para listar viajes, reservas, pagos, estados y seguimiento. *Testeable:* el panel muestra los viajes del día con estado y ocupación.
- **FR-23 — ETA por parada.** El sistema debe estimar hora de llegada a las paradas de la ruta. *Testeable:* durante un viaje en curso se muestra una ETA que se actualiza con la posición.

### P2 — posterior

- **FR-24 — Ratings/reputación.** Habilitar calificación de pasajeros y conductores (feature flag `feature.ratings_habilitado`, default desactivado). *Testeable:* con el flag activado, un pasajero puede calificar un viaje completado.
- **FR-25 — Tarifa por kilómetro.** Modelo de tarifa por distancia (hoy fuera del MVP). *Testeable:* activando el modelo, el precio se calcula por km de la ruta.
- **FR-26 — Multi-destino ampliado.** Soportar rutas/destinos adicionales más allá del tramo principal. *Testeable:* crear y operar una ruta nueva con sus paradas.

---

## 9. Requisitos no funcionales

- **NFR-01 — Operación sin cobertura.** La captura de posición no debe asumir conexión permanente: las posiciones se encolan localmente y se sincronizan al recuperar conectividad.
- **NFR-02 — Transmisión en background.** El dispositivo del conductor debe poder transmitir posición en background (pantalla apagada/bloqueada). *Nota de alcance:* aquí se especifica el requisito; web pura vs PWA vs app se resuelve en el documento de arquitectura.
- **NFR-03 — Seguridad y autorización.** Autenticación de usuarios y control de acceso por rol (pasajero, conductor, operador). Las operaciones sensibles (reservas, pagos, verificación QR) requieren sesión autenticada y autorización.
- **NFR-04 — Privacidad del DNI.** El DNI y los datos personales deben tratarse como datos personales protegidos (Ley 25.326 de Protección de Datos Personales, Argentina): acceso restringido, cifrado en tránsito y en reposo, y minimización (el conductor solo ve lo necesario para verificar, no necesariamente el número completo).
- **NFR-05 — Performance mobile-first.** La interfaz debe ser usable en celular (ancho de referencia 375px) y cargar de forma razonable en redes móviles de cobertura limitada.
- **NFR-06 — Trazabilidad.** Toda transición de estado de viaje, reserva, pago y verificación QR debe quedar registrada con timestamp y actor.
- **NFR-07 — Integraciones desacopladas.** Pagos, mapas/GPS y verificación de identidad deben quedar detrás de interfaces (`PaymentProvider`, `MapsProvider`, `IdentityVerifier`) para poder cambiar de proveedor sin reescribir la lógica de negocio.

---

## 10. Sistema de configuración

Dos capas. **`.env`** = secretos e infraestructura estática. **Tabla de settings en DB** = parámetros de negocio editables por el operador sin redeploy.

### Capa 1 — `.env` (secretos e infraestructura)

| Parámetro | Descripción |
|---|---|
| `MERCADOPAGO_PUBLIC_KEY` / `MERCADOPAGO_ACCESS_TOKEN` | Credenciales de la pasarela de pago |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Conexión a la base/backend |
| `GOOGLE_MAPS_API_KEY` | Credencial del proveedor de mapas/GPS |
| `JWT_SECRET` (o equivalente) | Firma de sesiones/tokens |
| `APP_ENV` / `APP_BASE_URL` | Entorno y URL base |

### Capa 2 — Tabla de settings (parámetros de negocio)

| Clave | Default | Rango / valores | Descripción |
|---|---|---|---|
| `tarifa.precio_base_tandil_bsas` | a definir por el operador | ARS | Precio base del viaje Tandil ↔ Buenos Aires |
| `tarifa.modelo` | `fijo_por_ruta` | `fijo_por_ruta` | Modelo de tarifa (por km queda fuera del MVP) |
| `comision.plataforma_pct` | `15` | 0–15 | Comisión de la plataforma |
| `reserva.sena_monto` | `5000` | ARS | Monto de la seña |
| `reserva.espera_max_min` | `5` | minutos | Tiempo máximo de espera por pasajero |
| `reserva.devolucion_24h_pct` | `100` | 0–100 | Devolución de seña con antelación >24 h |
| `reserva.devolucion_12_24h_pct` | `50` | 0–100 | Devolución de seña con antelación 12–24 h |
| `reserva.devolucion_menos_12h_pct` | `0` | 0–100 | Devolución de seña con <12 h o no-show |
| `pagos.proveedor` | `mercadopago` | (referencia a `.env`) | Proveedor activo detrás de `PaymentProvider` |
| `mapas.proveedor` | `google_maps` | (referencia a `.env`) | Proveedor activo detrás de `MapsProvider` |
| `verificacion.dni_modo` | `manual` | `manual` (fase 1) | Modo de verificación detrás de `IdentityVerifier` |
| `feature.ratings_habilitado` | `false` | boolean | Feature flag de ratings/reputación (fase 2) |

---

## 11. Riesgos

### Técnicos

| Riesgo | Mitigación |
|---|---|
| Cobertura celular nula/intermitente en tramos de la ruta | Cola local de posiciones con sincronización al recuperar conexión (NFR-01). |
| Transmisión de posición en background limitada en web pura | Resolver en arquitectura (web vs PWA vs app); no es decisión de este documento. |
| Integración con MercadoPago y cobro de seña | Abstraer detrás de `PaymentProvider`; validar flujo en la demo. |
| Calidad/precisión de la ubicación GPS | Filtrar/validar eventos GPS; contemplar precisión reportada. |

### Legales y regulatorios

| Riesgo | Mitigación |
|---|---|
| **Transporte interurbano de pasajeros en Argentina:** habilitación del servicio, licencia profesional del conductor, seguro de pasajeros, responsabilidad civil, VTV y normativa aplicable (CNRT y jurisdicciones provinciales/municipales). Operar sin cumplir requisitos expone a sanciones y responsabilidad. | Asesoramiento legal antes de operar comercialmente; cumplir habilitaciones y seguros; consultar a José (30+ años en el rubro) para validar requisitos prácticos del servicio. |
| Tratamiento de datos personales (DNI, contacto, ubicación) | Cumplir Ley 25.326: minimización, cifrado, acceso restringido, consentimiento. |
| Cobro de seña y devoluciones como compromiso con validez legal | Definir condiciones claras y comunicarlas al pasajero antes de reservar. |

### De negocio

| Riesgo | Mitigación |
|---|---|
| Pérdidas iniciales por viajes con poca ocupación | Asumido como costo inicial; viajes programados todos los días para generar confianza y demanda. |
| Desconfianza del usuario nuevo (pago anticipado total) | Seña chica en lugar de pago completo; saldo al subir. |
| Cancelaciones/no-show de último momento | Seña como mecanismo de compromiso + política de devolución. |
| Competencia de la dinámica informal existente | Propuesta de valor: trazabilidad, confianza, previsibilidad. |

---

## 12. Fuera de alcance del MVP (explícito)

- Apps móviles nativas (iOS/Android) — arranca como web app mobile-first.
- Ratings y reputación (fase 2, detrás de feature flag).
- Tarifa por kilómetro / tarificación dinámica.
- Multi-destino generalizado (solo paradas intermedias de la ruta principal).
- Verificación de identidad automatizada (fase 1 manual).
- Chat en-app entre conductor y pasajero.
- Facturación electrónica / módulo fiscal completo.
- Internacionalización (un solo idioma: español).
- Administración de flota / mantenimiento de vehículos.

---

## 13. Métricas de éxito

| Métrica | Qué mide |
|---|---|
| Viajes programados por día | Tracción y frecuencia del servicio |
| Ocupación (asientos reservados / capacidad) | Eficiencia operativa |
| Reservas por semana | Demanda |
| Tasa de no-show | Calidad del compromiso y de la comunicación |
| Tasa de cancelación por franja (>24h, 12–24h, <12h) | Efectividad de la política de seña |
| Puntualidad de salida | Cumplimiento de horarios |
| % de verificaciones QR exitosas | Correcta identificación de pasajeros |
| Ingresos (señas retenidas + comisiones) | Sostenibilidad del modelo |
| Satisfacción del pasajero | Calidad percibida (encuesta simple en fase 1, ratings en fase 2) |

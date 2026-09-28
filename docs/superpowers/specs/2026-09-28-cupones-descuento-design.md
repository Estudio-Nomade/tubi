# Cupones de descuento (billetera + campaña) — Design

**Fecha:** 2026-09-28  
**Estado:** aprobado en brainstorm (pendiente plan de implementación)  
**Producto:** Tubi  
**Relacionado:** `docs/23-estrategia-lanzamiento.md` (oferta `TUBI1`), RN-01 seña, RN-02 saldo

## 1. Problema y objetivo

En lanzamiento se necesita un descuento promocional (ej. **$5.000 off**) que:

- quede **guardado en la cuenta** del pasajero tras canjear un código;
- **no modifique la seña** (compromiso intacto);
- se aplique al **saldo al subir**;
- sea trackeable por campaña (`TUBI1`, `PLAZA`, `WA`);
- limite cupos y uso por persona.

Hoy el saldo es `viaje.precio − reserva.monto_sena` sin descuentos. No hay entidad de cupón.

## 2. Decisiones de producto (v1)

| Decisión | Valor |
|----------|--------|
| Propósito | Promo / lanzamiento (no crédito genérico ni referidos automáticos) |
| Obtención | El pasajero **ingresa un código**; se guarda en su cuenta |
| Gasto (bloqueo) | Al **crear la reserva** el cupón pasa a `reservado` |
| Por reserva | **1 cupón**, monto **fijo** ARS (no %, no stacking) |
| Seña | **No se toca** (`monto_sena` y flujo de comprobante iguales) |
| Aplicación monetaria | Solo al **saldo al abordar** |
| Modelo | **Campaña + billetera** (`cupon_campania` + `cupon_usuario`) |

## 3. Modelo de datos

### 3.1 `cupon_campania`

Define el código público y las reglas de la oleada.

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | uuid PK | |
| `codigo` | text unique | Canje case-insensitive; guardar normalizado (upper/trim) |
| `monto_descuento` | numeric | Fijo ARS, > 0 |
| `cupos_totales` | int null | null = ilimitado |
| `cupos_usados` | int | Incrementa **al canjear** |
| `vigencia_desde` | timestamptz | Inicio de canje |
| `vigencia_hasta` | timestamptz | Fin de canje |
| `valido_dias_post_canje` | int | Días de vida del cupón en billetera tras canje |
| `max_por_usuario` | int | Default 1 |
| `ruta_id` | uuid null FK | null = cualquier ruta; si set, solo esa ruta |
| `activa` | boolean | Soft off sin borrar |
| `creada_por` | uuid null FK profiles | Operador |
| `created_at` / `updated_at` | timestamptz | |

### 3.2 `cupon_usuario`

Instancia en la billetera del pasajero.

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | uuid PK | |
| `campania_id` | uuid FK | |
| `pasajero_id` | uuid FK profiles | |
| `estado` | enum | `disponible` \| `reservado` \| `usado` \| `vencido` \| `anulado` |
| `monto_descuento` | numeric | Snapshot al canjear |
| `reserva_id` | uuid null FK | Set en `reservado` / `usado` |
| `canjeado_en` | timestamptz | |
| `vence_en` | timestamptz | `canjeado_en + valido_dias_post_canje` |
| `usado_en` | timestamptz null | |
| `created_at` / `updated_at` | timestamptz | |

**Unique parcial (recomendado):** un pasajero no puede tener más de N cupones “activos” de la misma campaña según `max_por_usuario`, contando estados `disponible` \| `reservado` \| `usado` (v1: sin reintento si ya usó o tiene uno de esa campaña).

### 3.3 Extensión de `reserva`

| Campo | Tipo | Notas |
|-------|------|--------|
| `cupon_usuario_id` | uuid null FK | 0 o 1 |
| `descuento_monto` | numeric not null default 0 | Snapshot; no recalcular después |

### 3.4 Fórmula de saldo (RN-02 extendida)

```
saldo = max(0, viaje.precio − reserva.monto_sena − reserva.descuento_monto)
```

- Seña y pagos tipo `sena`: sin cambio.
- Pago tipo `saldo`: se registra por el `saldo` calculado.
- Si `saldo = 0`: permitir abordar **sin** crear pago de saldo (o pago $0; preferir **sin fila de pago** si el monto es 0 — definir en implementación y testear).

## 4. Máquina de estados del cupón

```
[*] --> disponible : canje OK
disponible --> reservado : crear_reserva con este cupón
reservado --> disponible : cancel reserva (pasajero) o cancel viaje (operador), si no venció
reservado --> vencido : misma liberación pero ya pasó vence_en
reservado --> usado : registrar saldo / abordar
reservado --> usado : no_show
disponible --> vencido : lazy o job al listar/canjear/aplicar
disponible --> anulado : operador (fuera de v1 UI; reservar en enum)
```

### 4.1 Tabla de eventos

| Evento | Efecto en `cupon_usuario` |
|--------|---------------------------|
| Canje código | Crea `disponible`; `cupos_usados++` en campaña |
| Crear reserva con cupón | `disponible` → `reservado`; set `reserva_id`; snapshot `descuento_monto` en reserva |
| Cancelar reserva (`pendiente_sena` o `confirmada`, sin abordar) | `reservado` → `disponible` si `now < vence_en`, si no `vencido`; clear o conservar `reserva_id` histórico según implementación (preferir dejar último `reserva_id` solo en `usado`) |
| Seña rechazada | Cupón **sigue** `reservado` (reserva sigue `pendiente_sena`) |
| `registrar_saldo_y_abordar` | `reservado` → `usado` |
| `marcar_no_show` | `reservado` → `usado` (no reutilizable; anti-abuso) |
| `cancelar_viaje` (operador) | Liberar a `disponible` o `vencido` como cancel reserva |
| Lectura / listado | `disponible` con `vence_en < now` → `vencido` |

### 4.2 Canje — guards

1. Pasajero autenticado (rol pasajero).
2. Código normalizado existe.
3. Campaña `activa`.
4. `now` ∈ `[vigencia_desde, vigencia_hasta]`.
5. Si `cupos_totales` not null: `cupos_usados < cupos_totales`.
6. No exceder `max_por_usuario` para esa campaña (estados `disponible|reservado|usado`).
7. Transacción: insert `cupon_usuario` + update `cupos_usados`.

**Nota de producto:** el cupo de campaña se consume al **canjear**, no al viajar. Si el cupón vence sin uso, ese cupo de marketing ya se gastó. Es deliberado (oleada predecible).

### 4.3 Aplicar al reservar — guards

1. Cupón `disponible`, `pasajero_id = auth.uid()`, `now < vence_en`.
2. Si campaña tiene `ruta_id`, debe coincidir con `viaje.ruta_id`.
3. Una sola asociación por reserva.
4. Misma transacción que `crear_reserva` (asiento + cupón o nada).

## 5. UX

### 5.1 Pasajero

- **Mis cupones:** lista por estado (disponibles destacados; usados/vencidos secundarios). CTA “Canjear código”.
- **Canjear:** input → éxito con monto y fecha de vencimiento, o error de dominio.
- **Checkout / crear reserva:** si hay cupones aplicables a la ruta del viaje, selector (uno o “Sin cupón”). Resumen siempre visible:

  - Precio del viaje  
  - Seña (sin cambio)  
  - Descuento cupón (si hay)  
  - **Saldo al subir** (calculado)

- **Detalle de reserva:** línea de descuento y saldo estimado.

Copy fijo: *“La seña no cambia; el descuento se descuenta del saldo al subir.”*

### 5.2 Operador

- Sección campañas: crear (código, monto, cupos, vigencias, días post-canje, ruta opcional), listar, activar/desactivar.
- v1 no requiere editar monto de campañas ya canjeadas ni analytics avanzados.

### 5.3 Conductor

- Sin UI de cupones. Al cobrar saldo ve el monto ya descontado (opcional: indicador “con descuento”).

## 6. Arquitectura técnica

Alineado a capas existentes (domain / application / adapters / RPCs).

| Capa | Responsabilidad |
|------|-----------------|
| Domain | Tipos, enum estados, fórmula de saldo, mensajes de error, validaciones puras |
| Application | Canjear, listar míos, orquestar reserva+cupón, liberaciones vía cancel |
| Adapter Supabase | Repos + llamadas RPC |
| DB | Tablas, RLS, RPCs `security definer`, índices, unique parcial |

### 6.1 RPCs / enganches

| Pieza | Acción |
|-------|--------|
| `canjear_cupon(p_codigo text)` | Canje |
| `crear_reserva` extendida | Param opcional `p_cupon_usuario_id` |
| `cancelar_reserva` / `cancelar_viaje` | Liberar cupón |
| `registrar_saldo_y_abordar` | Monto con descuento + `usado` |
| `marcar_no_show` | `usado` |
| Lazy expire | En list/canje/aplicar (job opcional después) |

### 6.2 Errores de dominio (contrato)

| Código | Uso |
|--------|-----|
| `CUPON_NO_ENCONTRADO` | Código inválido |
| `CUPON_INACTIVO` | Campaña off |
| `CUPON_VENCIDO_CAMPANIA` | Fuera de ventana de canje |
| `CUPON_SIN_CUPOS` | Oleada agotada |
| `CUPON_YA_CANJEADO` | Tope por usuario |
| `CUPON_NO_DISPONIBLE` | Estado / vencido / no owner |
| `CUPON_RUTA_INVALIDA` | Ruta de campaña ≠ viaje |

### 6.3 Configuración

- Montos de **campaña** viven en la fila de campaña (no hardcode en app).
- Seña y precio base siguen en `settings` como hoy.
- Opcional: `cupones.enabled` (feature flag en `settings`) para apagar canje/aplicación sin redeploy.

### 6.4 Seguridad

- RLS: pasajero solo ve/actúa sobre sus `cupon_usuario`.
- Canje y mutaciones de estado solo por RPC (no update directo de cliente a `usado` / `cupos_usados`).
- Operador: CRUD campañas con `is_operador()`.
- Código de campaña no es secreto fuerte; el control real es cupos + max por usuario + auth.

## 7. Alcance v1 vs fuera

### Incluye

- Tablas + RPCs + fórmula de saldo.
- Canje + Mis cupones.
- Aplicar 1 cupón al crear reserva.
- Liberación en cancel; `usado` en abordar y no-show.
- UI operador mínima de campañas **o** seed inicial `TUBI1` si operador UI se posterga un slice (preferir UI operador en el mismo epic si el tiempo alcanza; si no, seed + SQL documentado).
- Tests de dominio + smoke del flujo canje → reserva → saldo.

### No incluye (explícito)

- Porcentaje, stacking, multi-cupón por reserva.
- Seña $0 / seña bonificada.
- Referidos automáticos, créditos de goodwill genéricos.
- Push de vencimiento, analytics de canal avanzados.
- Edición de `monto_descuento` post-canje en instancias ya emitidas.

## 8. Orden de implementación sugerido

1. Migración (enums, tablas, RLS, índices) + tests SQL/RPC de canje y guards.  
2. Extender `crear_reserva` + cancel/no-show/saldo.  
3. Domain + application + UI pasajero (canje, mis cupones, checkout).  
4. UI conductor solo si hace falta mostrar desglose.  
5. UI operador campañas (o seed `TUBI1` alineado a estrategia).  
6. Flag `cupones.enabled` si se quiere kill-switch.

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Doble submit canje/reserva | Unique + RPC transaccional |
| Cupón reservado sin reserva | Misma TX en `crear_reserva` |
| Abuso no-show + reuso | no-show → `usado` |
| Descuento ≥ precio − seña | `max(0, …)`; saldo 0 permitido |
| Cupos “perdidos” por canje sin viaje | Aceptado en v1; revisar métrica post-oleada |
| Confusión seña vs descuento | Copy fijo en checkout y detalle |

## 10. Criterios de aceptación (v1)

1. Operador (o seed) define campaña `TUBI1` $5000, N cupos, vigencia, 14 días post-canje.  
2. Pasajero canjea código y ve el cupón en Mis cupones.  
3. Segundo canje del mismo código por el mismo usuario falla con `CUPON_YA_CANJEADO` (si max=1).  
4. Al reservar con cupón: seña = setting; `descuento_monto` = 5000; cupón `reservado`.  
5. Conductor / flujo saldo cobra `precio − seña − 5000` (piso 0).  
6. Cancelar reserva libera cupón si no venció.  
7. No-show marca cupón `usado`.  
8. Sin cupón, flujo actual idéntico.

## 11. Referencias

- Estrategia: `docs/23-estrategia-lanzamiento.md` §3 Oferta de lanzamiento  
- Seña / saldo: `docs/06-reglas-y-estados.md` RN-01, RN-02  
- Settings: `reserva.sena_monto`, `tarifa.precio_base_tandil_bsas`  
- Reservas: RPC `crear_reserva`, `cancelar_reserva`, `registrar_saldo_y_abordar`, `marcar_no_show`

# Guión de demo — Tubi (5–7 min)

**Producto:** viajes compartidos interurbanos (Tandil ↔ Buenos Aires).  
**Público:** walkthrough operable con seed local.  
**Prerrequisito:** migraciones Supabase aplicadas **hasta `0014_slice7_demo_pack.sql`** inclusive (`supabase db reset` o migrate up).

Password de **todas** las cuentas demo: `demo-demo-1`

---

## Credenciales

| Rol | Nombre | Email | Password |
|---|---|---|---|
| Pasajero | Ana Demo | `pasajero.demo@tubi.local` | `demo-demo-1` |
| Pasajero (asiento 2) | Bruno Demo | `pasajero.b@tubi.local` | `demo-demo-1` |
| Pasajero (asiento 3) | Carla Demo | `pasajero.c@tubi.local` | `demo-demo-1` |
| Conductor | Luis Demo | `conductor.demo@tubi.local` | `demo-demo-1` |
| Operador | Operador Demo | `operador.demo@tubi.local` | `demo-demo-1` |

### Tokens QR del viaje de hoy (Plan B / sin cámara)

| Pasajero | `qr_token` (pegar en el scanner) |
|---|---|
| Ana | `opq_demo_ana_0001` |
| Bruno | `opq_demo_b_0002` |
| Carla | `opq_demo_c_0003` |

### IDs fijos (debug / SQL)

| Entidad | UUID |
|---|---|
| Viaje hoy 07:00 AR | `eeeeeeee-bbbb-cccc-dddd-000000000010` |
| Reserva Ana | `ffffffff-bbbb-cccc-dddd-000000000010` |
| Reserva Bruno | `ffffffff-bbbb-cccc-dddd-000000000011` |
| Reserva Carla | `ffffffff-bbbb-cccc-dddd-000000000012` |
| Conductor Luis | `aaaaaaaa-bbbb-cccc-dddd-000000000001` |
| Ana | `aaaaaaaa-bbbb-cccc-dddd-000000000010` |

Seed: 1 viaje **hoy 07:00** (AR), estado `programado`, precio $25.000, **3 reservas `confirmada`** con seña $5.000 ya confirmada.

---

## Antes de empezar (30 s)

1. App web levantada (mobile-first / viewport ~375px).
2. Supabase local con migraciones **0001 → 0014**.
3. Ventanas o perfiles: pasajero (Ana) y conductor (Luis). Operador opcional.
4. Si la demo ya se corrió y el viaje quedó en otro estado, re-aplicar seed (`db reset`) o re-ejecutar `0014`.

---

## Guión (~6 min)

### 0. Operador — skip si la cola está vacía (~30 s)

1. Login: `operador.demo@tubi.local` / `demo-demo-1`.
2. Ir a la cola de señas pendientes.
3. **Si está vacía** (esperado con el demo pack: las 3 señas ya vienen `confirmado`): decir en voz alta *“En producción el operador confirma transferencias; hoy el seed ya las dejó listas para no perder tiempo”* y cerrar sesión.
4. **Si hay pendientes** de otra prueba: confirmar una y mostrar el cambio a reserva confirmada.

### 1. Pasajero Ana — home y reservas (~2 min)

1. Login: `pasajero.demo@tubi.local` / `demo-demo-1`.
2. **Home:** viaje de hoy Tandil → Buenos Aires, estado de reserva confirmada.
3. **Mis reservas:** lista con la reserva de hoy (y cualquier otra del seed histórico si aparece).
4. Abrir el detalle / **pase QR** de Ana.
5. Mostrar el QR en pantalla. Decir: *“El conductor escanea este token; no lleva DNI ni datos sensibles”*.
6. Dejar la pantalla del QR visible (segundo dispositivo o split) para el paso del conductor.

### 2. Conductor Luis — recogida y 3 pasajeros (~3–4 min)

1. Logout Ana (o otra ventana). Login: `conductor.demo@tubi.local` / `demo-demo-1`.
2. **Home conductor:** viaje de hoy, 3 pasajeros confirmados, CTA para empezar.
3. **Empezar recogida** (viaje → `recogida`).
4. Abrir **Escanear QR**.
5. Escanear el QR de Ana **o** usar Plan B (abajo).
6. Tras verificar: **cobrar saldo** (efectivo o transferencia demo) → reserva `abordada`.
7. Repetir con Bruno y Carla (tokens Plan B si no hay cámara):
   - `opq_demo_b_0002`
   - `opq_demo_c_0003`
8. Volver al hub del viaje: mostrar **3 a bordo** / progreso completo.

### 3. Cierre (~30 s)

- Recapitular flujo: seña confirmada → QR → verificar → saldo → a bordo.
- Mencionar: política de espera, GPS y más rutas quedan fuera de este walkthrough.

---

## Plan B — pegar tokens (sin cámara)

Si el scanner no tiene cámara, falla el permiso, o la demo es en desktop:

1. En la pantalla de escaneo del conductor, usar el campo / acción de **ingreso manual de token** (si existe en la UI).
2. Pegar uno por uno:

```
opq_demo_ana_0001
opq_demo_b_0002
opq_demo_c_0003
```

3. Después de cada token válido: pantalla de OK → cobrar saldo → siguiente.
4. Si un token falla (“ya usado” / estado inválido): el viaje se corrompió por una demo anterior → `supabase db reset` y reiniciar el guión.

---

## Checklist rápido anti-fallos

| Síntoma | Qué hacer |
|---|---|
| No entra ningún login | Revisar Supabase Auth local y que existan los users de 0008/0011/0014 |
| Conductor sin viaje de hoy | Migración 0014 no aplicada o `fecha_salida` del día anterior → reset |
| Ana sin reserva | 0014 incompleto; chequear `reserva` del viaje `…0010` |
| QR inválido | Token mal copiado; usar exactamente `opq_demo_*` de la tabla |
| Viaje ya en `en_curso` / pasajeros `abordada` | Reset DB antes de la demo en vivo |
| Operador con cola llena de basura | Reset o limpiar `pago` pendientes de pruebas previas |

---

## Notas técnicas

- Migración del pack: `supabase/migrations/0014_slice7_demo_pack.sql`.
- Depende de: ruta/vehículo/conductor (`0008`), operador (`0011`), tablas `reserva`/`pago` y RPCs de slices 2–6.
- Conductor en seed anterior se llamaba Ariel; **0014 lo renombra a Luis**.
- Idempotencia: re-correr 0014 actualiza viaje de hoy, reservas y pagos por PK fija.

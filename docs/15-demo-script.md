# Guión de demo — Tubi (6–8 min)

**Producto:** viajes compartidos interurbanos (Tandil ↔ Buenos Aires).  
**Público:** walkthrough operable con seed local.  
**Prerrequisito:** migraciones Supabase aplicadas **hasta `0019_demo_pack_mvp_close.sql`** inclusive (`supabase db reset` o migrate up).

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

### Tokens QR del viaje de recogida (Plan B / sin cámara)

| Pasajero | `qr_token` (pegar en el scanner) |
|---|---|
| Ana | `opq_demo_ana_0001` |
| Bruno | `opq_demo_b_0002` |
| Carla | `opq_demo_c_0003` |

### IDs fijos (debug / SQL)

| Entidad | UUID | Estado seed |
|---|---|---|
| Viaje A hoy 07:00 AR | `eeeeeeee-bbbb-cccc-dddd-000000000010` | `programado` · 3 confirmadas |
| Viaje B hoy 14:00 AR | `eeeeeeee-bbbb-cccc-dddd-000000000020` | `en_curso` · listo Finalizar |
| Viaje C mañana 09:00 AR | `eeeeeeee-bbbb-cccc-dddd-000000000030` | seña pendiente (Bruno) |
| Reserva Ana (QR) | `ffffffff-bbbb-cccc-dddd-000000000010` | `confirmada` |
| Conductor Luis | `aaaaaaaa-bbbb-cccc-dddd-000000000001` | — |
| Ana | `aaaaaaaa-bbbb-cccc-dddd-000000000010` | — |

Seed post-0019:

1. **Viaje A** hoy 07:00 · `programado` · Ana/Bruno/Carla `confirmada` + QR (recogida / C5).
2. **Viaje B** hoy 14:00 · `en_curso` · Bruno abordada + Carla no_show → **Finalizar viaje** (sin Ana, para no tapar su home/QR).
3. **Viaje C** mañana · Bruno `pendiente_sena` + pago `pendiente` → cola operador.

---

## Antes de empezar (30 s)

1. App web levantada (mobile-first / viewport ~375px).
2. Supabase local con migraciones **0001 → 0019**.
3. Ventanas o perfiles: pasajero (Ana), conductor (Luis), operador.
4. Si la demo ya se corrió: `supabase db reset` (reaplica 0014 + 0019).

---

## Guión (~7 min)

### 0. Operador — cola de señas (~45 s)

1. Login: `operador.demo@tubi.local` / `demo-demo-1`.
2. Home: **≥1 seña pendiente** (viaje de mañana de Bruno).
3. Abrir comprobante → **Confirmar** (o rechazar y explicar reenvío).
4. Opcional: **Configuración** → tocar monto de seña o tiempo de espera.
5. Cerrar sesión (o dejar pestaña).

### 1. Pasajero Ana — Mis reservas → Ver QR (~2 min)

1. Login: `pasajero.demo@tubi.local` / `demo-demo-1`.
2. **Home:** viaje de hoy Tandil → Buenos Aires, reserva confirmada.
3. **Mis reservas** (home o tab): lista con la de hoy.
4. En la tarjeta confirmada: **Ver QR** (o entrar al pase).
5. Mostrar el QR. Decir: *“El conductor escanea este token; no lleva DNI ni datos sensibles”*.
6. Dejar el QR visible para el paso del conductor.

### 2. Conductor Luis — recogida, No llegó, saldo (~3 min)

1. Login: `conductor.demo@tubi.local` / `demo-demo-1`.
2. **Home:** viaje de hoy 07:00, 3 pasajeros confirmados.
3. **Empezar recogida** (viaje → `recogida`).
4. Abrir pasajero → pantalla C5: timer de espera + **No llegó**.
5. **Escanear QR** de Ana (cámara o Plan B: `opq_demo_ana_0001`).
6. Cobrar **saldo** (efectivo o transferencia) → `abordada`.
7. En Bruno o Carla: demo **No llegó** (o escanear + saldo en los demás).
8. Hub: progreso a bordo / no_show.

### 3. Finalizar viaje (~1 min)

**Opción rápida (seed listo):**

1. En home conductor, abrir el viaje de las **14:00** (`en_curso`).
2. CTA **Finalizar viaje** → confirmar.
3. Estado `completado`. Decir: *“Solo se puede cerrar cuando no quedan confirmadas/verificadas pendientes”*.

**Opción larga:** terminar de abordar/no-show a todos en el viaje de las 07:00 hasta `en_curso`, luego Finalizar.

### 4. Cierre (~30 s)

- Flujo: seña → operador → QR → recogida → saldo / no llegó → finalizar.
- Fuera de scope del walkthrough: GPS en vivo, multi-ruta, apps nativas.

---

## Plan B — pegar tokens (sin cámara)

1. En escaneo del conductor, ingreso manual de token.
2. Pegar uno por uno:

```
opq_demo_ana_0001
opq_demo_b_0002
opq_demo_c_0003
```

3. Tras cada token válido: OK → cobrar saldo → siguiente.
4. Si falla (“ya usado”): `supabase db reset` y reiniciar.

---

## Checklist rápido anti-fallos

| Síntoma | Qué hacer |
|---|---|
| No entra ningún login | Auth local + users 0008/0011/0014 |
| Conductor sin viaje de hoy | Falta 0019 o fecha vieja → reset |
| Ana sin QR | Reserva `…010` no `confirmada`; chequear 0014/0019 |
| Cola operador vacía | Falta viaje C / pago `…030` pendiente |
| Finalizar deshabilitado | Hay `confirmada`/`verificada`; usar viaje B o cerrar pendientes |
| Viaje ya consumido por demo previa | `supabase db reset` |

---

## Notas técnicas

- Pack base: `0014_slice7_demo_pack.sql` (users + viaje A).
- Refresh MVP: `0019_demo_pack_mvp_close.sql` (fechas hoy AR, viaje B finalizar, viaje C seña).
- Depende de: ruta/vehículo/conductor (`0008`), operador (`0011`), RPCs slices 2–10.
- Idempotencia: re-correr 0019 actualiza por PK fija; no recrea auth users.

# Tubi — Go-live producción este mes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`). Commits: humano firma `git commit -S`. Nunca `git add .`.

**Goal:** En 5–7 días hábiles dejar Tubi operable en producción real: entorno vivo + cancelar viaje con devoluciones claras + (después) operador crea viajes sin SQL.

**Architecture:** Capas `domain → application → adapters → UI`. Mutaciones = RPC security definer + RLS. Settings de negocio solo desde tabla `settings`. UI Ruta de la Siesta (375px, Fraunces/DM Sans, cards existentes). **Sin mapa, sin push, sin pasarela bancaria automática** en este plan.

**Tech Stack:** Next.js (`apps/web`) · Supabase · Vercel (o host actual) · bun · design system `components/design/*`.

**Fuentes:** `docs/01-prd.md` (FR-09/10/11, RN-CANCEL), `docs/06-reglas-y-estados.md`, `docs/16-mvp-launch-checklist.md`, migraciones `0001`–`0019`, operador actual (`/operador` = cola señas + settings), `completar_viaje` ya en main.

**Fuera de scope (congelado hasta post go-live):** GPS/mapa, cola offline, notificaciones push, incidentes, alta de rutas nuevas, multi-destino, ratings, devolución bancaria automática.

---

## 0. Realidad de partida (main post PR #6)

| Capacidad | Estado |
|---|---|
| Happy path pasajero/conductor + finalizar | **Código listo** |
| Cancel reserva pasajero + no-show + settings UI | **Código listo** |
| Migraciones 0001–0019 | **En repo; checklist sin tildar en prod** |
| Cancel viaje operador + cola devoluciones | **No existe** |
| Alta vehículo/viaje UI | **No existe** |
| Staging/prod smoke 3 roles | **No evidenciado** |

### Orden agresivo (ajustado — no negociable)

```
Día 1–2:   G1       Entorno + smoke (bloquea todo lo demás)
Día 2–4:   G3       Cancel viaje + cola devoluciones  ← primero (crítico en calle)
Día 4–6:   G2       Alta vehículo + viaje UI          ← después (seed/SQL OK al inicio)
Día 6–7:   G1.final Re-smoke prod + go/no-go
```

**Por qué G3 antes que G2:** los primeros días se pueden cargar viajes por seed/SQL; **no** se puede operar sin poder cancelar un viaje y registrar devoluciones si llueve, se rompe el auto o no sale la combi.

**Reglas de dependencia:**

- No empezar G3 en “solo local” sin **staging** con migraciones + login (G1 mínimo).
- G3 incluye lista/detalle de viajes **solo lectura** + cancelar (no alta). Así el operador ve viajes seed/SQL y puede cancelarlos.
- G2 agrega los forms de alta sobre esa lista.

**Esfuerzo total:** **5–7 días** (1 dev + IA). Buffer 1 día si Vercel/Supabase pelea.

**Numeración migraciones (orden de apply):**

| # | Slice | Archivo |
|---|---|---|
| 0020 | G3 | `0020_slice9b_cancelar_viaje.sql` |
| 0021 | G3 | `0021_slice9b_devolucion_marcada.sql` |
| 0022 | G2 | `0022_slice11_alta_vehiculo_viaje.sql` |

---

## 1. Mapa de archivos (por slice)

### G1 — Entorno
| Crear/modificar | Rol |
|---|---|
| Supabase proyecto prod + staging | Infra |
| Vercel project + env | Deploy |
| `docs/16-mvp-launch-checklist.md` | Tildar evidencia |
| `docs/21-go-live-runbook.md` | Runbook corto ops (incluye “cómo cargar viajes por SQL hasta G2”) |

### G3 — Cancel viaje + devoluciones (+ lista viajes read-only)
| Path | Rol |
|---|---|
| `supabase/migrations/0020_slice9b_cancelar_viaje.sql` | RPC `cancelar_viaje` |
| `supabase/migrations/0021_slice9b_devolucion_marcada.sql` | `devolucion_saldada_en` + RPC marcar |
| `apps/web/src/domain/viajes/cancel-trip.ts` | Errores + mensajes |
| `apps/web/src/domain/operador/` (list types/ports mínimos) | Domain lectura viajes + devoluciones |
| `apps/web/src/adapters/supabase/operador-viajes-repository.ts` | Adapter |
| `apps/web/src/application/operador/*` | Actions cancel + list + marcar |
| `apps/web/src/app/operador/viajes/page.tsx` | Lista viajes (read-only en G3) |
| `apps/web/src/app/operador/viajes/[id]/page.tsx` | Detalle + cancelar |
| `apps/web/src/app/operador/devoluciones/page.tsx` | Cola `monto_devolucion > 0` |
| `apps/web/src/components/operador/cancel-trip-button.tsx` | CTA |
| `apps/web/src/components/operador/mark-refund-done-button.tsx` | Marcar devuelta |
| `apps/web/src/app/operador/page.tsx` | Nav Viajes + Devoluciones |
| `apps/web/src/app/pasajero/reservas/page.tsx` | Copy devolución pendiente |

### G2 — Alta vehículo + viaje
| Path | Rol |
|---|---|
| `supabase/migrations/0022_slice11_alta_vehiculo_viaje.sql` | RPC + RLS |
| `apps/web/src/domain/operador/catalog-*` | Domain alta |
| `apps/web/src/application/operador/catalog-*` | Actions/service |
| `apps/web/src/adapters/supabase/operador-catalog-repository.ts` | Adapter (o extender el de G3) |
| `apps/web/src/app/operador/viajes/nuevo/page.tsx` | Form viaje |
| `apps/web/src/app/operador/vehiculos/nuevo/page.tsx` | Form vehículo |
| `apps/web/src/components/operador/*-form.tsx` | UI forms |
| `apps/web/src/app/operador/viajes/page.tsx` | CTA “Programar viaje” (antes solo lista) |

---

## Decisiones cerradas (no reabrir en implementación)

| Tema | Decisión |
|---|---|
| Orden slices | **G1 → G3 → G2 → G1.final** |
| Viajes los primeros días | Seed staging / **SQL o dashboard Supabase en prod** hasta G2; documentado en runbook |
| Rutas | **Solo rutas seed** (Tandil↔BsAs). Sin CRUD de rutas |
| Conductores | Dropdown de `profiles` con `rol = conductor` (G2) |
| Precio viaje | Snapshot `settings.tarifa.precio_base_tandil_bsas` al crear; override opcional en form |
| Vehículo | patente, marca, modelo, color, capacidad, conductor_id |
| Viaje | ruta_id, conductor_id, vehiculo_id (mismo conductor), fecha+hora AR, precio |
| Cancel viaje | Solo **operador**. Origen: `programado \| recogida \| en_curso` → `cancelado` |
| Reservas al cancelar | No terminales (`pendiente_sena`, `confirmada`, `verificada`) → `cancelada` |
| Devolución RN-CANCEL | Seña **confirmada**: 100% de `monto_sena`. `pendiente_sena`: 0. No tocar `abordada`/`no_show`/`cancelada` |
| Plata | **No** se mueve sola. Cola + marcar “ya transferí” |
| Flag saldada | `reserva.devolucion_saldada_en timestamptz null` |
| Seed en prod | **Prohibido** 0014/0019 en prod |
| Auth prod | Emails reales; no publicar `@tubi.local` |

---

# Slice G1 — Entorno real + smoke (bloqueante)

**Runbook:** `docs/21-go-live-runbook.md`

**Esfuerzo:** 1–2 días · **Riesgo:** medio (cuentas cloud, DNS, secrets)

### Task G1.1 — Supabase staging + prod

- [ ] **Step 1:** Crear/usar proyecto Supabase **staging** y **prod** (separados).
- [ ] **Step 2:** Aplicar migraciones `0001` → `0019` (luego 0020+ al cerrar cada slice):

```bash
supabase db push
```

Expected: RPCs existentes (`completar_viaje`, `cancelar_reserva`, `marcar_no_show`, …) OK.

- [ ] **Step 3:** Storage bucket de comprobantes (nombre según código):

```bash
rg -n "comprobantes|storage\.from" apps/web/src
```

Bucket privado + policies pasajero escribe / operador lee.

- [ ] **Step 4:** Auth: Site URL / redirects de la app.
- [ ] **Step 5:** **No** seed demo en prod. Staging: sí `0014`+`0019` para smoke.

---

### Task G1.2 — Deploy web

- [ ] **Step 1:** Vercel (u host) → monorepo / `apps/web`. Validar `vercel.json` + package manager.
- [ ] **Step 2:** Env staging + prod desde `apps/web/.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 3:** Deploy; abrir `/login` en 375px.
- [ ] **Step 4:** Crear `docs/21-go-live-runbook.md` (URLs, migrate, keys, **cómo insertar viaje SQL hasta G2**, “seed nunca en prod”).

```bash
# Usuario: git commit -S -m "docs: go-live runbook"
```

---

### Task G1.3 — Usuarios reales mínimos

- [ ] **Step 1:** Registrar operador, conductor, pasajero reales (UI registro).
- [ ] **Step 2:** Si hace falta promover operador (ops only, runbook):

```sql
update public.profiles set rol = 'operador' where id = '<uuid>';
```

- [ ] **Step 3:** Staging: seed o SQL para ≥1 viaje de prueba con reservas (para G3 cancel).

---

### Task G1.4 — Smoke 3 roles (evidencia)

Ejecutar y tildar `docs/16-mvp-launch-checklist.md` en **staging**.

1. Pasajero: buscar → seña → (operador confirma) → Mis reservas → QR  
2. Conductor: recogida → escanear → saldo → finalizar (si hay viaje listo)  
3. Operador: cola seña + settings  

- [ ] **Step 1:** Anotar fecha OK/FAIL.
- [ ] **Step 2:** Si login/reserva/QR fallan → no arrancar G3 features hasta verde.

**Done G1:** HTTPS + DB migrada + storage + checklist staging happy path básico.

---

# Slice G3 — Cancel viaje + cola devoluciones (RN-CANCEL) · PRIORIDAD POST-ENTORNO

**Esfuerzo:** 1.5–2.5 días · **Riesgo:** medio-alto (dinero + estados)  
**Pencil:** cards operador existentes; BtnDanger para cancelar; inventory corto opcional.

> **Nota:** En G3 la lista `/operador/viajes` es **read-only** (viajes ya cargados por seed/SQL). El CTA “Programar viaje” llega en G2.

### Task G3.0 — Inventory mínimo + nav operador

- [ ] **Step 1:** Doc corto tokens (card, pill, danger CTA) si hace falta.
- [ ] **Step 2:** Home operador: links `Viajes` · `Devoluciones` · `Settings` (además de señas).

---

### Task G3.1 — RPC `cancelar_viaje`

**Files:** Create `supabase/migrations/0020_slice9b_cancelar_viaje.sql`

```sql
create or replace function public.cancelar_viaje(p_viaje_id uuid, p_motivo text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rol rol;
  v_viaje viaje%rowtype;
  r reserva%rowtype;
  v_count int := 0;
  v_refund_total numeric := 0;
  v_sena_ok boolean;
  v_monto numeric;
begin
  if v_uid is null then raise exception 'NO_AUTENTICADO' using errcode = 'P0001'; end if;
  select rol into v_rol from profiles where id = v_uid;
  if v_rol is distinct from 'operador' then raise exception 'NO_AUTORIZADO' using errcode = 'P0001'; end if;

  select * into v_viaje from viaje where id = p_viaje_id for update;
  if not found then raise exception 'NO_ENCONTRADO' using errcode = 'P0001'; end if;

  if v_viaje.estado not in ('programado', 'recogida', 'en_curso') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  for r in
    select * from reserva
    where viaje_id = v_viaje.id
      and estado in ('pendiente_sena', 'confirmada', 'verificada')
    for update
  loop
    v_monto := 0;
    if r.estado in ('confirmada', 'verificada') then
      select exists (
        select 1 from pago p
        where p.reserva_id = r.id and p.tipo = 'sena' and p.estado = 'confirmado'
      ) into v_sena_ok;
      if v_sena_ok then
        v_monto := r.monto_sena;
      end if;
    end if;

    update reserva set
      estado = 'cancelada',
      cancelada_en = now(),
      monto_devolucion = v_monto,
      devolucion_pct = case when v_monto > 0 then 100 else 0 end,
      updated_at = now()
    where id = r.id;

    v_count := v_count + 1;
    v_refund_total := v_refund_total + v_monto;
  end loop;

  update viaje set estado = 'cancelado', updated_at = now() where id = v_viaje.id;

  return jsonb_build_object(
    'ok', true,
    'viaje_id', v_viaje.id,
    'estado', 'cancelado',
    'reservas_canceladas', v_count,
    'monto_devolucion_total', v_refund_total,
    'motivo', p_motivo
  );
end;
$$;

revoke all on function public.cancelar_viaje(uuid, text) from public;
grant execute on function public.cancelar_viaje(uuid, text) to authenticated;
```

- [ ] **Step 1:** Push staging.
- [ ] **Step 2:** Commit.

---

### Task G3.2 — Flag devolución saldada

**Files:** Create `supabase/migrations/0021_slice9b_devolucion_marcada.sql`

```sql
alter table public.reserva
  add column if not exists devolucion_saldada_en timestamptz;

comment on column public.reserva.devolucion_saldada_en is
  'When operator marked sena refund as paid out-of-band. null = still pending if monto_devolucion > 0.';

create or replace function public.marcar_devolucion_saldada(p_reserva_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rol rol;
  v_r reserva%rowtype;
begin
  if v_uid is null then raise exception 'NO_AUTENTICADO' using errcode = 'P0001'; end if;
  select rol into v_rol from profiles where id = v_uid;
  if v_rol is distinct from 'operador' then raise exception 'NO_AUTORIZADO' using errcode = 'P0001'; end if;

  select * into v_r from reserva where id = p_reserva_id for update;
  if not found then raise exception 'NO_ENCONTRADO' using errcode = 'P0001'; end if;
  if coalesce(v_r.monto_devolucion, 0) <= 0 then
    raise exception 'SIN_DEVOLUCION' using errcode = 'P0001';
  end if;
  if v_r.devolucion_saldada_en is not null then
    raise exception 'YA_SALDADA' using errcode = 'P0001';
  end if;

  update reserva set devolucion_saldada_en = now(), updated_at = now()
  where id = p_reserva_id;

  return jsonb_build_object('ok', true, 'reserva_id', p_reserva_id, 'saldada_en', now());
end;
$$;

revoke all on function public.marcar_devolucion_saldada(uuid) from public;
grant execute on function public.marcar_devolucion_saldada(uuid) to authenticated;
```

- [ ] **Step 1:** Push + commit.

---

### Task G3.3 — Domain / adapter / actions (list + cancel + refunds)

**Files:**
- Create: `apps/web/src/domain/viajes/cancel-trip.ts`
- Create: types/ports listado operador (viajes + devoluciones)
- Create: `apps/web/src/adapters/supabase/operador-viajes-repository.ts`
- Modify: `application/operador/*`, `lib/supabase/types.ts`

- [ ] **Step 1:** `mapCancelTripError` / `cancelTripErrorUserMessage` (NO_AUTORIZADO, TRANSICION_INVALIDA, NO_ENCONTRADO, …).
- [ ] **Step 2:** Repo: `listViajesProximos`, `getViajeDetalle`, `listDevolucionesPendientes`, `cancelarViaje`, `marcarDevolucionSaldada`.
- [ ] **Step 3:** Actions server + revalidate paths.
- [ ] **Step 4:** type-check + commit.

---

### Task G3.4 — UI cancel + cola + copy pasajero

- [ ] **Step 1:** `/operador/viajes` — lista próximos/recientes (cards). **Sin** CTA crear aún. Empty: “No hay viajes cargados. Pedile al técnico el alta SQL o esperá la pantalla de alta.”
- [ ] **Step 2:** `/operador/viajes/[id]` — meta viaje + reservas resumidas + `CancelTripButton` si `programado|recogida|en_curso`. Confirm:

```
¿Cancelar este viaje? Se cancelan las reservas abiertas y se registra devolución 100% de señas confirmadas. La plata la transferís vos después desde Devoluciones.
```

- [ ] **Step 3:** `/operador/devoluciones` — filas con `monto_devolucion > 0` y `devolucion_saldada_en is null`; botón “Marqué como transferida”.
- [ ] **Step 4:** Home operador: links Viajes + Devoluciones (badge count si es barato).
- [ ] **Step 5:** Mis reservas pasajero: si `cancelada` y `monto_devolucion > 0` → “Devolución pendiente: $X”.
- [ ] **Step 6:** type-check + build.
- [ ] **Step 7:** Status `docs/22-slice-cancel-viaje-status.md` + commit.

**Done G3:** En staging, con viaje seed/SQL, operador cancela → reservas abiertas canceladas → cola con montos → marcar saldada. **Aún puede faltar UI de alta (G2).**

**Smoke G3 (obligatorio antes de G2):**

1. Viaje `programado` con ≥1 reserva `confirmada`  
2. Cancelar viaje  
3. Ver fila en Devoluciones  
4. Marcar saldada → desaparece de pendientes  

---

# Slice G2 — Alta vehículo + viaje (FR-09/10)

**Esfuerzo:** 2–2.5 días · **Riesgo:** medio (RLS)  
**Depende de:** G1 verde; G3 lista de viajes ya navegable (se le agrega CTA crear).

**Pencil:** forms Field + BtnPrimary; inventory `docs/superpowers/plans/2026-08-25-g2-operador-catalog-inventory.md`.

### Task G2.0 — Inventory UI alta

- [ ] **Step 1:** Tokens form + flujo Vehículo → Viaje.
- [ ] **Step 2:** Commit inventory.

---

### Task G2.1 — Migración RPC + RLS

**Files:** Create `supabase/migrations/0022_slice11_alta_vehiculo_viaje.sql`

- [ ] **Step 1:** Auditar policies existentes:

```bash
rg -n "policy.*vehiculo|policy.*viaje|on public.vehiculo|on public.viaje" supabase/migrations
```

- [ ] **Step 2:** RPC `crear_vehiculo` (solo operador):

```sql
create or replace function public.crear_vehiculo(
  p_conductor_id uuid,
  p_patente text,
  p_marca text,
  p_modelo text,
  p_color text,
  p_capacidad int
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rol rol;
  v_id uuid;
  v_patente text := upper(trim(p_patente));
begin
  if v_uid is null then raise exception 'NO_AUTENTICADO' using errcode = 'P0001'; end if;
  select rol into v_rol from profiles where id = v_uid;
  if v_rol is distinct from 'operador' then raise exception 'NO_AUTORIZADO' using errcode = 'P0001'; end if;
  if p_capacidad is null or p_capacidad < 1 or p_capacidad > 20 then
    raise exception 'CAPACIDAD_INVALIDA' using errcode = 'P0001';
  end if;
  if v_patente is null or length(v_patente) < 5 then
    raise exception 'PATENTE_INVALIDA' using errcode = 'P0001';
  end if;
  if not exists (select 1 from profiles where id = p_conductor_id and rol = 'conductor') then
    raise exception 'CONDUCTOR_INVALIDO' using errcode = 'P0001';
  end if;

  insert into vehiculo (conductor_id, patente, marca, modelo, color, capacidad)
  values (p_conductor_id, v_patente, trim(p_marca), trim(p_modelo), trim(p_color), p_capacidad)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'vehiculo_id', v_id, 'patente', v_patente);
exception
  when unique_violation then
    raise exception 'PATENTE_DUPLICADA' using errcode = 'P0001';
end;
$$;
```

- [ ] **Step 3:** RPC `crear_viaje`:

```sql
create or replace function public.crear_viaje(
  p_ruta_id uuid,
  p_conductor_id uuid,
  p_vehiculo_id uuid,
  p_fecha_salida timestamptz,
  p_precio numeric default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rol rol;
  v_precio numeric;
  v_id uuid;
  v_veh vehiculo%rowtype;
begin
  if v_uid is null then raise exception 'NO_AUTENTICADO' using errcode = 'P0001'; end if;
  select rol into v_rol from profiles where id = v_uid;
  if v_rol is distinct from 'operador' then raise exception 'NO_AUTORIZADO' using errcode = 'P0001'; end if;

  if p_fecha_salida is null or p_fecha_salida < now() - interval '1 hour' then
    raise exception 'FECHA_INVALIDA' using errcode = 'P0001';
  end if;
  if not exists (select 1 from ruta where id = p_ruta_id) then
    raise exception 'RUTA_INVALIDA' using errcode = 'P0001';
  end if;
  if not exists (select 1 from profiles where id = p_conductor_id and rol = 'conductor') then
    raise exception 'CONDUCTOR_INVALIDO' using errcode = 'P0001';
  end if;

  select * into v_veh from vehiculo where id = p_vehiculo_id;
  if not found then raise exception 'VEHICULO_INVALIDO' using errcode = 'P0001'; end if;
  if v_veh.conductor_id <> p_conductor_id then
    raise exception 'VEHICULO_CONDUCTOR_MISMATCH' using errcode = 'P0001';
  end if;

  if p_precio is null then
    select (valor #>> '{}')::numeric into v_precio
    from settings where clave = 'tarifa.precio_base_tandil_bsas';
    if v_precio is null then
      raise exception 'SETTING_MISSING:tarifa.precio_base_tandil_bsas' using errcode = 'P0001';
    end if;
  else
    v_precio := p_precio;
  end if;
  if v_precio <= 0 then raise exception 'PRECIO_INVALIDO' using errcode = 'P0001'; end if;

  insert into viaje (ruta_id, conductor_id, vehiculo_id, fecha_salida, precio, estado)
  values (p_ruta_id, p_conductor_id, p_vehiculo_id, p_fecha_salida, v_precio, 'programado')
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'viaje_id', v_id,
    'precio', v_precio,
    'estado', 'programado'
  );
end;
$$;

revoke all on function public.crear_vehiculo from public;
revoke all on function public.crear_viaje from public;
grant execute on function public.crear_vehiculo to authenticated;
grant execute on function public.crear_viaje to authenticated;
```

- [ ] **Step 4:** `supabase db push` staging + commit.

---

### Task G2.2 — Domain + application + adapter alta

**Files:** catalog types/ports/errors; catalog repository o extensión; `catalog-actions.ts`.

```ts
export type VehiculoInput = {
  conductorId: string;
  patente: string;
  marca: string;
  modelo: string;
  color: string;
  capacidad: number;
};

export type ViajeInput = {
  rutaId: string;
  conductorId: string;
  vehiculoId: string;
  fechaSalidaIso: string;
  precio?: number | null;
};
```

- [ ] **Step 1:** Ports: `listRutas`, `listConductores`, `listVehiculos`, `crearVehiculo`, `crearViaje` (list viajes ya en G3).
- [ ] **Step 2:** Actions + revalidate `/operador/viajes`.
- [ ] **Step 3:** type-check + commit.

---

### Task G2.3 — UI alta

- [ ] **Step 1:** Home: link “Nuevo vehículo”.
- [ ] **Step 2:** `/operador/vehiculos/nuevo` — form completo.
- [ ] **Step 3:** `/operador/viajes` — agregar CTA **Programar viaje** (lista ya existe de G3).
- [ ] **Step 4:** `/operador/viajes/nuevo` — ruta, conductor, vehículo filtrado, datetime-local AR → ISO, precio override opcional.
- [ ] **Step 5:** Empty lista actualizado: “Programá el primero” (ya no solo SQL).
- [ ] **Step 6:** type-check + build + commit.

**Done G2:** Operador crea vehículo + viaje en UI; pasajero lo busca el mismo día **sin SQL**.

---

# Slice G1.final — Re-smoke prod + go/no-go

**Esfuerzo:** 0.5–1 día

- [ ] **Step 1:** Migraciones `0020`–`0022` en **prod**.
- [ ] **Step 2:** Deploy web prod.
- [ ] **Step 3:** Smoke prod (ideal sin seed demo):
  1. Operador crea vehículo + viaje (G2) **o**, si G2 se retrasó: SQL documentado + cancel (G3) sigue siendo obligatorio  
  2. Pasajero reserva + seña + QR  
  3. Conductor flujo mínimo o validación equipo  
  4. Operador cancela viaje de prueba → Devoluciones → marcar saldada  
  5. Settings: cambiar seña, nueva reserva usa valor nuevo  
- [ ] **Step 4:** Tildar checklist + runbook prod.
- [ ] **Step 5:** Decisión Go / No-go en `docs/21-go-live-runbook.md`.

---

## 2. Calendario sugerido (5–7 días) — orden G1 → G3 → G2

| Día | Focus | Salida |
|---|---|---|
| **1** | G1.1–G1.2 staging deploy | URL staging viva |
| **2** | G1.3–G1.4 smoke + G3.1–G3.2 RPC | Cancel en DB |
| **3** | G3.3–G3.4 UI cancel + devoluciones | Cola operable; lista viajes read-only |
| **4** | G2.1 migration + domain alta | RPCs crear_* |
| **5** | G2.2–G2.3 UI alta | Crear viaje sin SQL |
| **6** | G1.final prod migrate + smoke | Candidato go-live |
| **7** | Buffer bugs / copy / permisos | **Go o No-go** |

Si el día 3 cierra G3 temprano, se puede adelantar G2.1 el mismo día.

---

## 3. Go-live Mínimo (sí o sí para arrancar)

Línea roja de **operar el mes sin mapa**. Orden de criticidad alineado al plan.

### Debe estar en prod

| # | Ítem | Slice | ¿Bloquea arranque? |
|---|---|---|---|
| 1 | HTTPS app + Supabase prod + migraciones ≥ **0021** (cancel+devolución) | G1 + G3 | **Sí** |
| 2 | Storage comprobantes | G1 | **Sí** |
| 3 | Roles reales operador / conductor / pasajeros | G1 | **Sí** |
| 4 | Pasajero: buscar → seña → QR | ya + G1 | **Sí** |
| 5 | Conductor: recogida → QR → saldo → finalizar | ya + G1 | **Sí** |
| 6 | Operador: confirmar seña + settings | ya + G1 | **Sí** |
| 7 | Operador: **cancelar viaje** + **cola devoluciones** + marcar saldada | **G3** | **Sí** |
| 8 | Runbook: cargar el día (SQL o UI), devolver plata, dueños | G1 | **Sí** |
| 9 | Smoke 3 roles tildado | G1.final | **Sí** |
| 10 | Operador crea **vehículo + viaje** sin SQL | **G2** | **Fuertemente recomendado**; arranque **con SQL/seed documentado** solo los primeros días si G2 no cerró |

### Puede faltar al arrancar (parche humano)

- Mapa / GPS / offline  
- Notificaciones push  
- Alta de rutas nuevas  
- UI de alta de viajes **solo si** hay procedimiento SQL/runbook claro y dueño técnico disponible  
- Transferencia bancaria automática  
- Panel BI  

### Criterio Go / No-go (binario)

**GO** solo si:

1. Un pasajero real completa seña y ve QR en prod.  
2. Conductor puede cerrar el ciclo (o el equipo lo validó en prod con usuarios reales de prueba).  
3. **Si se cancela un viaje de prueba, la cola de devoluciones muestra el monto y se puede marcar saldado.**  
4. Hay forma **documentada y repetible** de tener viajes del día (UI G2 **o** SQL/runbook con dueño, no “ya veremos”).  
5. Nadie depende de adivinar estados a mano en la DB para cancelar o devolver.

**NO-GO** si falla 1, 2, 3 o 5. El punto 4 en modo SQL es **Go condicional** (operación frágil): planear G2 en la misma semana sí o sí.

---

## 4. Estimación consolidada

| Slice | Días | Orden | Prioridad |
|---|---|---|---|
| G1 Entorno + smoke | 1–2 | 1º | P0 bloqueante |
| **G3 Cancel + devoluciones** | **1.5–2.5** | **2º** | **P0 bloqueante (calle)** |
| **G2 Alta vehículo/viaje** | **2–2.5** | **3º** | **P0 (saca el SQL del día a día)** |
| G1.final prod | 0.5–1 | 4º | P0 bloqueante |
| **Total** | **5–7** | | |

---

## 5. Riesgos

| Riesgo | Mitigación |
|---|---|
| Vercel monorepo build roto | Preview día 1 |
| G3 sin viajes que cancelar | Seed staging + snippet SQL en runbook |
| Arrancar solo con SQL y no hacer G2 | Go condicional; G2 no se corta del plan de la semana |
| Devolución mal calculada | Solo 100% si pago seña confirmado; review SQL G3.1 |
| RLS lista viajes operador | Probar con rol operador real |
| Scope creep mapa/notifs | Fuera del Go-live Mínimo |
| Seed en prod | Runbook + checklist |

---

## 6. Self-review del plan

1. **Orden pedido:** G1 → G3 → G2 → G1.final.  
2. **3 bloqueantes** cubiertos; cancel/devoluciones antes que alta UI.  
3. **Migraciones** renumeradas 0020–0022 coherentes con el orden.  
4. **G3** incluye lista read-only para no depender de G2 al cancelar.  
5. **Go-live Mínimo** distingue bloqueante vs “SQL temporal OK”.

---

## 7. Qué no hacer esta semana

- Empezar MapsProvider / tracking  
- Redesign de marca  
- Multi-ruta  
- Automatizar Mercado Pago / transferencias  
- Reescribir flujos ya verdes (QR, seña, no-show)  
- Invertir el orden otra vez (G2 antes que G3) sin decisión explícita nueva  

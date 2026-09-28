# Cupones de descuento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir campañas con código (ej. `TUBI1`), cupón guardado en la cuenta del pasajero, 1 cupón fijo por reserva que descuenta el saldo al subir sin tocar la seña.

**Architecture:** Tablas `cupon_campania` + `cupon_usuario` + columnas en `reserva`; RPCs `security definer` para canje y mutaciones de estado; domain puro para saldo/errores; application + adapters Supabase; UI pasajero (mis cupones + checkout) y operador (campañas). Spec: `docs/superpowers/specs/2026-09-28-cupones-descuento-design.md`.

**Tech Stack:** PostgreSQL/Supabase migrations + RLS, Next.js app router, TypeScript domain/application/adapters, bun test (`node:test`), Zod.

**Commits:** El agente prepara el stage y el mensaje; el humano corre `git commit -S` (GPG obligatorio). Nunca `git commit` sin `-S`.

---

## File map

| Path | Responsibility |
|------|----------------|
| `supabase/migrations/0031_cupones.sql` | Enum, tablas, RLS, helper liberar, seed opcional off |
| `supabase/migrations/0032_cupones_rpcs.sql` | `canjear_cupon`, extend `crear_reserva`, cancel/saldo/no_show/viaje |
| `apps/web/src/domain/cupones/*` | Tipos, errores, normalize código, compute saldo con descuento |
| `apps/web/src/domain/pagos/saldo.ts` | Extender `computeSaldo` con descuento |
| `apps/web/src/domain/reservas/*` | `descuentoMonto`, `cuponUsuarioId` en types; port create con cupón |
| `apps/web/src/adapters/supabase/cupones-repository.ts` | Canje, list, operador campañas |
| `apps/web/src/adapters/supabase/reservas-repository.ts` | Pasar `p_cupon_usuario_id` |
| `apps/web/src/application/cupones/*` | Service + server actions pasajero/operador |
| `apps/web/src/application/reservas/*` | `crear(..., cuponUsuarioId?)` |
| `apps/web/src/lib/supabase/types.ts` | Types DB generados o manual stub |
| `apps/web/src/app/pasajero/cupones/*` | Mis cupones + canje |
| `apps/web/src/components/pasajero/*` | Selector cupón en reserve panel |
| `apps/web/src/app/operador/cupones/*` | List/create campañas |
| `apps/web/src/domain/settings/settings.ts` | Opcional `cupones.enabled` |

---

### Task 1: Domain — saldo con descuento + errores de cupón

**Files:**
- Modify: `apps/web/src/domain/pagos/saldo.ts`
- Create: `apps/web/src/domain/cupones/types.ts`
- Create: `apps/web/src/domain/cupones/errors.ts`
- Create: `apps/web/src/domain/cupones/code.ts`
- Create: `apps/web/src/domain/cupones/index.ts`
- Test: `apps/web/src/domain/pagos/saldo.test.ts`
- Test: `apps/web/src/domain/cupones/code.test.ts`
- Test: `apps/web/src/domain/cupones/errors.test.ts`

- [x] **Step 1: Write failing tests for `computeSaldo`**

```ts
// apps/web/src/domain/pagos/saldo.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeSaldo } from "./saldo";

describe("computeSaldo", () => {
  it("precio - sena without discount", () => {
    assert.equal(computeSaldo(25000, 5000), 20000);
  });

  it("subtracts descuento and floors at 0", () => {
    assert.equal(computeSaldo(25000, 5000, 5000), 15000);
    assert.equal(computeSaldo(25000, 5000, 30000), 0);
  });

  it("treats missing descuento as 0", () => {
    assert.equal(computeSaldo(25000, 5000, undefined), 20000);
  });
});
```

- [x] **Step 2: Run test — expect FAIL (arity / flooring)**

```bash
cd apps/web && bun test src/domain/pagos/saldo.test.ts
```

Expected: FAIL (function does not accept third arg or no floor).

- [x] **Step 3: Implement `computeSaldo`**

```ts
/** RN-02 — balance due at boarding (pure). Descuento de cupón no toca la seña. */
export function computeSaldo(
  precioViaje: number,
  montoSena: number,
  descuentoMonto: number = 0,
): number {
  const d = Number.isFinite(descuentoMonto) ? Math.max(0, descuentoMonto) : 0;
  return Math.max(0, precioViaje - montoSena - d);
}
```

- [x] **Step 4: Write cupón code + error tests and implement**

```ts
// apps/web/src/domain/cupones/code.ts
export function normalizeCuponCodigo(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
```

```ts
// apps/web/src/domain/cupones/types.ts
export type EstadoCuponUsuario =
  | "disponible"
  | "reservado"
  | "usado"
  | "vencido"
  | "anulado";

export type CuponUsuario = {
  id: string;
  campaniaId: string;
  codigoCampania: string;
  estado: EstadoCuponUsuario;
  montoDescuento: number;
  venceEn: string;
  reservaId: string | null;
  canjeadoEn: string;
};

export type CuponCampania = {
  id: string;
  codigo: string;
  montoDescuento: number;
  cuposTotales: number | null;
  cuposUsados: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  validoDiasPostCanje: number;
  maxPorUsuario: number;
  rutaId: string | null;
  activa: boolean;
};
```

```ts
// apps/web/src/domain/cupones/errors.ts
export type CuponErrorCode =
  | "CUPON_NO_ENCONTRADO"
  | "CUPON_INACTIVO"
  | "CUPON_VENCIDO_CAMPANIA"
  | "CUPON_SIN_CUPOS"
  | "CUPON_YA_CANJEADO"
  | "CUPON_NO_DISPONIBLE"
  | "CUPON_RUTA_INVALIDA"
  | "CUPONES_DESHABILITADOS"
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO";

const KNOWN: readonly CuponErrorCode[] = [
  "CUPON_NO_ENCONTRADO",
  "CUPON_INACTIVO",
  "CUPON_VENCIDO_CAMPANIA",
  "CUPON_SIN_CUPOS",
  "CUPON_YA_CANJEADO",
  "CUPON_NO_DISPONIBLE",
  "CUPON_RUTA_INVALIDA",
  "CUPONES_DESHABILITADOS",
  "NO_AUTENTICADO",
  "NO_AUTORIZADO",
];

export function mapCuponErrorMessage(message: string): CuponErrorCode {
  for (const code of KNOWN) {
    if (message.includes(code)) return code;
  }
  return "CUPON_NO_DISPONIBLE";
}

export function cuponErrorUserMessage(code: CuponErrorCode): string {
  switch (code) {
    case "CUPON_NO_ENCONTRADO":
      return "Ese código no es válido.";
    case "CUPON_INACTIVO":
      return "Ese cupón ya no está activo.";
    case "CUPON_VENCIDO_CAMPANIA":
      return "Ese código ya no está vigente.";
    case "CUPON_SIN_CUPOS":
      return "Se agotaron los cupos de este código.";
    case "CUPON_YA_CANJEADO":
      return "Ya canjeaste este beneficio.";
    case "CUPON_NO_DISPONIBLE":
      return "Ese cupón no se puede usar ahora.";
    case "CUPON_RUTA_INVALIDA":
      return "Ese cupón no aplica a este viaje.";
    case "CUPONES_DESHABILITADOS":
      return "Los cupones no están disponibles por ahora.";
    case "NO_AUTENTICADO":
      return "Tenés que iniciar sesión.";
    case "NO_AUTORIZADO":
      return "No tenés permiso para esta acción.";
    default:
      return "No se pudo procesar el cupón.";
  }
}
```

```ts
// apps/web/src/domain/cupones/index.ts
export * from "./types";
export * from "./errors";
export * from "./code";
```

Tests mínimos: `normalizeCuponCodigo(" tubi1 ") === "TUBI1"`; `cuponErrorUserMessage("CUPON_SIN_CUPOS")` match `/agotaron/i`.

- [x] **Step 5: Run all domain tests**

```bash
cd apps/web && bun test src/domain/pagos/saldo.test.ts src/domain/cupones
```

Expected: PASS.

- [x] **Step 6: Stage for commit (human signs)**

```bash
git add apps/web/src/domain/pagos/saldo.ts apps/web/src/domain/pagos/saldo.test.ts \
  apps/web/src/domain/cupones
# human: git commit -S -m "feat(domain): coupon types errors and saldo with discount"
```

---

### Task 2: Migration — schema + RLS

**Files:**
- Create: `supabase/migrations/0031_cupones.sql`

- [x] **Step 1: Write migration**

```sql
-- 0031_cupones.sql
-- Campaign + wallet coupons (design 2026-09-28).

create type public.estado_cupon_usuario as enum (
  'disponible',
  'reservado',
  'usado',
  'vencido',
  'anulado'
);

create table public.cupon_campania (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  monto_descuento numeric not null check (monto_descuento > 0),
  cupos_totales int null check (cupos_totales is null or cupos_totales > 0),
  cupos_usados int not null default 0 check (cupos_usados >= 0),
  vigencia_desde timestamptz not null,
  vigencia_hasta timestamptz not null,
  valido_dias_post_canje int not null default 14 check (valido_dias_post_canje > 0),
  max_por_usuario int not null default 1 check (max_por_usuario > 0),
  ruta_id uuid null references public.ruta (id),
  activa boolean not null default true,
  creada_por uuid null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cupon_campania_vigencia_chk check (vigencia_hasta > vigencia_desde),
  constraint cupon_campania_cupos_chk check (
    cupos_totales is null or cupos_usados <= cupos_totales
  )
);

-- Unique case-insensitive code
create unique index cupon_campania_codigo_uidx
  on public.cupon_campania (upper(trim(codigo)));

create table public.cupon_usuario (
  id uuid primary key default gen_random_uuid(),
  campania_id uuid not null references public.cupon_campania (id),
  pasajero_id uuid not null references public.profiles (id),
  estado public.estado_cupon_usuario not null default 'disponible',
  monto_descuento numeric not null check (monto_descuento > 0),
  reserva_id uuid null references public.reserva (id),
  canjeado_en timestamptz not null default now(),
  vence_en timestamptz not null,
  usado_en timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cupon_usuario_pasajero_idx on public.cupon_usuario (pasajero_id, estado);
create index cupon_usuario_reserva_idx on public.cupon_usuario (reserva_id)
  where reserva_id is not null;

-- At most one "live" coupon per (campania, pasajero) in disponible|reservado|usado
create unique index cupon_usuario_campania_pasajero_live_uidx
  on public.cupon_usuario (campania_id, pasajero_id)
  where estado in ('disponible', 'reservado', 'usado');

alter table public.reserva
  add column if not exists cupon_usuario_id uuid null
    references public.cupon_usuario (id),
  add column if not exists descuento_monto numeric not null default 0
    check (descuento_monto >= 0);

create unique index reserva_cupon_usuario_uidx
  on public.reserva (cupon_usuario_id)
  where cupon_usuario_id is not null;

-- Feature flag
insert into public.settings (clave, valor, tipo, descripcion)
values (
  'cupones.enabled',
  'true',
  'boolean',
  'Kill-switch de canje y aplicación de cupones'
)
on conflict (clave) do nothing;

alter table public.cupon_campania enable row level security;
alter table public.cupon_usuario enable row level security;

-- Campañas: lectura autenticada (para mostrar código en UI); escritura operador vía RPC
create policy cupon_campania_select_authenticated
  on public.cupon_campania for select to authenticated
  using (true);

create policy cupon_usuario_select_own
  on public.cupon_usuario for select to authenticated
  using (
    pasajero_id = (select auth.uid())
    or (select public.is_operador())
  );

-- No direct insert/update from clients; RPCs only
revoke all on table public.cupon_campania from public;
revoke all on table public.cupon_usuario from public;
grant select on table public.cupon_campania to authenticated;
grant select on table public.cupon_usuario to authenticated;

-- Helper: liberar cupón de una reserva (SECURITY DEFINER callers)
create or replace function public.cupon_liberar_si_reservado(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.cupon_usuario%rowtype;
begin
  select * into v_c
  from public.cupon_usuario
  where reserva_id = p_reserva_id
    and estado = 'reservado'
  for update;

  if not found then
    return;
  end if;

  if v_c.vence_en < now() then
    update public.cupon_usuario
    set estado = 'vencido', reserva_id = null, updated_at = now()
    where id = v_c.id;
  else
    update public.cupon_usuario
    set estado = 'disponible', reserva_id = null, updated_at = now()
    where id = v_c.id;
  end if;

  update public.reserva
  set cupon_usuario_id = null, descuento_monto = 0, updated_at = now()
  where id = p_reserva_id
    and cupon_usuario_id = v_c.id;
end;
$$;

create or replace function public.cupon_marcar_usado(p_reserva_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cupon_usuario
  set estado = 'usado', usado_en = now(), updated_at = now()
  where reserva_id = p_reserva_id
    and estado = 'reservado';
end;
$$;

create or replace function public.cupon_expire_disponibles(p_pasajero_id uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.cupon_usuario
  set estado = 'vencido', updated_at = now()
  where estado = 'disponible'
    and vence_en < now()
    and (p_pasajero_id is null or pasajero_id = p_pasajero_id);
  get diagnostics n = row_count;
  return n;
end;
$$;
```

- [x] **Step 2: Apply locally**

```bash
npx supabase db reset
# or: npx supabase migration up
```

Expected: migrations apply without error. Verify:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\d cupon_campania" -c "\d cupon_usuario" -c "select clave from settings where clave = 'cupones.enabled';"
```

- [x] **Step 3: Stage**

```bash
git add supabase/migrations/0031_cupones.sql
# human: git commit -S -m "feat(supabase): coupon campaign and wallet schema"
```

---

### Task 3: RPC `canjear_cupon` + seed campaña demo

**Files:**
- Create: `supabase/migrations/0032_cupones_canjear.sql`

- [x] **Step 1: Write `canjear_cupon`**

```sql
-- 0032_cupones_canjear.sql

create or replace function public.canjear_cupon(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_enabled text;
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
  v_camp public.cupon_campania%rowtype;
  v_count int;
  v_id uuid;
  v_vence timestamptz;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'pasajero' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select (valor #>> '{}') into v_enabled
  from public.settings where clave = 'cupones.enabled';
  if v_enabled is not null and lower(v_enabled) in ('false', '0', 'no') then
    raise exception 'CUPONES_DESHABILITADOS' using errcode = 'P0001';
  end if;

  if v_codigo = '' then
    raise exception 'CUPON_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  perform public.cupon_expire_disponibles(v_uid);

  select * into v_camp
  from public.cupon_campania
  where upper(trim(codigo)) = v_codigo
  for update;

  if not found then
    raise exception 'CUPON_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if not v_camp.activa then
    raise exception 'CUPON_INACTIVO' using errcode = 'P0001';
  end if;

  if now() < v_camp.vigencia_desde or now() > v_camp.vigencia_hasta then
    raise exception 'CUPON_VENCIDO_CAMPANIA' using errcode = 'P0001';
  end if;

  if v_camp.cupos_totales is not null
     and v_camp.cupos_usados >= v_camp.cupos_totales then
    raise exception 'CUPON_SIN_CUPOS' using errcode = 'P0001';
  end if;

  select count(*)::int into v_count
  from public.cupon_usuario
  where campania_id = v_camp.id
    and pasajero_id = v_uid
    and estado in ('disponible', 'reservado', 'usado');

  if v_count >= v_camp.max_por_usuario then
    raise exception 'CUPON_YA_CANJEADO' using errcode = 'P0001';
  end if;

  v_vence := now() + make_interval(days => v_camp.valido_dias_post_canje);

  insert into public.cupon_usuario (
    campania_id, pasajero_id, estado, monto_descuento, vence_en
  ) values (
    v_camp.id, v_uid, 'disponible', v_camp.monto_descuento, v_vence
  )
  returning id into v_id;

  update public.cupon_campania
  set cupos_usados = cupos_usados + 1, updated_at = now()
  where id = v_camp.id;

  return jsonb_build_object(
    'ok', true,
    'cupon_usuario_id', v_id,
    'monto_descuento', v_camp.monto_descuento,
    'vence_en', v_vence,
    'codigo', v_camp.codigo
  );
end;
$$;

revoke all on function public.canjear_cupon(text) from public;
grant execute on function public.canjear_cupon(text) to authenticated;

-- Operador: crear campaña
create or replace function public.crear_cupon_campania(
  p_codigo text,
  p_monto_descuento numeric,
  p_cupos_totales int default null,
  p_vigencia_desde timestamptz default now(),
  p_vigencia_hasta timestamptz default (now() + interval '30 days'),
  p_valido_dias_post_canje int default 14,
  p_max_por_usuario int default 1,
  p_ruta_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if not (select public.is_operador()) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;
  if v_codigo = '' or p_monto_descuento is null or p_monto_descuento <= 0 then
    raise exception 'CUPON_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  insert into public.cupon_campania (
    codigo, monto_descuento, cupos_totales,
    vigencia_desde, vigencia_hasta, valido_dias_post_canje,
    max_por_usuario, ruta_id, creada_por
  ) values (
    v_codigo, p_monto_descuento, p_cupos_totales,
    p_vigencia_desde, p_vigencia_hasta, p_valido_dias_post_canje,
    coalesce(p_max_por_usuario, 1), p_ruta_id, v_uid
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'codigo', v_codigo);
end;
$$;

revoke all on function public.crear_cupon_campania(
  text, numeric, int, timestamptz, timestamptz, int, int, uuid
) from public;
grant execute on function public.crear_cupon_campania(
  text, numeric, int, timestamptz, timestamptz, int, int, uuid
) to authenticated;

create or replace function public.set_cupon_campania_activa(
  p_campania_id uuid,
  p_activa boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if not (select public.is_operador()) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  update public.cupon_campania
  set activa = p_activa, updated_at = now()
  where id = p_campania_id;

  if not found then
    raise exception 'CUPON_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  return jsonb_build_object('ok', true, 'id', p_campania_id, 'activa', p_activa);
end;
$$;

revoke all on function public.set_cupon_campania_activa(uuid, boolean) from public;
grant execute on function public.set_cupon_campania_activa(uuid, boolean) to authenticated;

-- Seed local TUBI1 (idempotent) — 15 cupos, 14 días post-canje, cualquier ruta
insert into public.cupon_campania (
  id, codigo, monto_descuento, cupos_totales, cupos_usados,
  vigencia_desde, vigencia_hasta, valido_dias_post_canje, max_por_usuario, activa
) values (
  'cccccccc-cccc-dddd-eeee-000000000001',
  'TUBI1',
  5000,
  15,
  0,
  now() - interval '1 day',
  now() + interval '60 days',
  14,
  1,
  true
)
on conflict (id) do nothing;
```

Note: `on conflict (id)` requires the fixed id insert; if unique on codigo already exists from manual insert, use:

```sql
-- fallback if id conflict path not enough:
-- insert ... where not exists (select 1 from cupon_campania where upper(codigo) = 'TUBI1');
```

Prefer:

```sql
insert into public.cupon_campania (...)
select ...
where not exists (
  select 1 from public.cupon_campania where upper(trim(codigo)) = 'TUBI1'
);
```

- [x] **Step 2: Apply and smoke canje as pasajero** (optional SQL with `set_config` jwt like seña flow)

- [x] **Step 3: Stage**

```bash
git add supabase/migrations/0032_cupones_canjear.sql
# human: git commit -S -m "feat(supabase): canjear_cupon and campaign admin RPCs"
```

---

### Task 4: Extend `crear_reserva` with optional coupon

**Files:**
- Create: `supabase/migrations/0033_cupones_crear_reserva.sql`

- [x] **Step 1: Drop old signature and recreate with `p_cupon_usuario_id`**

Read current full body from `0028_reserva_recogida.sql` and produce a new `create or replace` that:

1. Drops  
   `drop function if exists public.crear_reserva(uuid, text, numeric, numeric, text);`
2. Adds param `p_cupon_usuario_id uuid default null`.
3. After capacity/sena/politica/recogida validation, **before** insert reserva:

```sql
  v_descuento numeric := 0;
  v_cupon public.cupon_usuario%rowtype;
  v_camp public.cupon_campania%rowtype;
  -- ...
  if p_cupon_usuario_id is not null then
    -- feature flag same as canjear
    select * into v_cupon
    from public.cupon_usuario
    where id = p_cupon_usuario_id
    for update;

    if not found then
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;
    if v_cupon.pasajero_id is distinct from v_uid then
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;
    if v_cupon.estado = 'disponible' and v_cupon.vence_en < now() then
      update public.cupon_usuario set estado = 'vencido', updated_at = now()
      where id = v_cupon.id;
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;
    if v_cupon.estado <> 'disponible' then
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;

    select * into v_camp from public.cupon_campania where id = v_cupon.campania_id;
    if not found or not v_camp.activa then
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;
    if v_camp.ruta_id is not null and v_camp.ruta_id is distinct from v_viaje.ruta_id then
      raise exception 'CUPON_RUTA_INVALIDA' using errcode = 'P0001';
    end if;

    v_descuento := v_cupon.monto_descuento;
  end if;
```

4. Insert reserva includes `cupon_usuario_id, descuento_monto`.
5. After insert, if coupon:

```sql
  update public.cupon_usuario
  set estado = 'reservado', reserva_id = v_row.id, updated_at = now()
  where id = p_cupon_usuario_id;
```

6. Grant execute on new 6-arg signature.

- [x] **Step 2: Apply migration; verify `crear_reserva` without cupón still works** (regression smoke).

- [x] **Step 3: Stage**

```bash
git add supabase/migrations/0033_cupones_crear_reserva.sql
# human: git commit -S -m "feat(supabase): attach coupon on crear_reserva"
```

---

### Task 5: Liberar / usar cupón en cancel, no-show, saldo, cancel viaje

**Files:**
- Create: `supabase/migrations/0034_cupones_lifecycle.sql`

- [x] **Step 1: Patch each RPC** (read current functions from migrations `0015`, `0016`, `0013`, `0020` and `create or replace` full bodies with these hooks):

**`cancelar_reserva`:** after marking reserva cancelada, call  
`perform public.cupon_liberar_si_reservado(p_reserva_id);`

**`cancelar_viaje`:** for each affected reserva that gets cancelled, call liberar (loop or after bulk update).

**`marcar_no_show`:** after no_show,  
`perform public.cupon_marcar_usado(p_reserva_id);`

**`registrar_saldo_y_abordar`:** replace monto calc:

```sql
  v_descuento := coalesce(v_reserva.descuento_monto, 0);
  v_monto := v_viaje.precio - v_reserva.monto_sena - v_descuento;
  if v_monto < 0 then
    v_monto := 0;
  end if;
```

If `v_monto = 0`: **do not insert** `pago` tipo saldo; still set reserva `abordada`; set `pago_id` null in jsonb.  
If `v_monto > 0`: insert pago as today.  
Always: `perform public.cupon_marcar_usado(v_reserva.id);`

- [x] **Step 2: Apply and manual SQL smoke** (optional).

- [x] **Step 3: Stage**

```bash
git add supabase/migrations/0034_cupones_lifecycle.sql
# human: git commit -S -m "feat(supabase): coupon release and consume on booking lifecycle"
```

---

### Task 6: Types + reservas domain/ports/adapter

**Files:**
- Modify: `apps/web/src/domain/reservas/types.ts` — add `descuentoMonto: number`, `cuponUsuarioId: string | null` on `Reserva`; optional on list/summary `descuentoMonto?`, `saldoEstimado?`
- Modify: `apps/web/src/domain/reservas/ports.ts` — `createForPassenger(viajeId, recogida?, cuponUsuarioId?: string | null)`
- Modify: `apps/web/src/adapters/supabase/reservas-repository.ts` — map new columns; pass `p_cupon_usuario_id`
- Modify: `apps/web/src/application/reservas/reservas-service.ts` + `actions.ts` — accept cupón; map `CUPON_*` errors
- Modify: `apps/web/src/lib/supabase/types.ts` — Functions + Tables stubs for cupones and new `crear_reserva` args; `reserva` columns

- [x] **Step 1: Update `mapReserva` and RPC call**

```ts
// createForPassenger
const { data, error } = await client.rpc("crear_reserva", {
  p_viaje_id: viajeId,
  p_recogida_label: recogida?.label ?? null,
  p_recogida_lat: recogida?.lat ?? null,
  p_recogida_lng: recogida?.lng ?? null,
  p_recogida_place_id: recogida?.placeId ?? null,
  p_cupon_usuario_id: cuponUsuarioId ?? null,
});
```

Map `descuento_monto` → `descuentoMonto`, `cupon_usuario_id` → `cuponUsuarioId`.

- [x] **Step 2: `createReservaAction(viajeId, recogida?, cuponUsuarioId?)`** map errors via `mapCuponErrorMessage` / `cuponErrorUserMessage`.

- [x] **Step 3: `bun test` + `npm run type-check --workspace=web`**

- [x] **Step 4: Stage**

```bash
git add apps/web/src/domain/reservas apps/web/src/adapters/supabase/reservas-repository.ts \
  apps/web/src/application/reservas apps/web/src/lib/supabase/types.ts
# human: git commit -S -m "feat(web): wire coupon id through crear reserva stack"
```

---

### Task 7: Cupones adapter + application (pasajero)

**Files:**
- Create: `apps/web/src/domain/cupones/ports.ts`
- Create: `apps/web/src/adapters/supabase/cupones-repository.ts`
- Create: `apps/web/src/application/cupones/cupones-service.ts`
- Create: `apps/web/src/application/cupones/actions.ts`
- Create: `apps/web/src/application/cupones/index.ts`

- [x] **Step 1: Port**

```ts
// ports.ts
import type { CuponCampania, CuponUsuario } from "./types";

export type CuponesRepository = {
  canjear(codigo: string): Promise<CuponUsuario>;
  listMine(pasajeroId: string): Promise<CuponUsuario[]>;
  listDisponiblesForRuta(
    pasajeroId: string,
    rutaId: string | null,
  ): Promise<CuponUsuario[]>;
  listCampanias(): Promise<CuponCampania[]>;
  crearCampania(input: {
    codigo: string;
    montoDescuento: number;
    cuposTotales: number | null;
    vigenciaDesde: string;
    vigenciaHasta: string;
    validoDiasPostCanje: number;
    maxPorUsuario: number;
    rutaId: string | null;
  }): Promise<{ id: string; codigo: string }>;
  setCampaniaActiva(id: string, activa: boolean): Promise<void>;
};
```

- [x] **Step 2: Repository** — `rpc('canjear_cupon')`, select `cupon_usuario` join `cupon_campania(codigo, ruta_id)`, expire lazy via select filter `estado = disponible and vence_en >= now()` plus optional rpc expire; operador list/create/set.

- [x] **Step 3: Service + actions**

```ts
// actions.ts (pasajero)
"use server";
export async function canjearCuponAction(codigo: string): Promise<{ error: string } | { ok: true }>
export async // list is RSC via service, not necessarily action
```

`requireProfile(["pasajero"])` for canje; revalidate `/pasajero/cupones`.

- [x] **Step 4: type-check**

- [x] **Step 5: Stage**

```bash
git add apps/web/src/domain/cupones apps/web/src/adapters/supabase/cupones-repository.ts \
  apps/web/src/application/cupones
# human: git commit -S -m "feat(web): cupones application and supabase adapter"
```

---

### Task 8: UI pasajero — Mis cupones + canje

**Files:**
- Create: `apps/web/src/app/pasajero/cupones/page.tsx`
- Create: `apps/web/src/components/pasajero/canjear-cupon-form.tsx`
- Modify: `apps/web/src/app/pasajero/page.tsx` or profile nav — link “Mis cupones”
- Modify: TabBar / header if there is a natural entry (prefer link from home pasajero card area)

- [x] **Step 1: Page RSC** loads `listMine`, shows disponibles first with `formatArs(monto)` + `vence_en` via `formatFechaHoraAr`.

- [x] **Step 2: Client form** input código → `canjearCuponAction` → refresh / toast error.

- [x] **Step 3: Manual check** login pasajero → canjear `TUBI1` → aparece en lista.

- [x] **Step 4: Stage**

```bash
git add apps/web/src/app/pasajero/cupones apps/web/src/components/pasajero/canjear-cupon-form.tsx \
  apps/web/src/app/pasajero/page.tsx
# human: git commit -S -m "feat(web): passenger coupons wallet and redeem UI"
```

---

### Task 9: UI pasajero — aplicar cupón al reservar

**Files:**
- Modify: `apps/web/src/components/pasajero/reserve-panel.tsx`
- Modify: `apps/web/src/components/pasajero/reserve-button.tsx`
- Modify: `apps/web/src/app/pasajero/viajes/[id]/page.tsx` — load disponibles for `rutaId`, pass `montoSena` from settings or viaje context, show breakdown
- Modify: reservation detail pages to show `descuentoMonto` + `computeSaldo(...)`

- [x] **Step 1: ReservePanel props**

```ts
type Props = {
  // existing...
  montoSena: number;
  cupones: Array<{ id: string; label: string; montoDescuento: number }>;
};
```

State `cuponId: string | ""`. Summary:

```
Precio: formatArs(precio)
Seña: formatArs(montoSena)
Descuento: formatArs(selected?.monto ?? 0)
Saldo al subir: formatArs(computeSaldo(precio, montoSena, selected?.monto ?? 0))
```

Copy: “La seña no cambia; el descuento se descuenta del saldo al subir.”

- [x] **Step 2: ReserveButton** passes `cuponUsuarioId` to `createReservaAction`.

- [x] **Step 3: Smoke** reservar con cupón → DB `descuento_monto=5000`, cupón `reservado`.

- [x] **Step 4: Stage**

```bash
git add apps/web/src/components/pasajero/reserve-panel.tsx \
  apps/web/src/components/pasajero/reserve-button.tsx \
  apps/web/src/app/pasajero/viajes
# human: git commit -S -m "feat(web): apply wallet coupon on trip reserve checkout"
```

---

### Task 10: Conductor saldo UI uses discounted amount

**Files:**
- Grep `computeSaldo` / `monto_sena` / precio in `apps/web/src/app/conductor` and `components/conductor`
- Modify any display of saldo to `computeSaldo(precio, sena, descuentoMonto)`
- Ensure repository selects `descuento_monto` on reserva for conductor views

- [x] **Step 1: Find and update** all saldo labels.

- [x] **Step 2: type-check + manual** conductor cobrar shows $15.000 if precio 25k sena 5k desc 5k.

- [x] **Step 3: Stage**

```bash
git add apps/web/src/app/conductor apps/web/src/components/conductor \
  apps/web/src/adapters/supabase/conductor-repository.ts
# human: git commit -S -m "feat(web): show coupon-discounted saldo for driver"
```

---

### Task 11: UI operador — campañas

**Files:**
- Create: `apps/web/src/app/operador/cupones/page.tsx`
- Create: `apps/web/src/components/operador/campania-form.tsx`
- Modify: operador nav / `app/operador` links (settings sibling or home link “Cupones”)
- Create: `apps/web/src/application/operador/cupones-actions.ts` or reuse `application/cupones/actions.ts` with `requireProfile(["operador"])`

- [x] **Step 1: List campañas** codigo, monto, cupos usados/totales, activa, toggle.

- [x] **Step 2: Form create** fields matching `crear_cupon_campania`.

- [x] **Step 3: Smoke** crear `PLAZA` 5000 / 10 cupos.

- [x] **Step 4: Stage**

```bash
git add apps/web/src/app/operador/cupones apps/web/src/components/operador \
  apps/web/src/application
# human: git commit -S -m "feat(web): operator coupon campaign admin UI"
```

---

### Task 12: Settings key + docs status + acceptance

**Files:**
- Modify: `apps/web/src/domain/settings/settings.ts` — document `cupones.enabled`
- Create: `docs/24-cupones-status.md` (short status like other slices)
- Modify: `docs/06-reglas-y-estados.md` — RN-02 extend one line with descuento; optional RN-CUPON pointer to spec

- [x] **Step 1: Acceptance checklist (manual)**

1. Canje `TUBI1` → wallet.  
2. Segundo canje → error ya canjeado.  
3. Reserva con cupón → seña intacta, descuento snapshot.  
4. Cancel reserva → cupón vuelve disponible.  
5. Abordar → saldo descontado, cupón usado.  
6. Sin cupón → flujo idéntico a antes.  
7. `cupones.enabled=false` → canje falla.

- [x] **Step 2: `bun test` + `npm run type-check --workspace=web` + `npm run lint --workspace=web`**

- [x] **Step 3: Stage docs**

```bash
git add docs/24-cupones-status.md docs/06-reglas-y-estados.md \
  apps/web/src/domain/settings/settings.ts
# human: git commit -S -m "docs: cupones status and RN-02 discount note"
```

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| `cupon_campania` / `cupon_usuario` / reserva cols | T2 |
| Canje + cupos al canjear + max por user | T3 |
| Aplicar en crear_reserva | T4 |
| Liberar cancel / usado abordar+no-show | T5 |
| Fórmula saldo + piso 0 + saldo 0 sin pago | T1, T5, T10 |
| Domain errors | T1 |
| Mis cupones + canje UI | T8 |
| Checkout selector + copy seña | T9 |
| Operador campañas | T3 RPC + T11 UI |
| Feature flag | T2 settings + T3 guard |
| Seed TUBI1 | T3 |
| Conductor ve saldo | T10 |
| No % / stacking / seña $0 | out of scope — no tasks |

**Saldo $0 decision (locked in plan):** no insert `pago` tipo `saldo` when monto is 0; still `abordada` + cupón `usado`.

---

## Execution handoff

Plan guardado en `docs/superpowers/plans/2026-09-28-cupones-descuento.md`.

**Opciones de ejecución:**

1. **Subagent-Driven (recomendado)** — un subagente por task, review entre tasks  
2. **Inline** — ejecutar en esta sesión con checkpoints  

¿Cuál preferís?

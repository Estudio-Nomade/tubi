# Slice 2 — Flujo Principal de Reservas (Pasajero)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** El pasajero autenticado busca un viaje, ve resultados y detalle, y crea una reserva en `pendiente_sena` con `qr_token` opaco y snapshots de settings. Sin seña enviada, sin confirmación del operador, sin pantalla QR.

**Architecture:** Server-first sobre lo ya armado en Slice 0.5/1. Capas `domain → application → adapters`. Lectura de viajes y creación de reserva vía repos Supabase + Server Actions. UI fiel a Pencil “Ruta de la siesta”. Auth: `requireProfile` + `SessionProvider` en layouts de rol. Settings: `SettingsService` / `SettingsProvider` existentes (sin hardcode de negocio).

**Tech Stack:** Next.js 16 App Router · React 19 · `@supabase/ssr` · Zod · Tailwind 4 · design components existentes · Supabase migrations locales.

**Commits:** el agente **no** corre `git commit` (GPG `-S`). Al cerrar cada task, dejar el comando `git commit -S -m "…"` para el usuario.

**Regla UI:** antes de cada pantalla, validar frame Pencil (`design-artifacts/tubi-wireframes.pen` vía MCP) y/o preview PNG en `design-artifacts/previews/`. No inventar layout ni copy.

---

## División del slice

| Sub-slice | Nombre | Entrega | Demo al cerrar |
|---|---|---|---|
| **2A** | Catálogo de viajes | Seed + RLS lectura + buscar/resultados/detalle | “Busco Tandil→BsAs y veo el viaje con conductor y paradas” |
| **2B** | Crear reserva | RPC/capacidad + checkout mínimo + home con reserva | “Reservo y queda `pendiente_sena` con `qr_token`” |

Ejecutar **2A completo y validado** antes de tocar 2B.

---

## Qué entra / qué no

### ✅ Entra (2A + 2B)

- Seed demo: ruta, paradas, vehículo, conductor, viajes `programado`.
- Precio demo en settings + snapshot en `viaje.precio`.
- RLS de lectura de catálogo (`ruta`, `parada`, `viaje`, `vehiculo`) y perfiles de conductor (sin exponer DNI en queries).
- Domain puro: tipos viaje/reserva, capacidad (`RN-CAPACIDAD`), snapshots seña/política, generación token (o en RPC).
- Application + adapters + Server Action `createReserva`.
- UI pasajero Pencil: **P3 Búsqueda**, **P4 Resultados**, **P5 Detalle**, home vacío con CTA real (**P2**).
- En 2B: crear reserva → estado `pendiente_sena` + `qr_token` + `monto_sena` + `politica_cancelacion` (snapshots).
- Confirmación UI mínima post-crear (toast o pantalla corta “Reserva creada — pendiente de seña”), **no** P8 QR ni P11 seña en revisión con pago.

### ❌ No entra (siguiente slice o después)

| Ítem | Cuándo |
|---|---|
| `POST /pagos/seña`, comprobante, Storage | Slice 3 (seña) |
| Operador confirma seña → `confirmada` | Slice 3 |
| Pantalla QR / `QRPass` (P8) | Slice 3 (tras confirmada) |
| P11 Seña en revisión con pago | Slice 3 |
| Cancelación + devolución RN-03 | post |
| Conductor, escaneo, saldo, GPS | slices posteriores |
| CRUD operador de viajes/rutas | operador |
| Picker de `asiento_num` | opcional post (MVP: `null`, solo contador) |
| Types generados `supabase gen types` | cuando haya proyecto linkeado |

### Decisiones cerradas

| Tema | Decisión |
|---|---|
| Checkout 2B | **Crear reserva al confirmar CTA “Reservar”** en detalle (o pantalla resumen 1 paso). No wizard de transferencia todavía. |
| `qr_token` | Se genera al crear la reserva (DB/RPC). **No se muestra** QR en UI en este slice. |
| Capacidad | RPC `crear_reserva` atómica (count + insert). |
| Asiento | `asiento_num = null`. |
| Precio listado | `viaje.precio` (snapshot al seed/crear viaje). |
| Seña en fila reserva | Snapshot de `reserva.sena_monto` al crear; se usa en Slice 3. |
| Instrucciones CBU/alias | **No** en 2A/2B (van con pago seña). |
| Session / settings | Reusar `SessionProvider`, `requireProfile`, `createClient` server, `createSettingsService`. |

---

## Base ya existente (no rehacer)

| Pieza | Path |
|---|---|
| Browser/server Supabase | `apps/web/src/lib/supabase/{client,server,middleware}.ts` |
| Types stub | `apps/web/src/lib/supabase/types.ts` |
| Settings domain/app/adapter | `domain/settings`, `application/settings`, `adapters/supabase/settings-repository.ts` |
| `SettingsProvider` | `components/settings-provider.tsx` (layout root) |
| Auth + `SessionProvider` | `components/auth/session-provider.tsx`, `hooks/use-current-profile.ts` |
| `requireProfile` | `lib/auth/require-profile.ts` |
| Design | `AppHeader`, `Field`, `BtnPrimary/Secondary`, `ProgressDots`, `TabBar`, `EmptyHint` |
| Layout pasajero | `app/pasajero/layout.tsx` (ya monta `SessionProvider`) |
| Schema tablas | `supabase/migrations/0001_init.sql` (sin policies de negocio) |
| Profiles RLS | `0005_profiles_auth.sql` |

## Pencil / previews

| Frame | Preview | Ruta |
|---|---|---|
| P3 Búsqueda | `02-pasajero-busqueda.png` | `/pasajero/buscar` |
| P4 Resultados | `03-pasajero-resultados.png` | `/pasajero/resultados` |
| P5 Detalle | `04-pasajero-detalle.png` | `/pasajero/viajes/[id]` |
| P2 Home empty | `16b-pasajero-home-empty.png` | `/pasajero` |
| P7 Home con reserva | `16-pasajero-home.png` | `/pasajero` (2B, card mínima) |

**MCP Pencil (cada task de UI):**

```
get_editor_state / batch_get del frame
GetVariables → tokens
comparar con implementación (no inventar)
```

Si MCP no está disponible: previews PNG + `docs/superpowers/specs/2026-08-19-tubi-ui-ruta-siesta-design.md` §4–§7.

**Tokens (recordatorio):** bg `#F7F3EC` · surface `#FFFCF7` · accent `#C45C26` · ink `#1C1917` · muted `#78716C` · Fraunces títulos · DM Sans UI · padding H 20 · primary h 52.

---

## Mapa de archivos (resultado final 2A+2B)

```
supabase/migrations/
  0006_slice2_catalog_rls.sql       # 2A: SELECT policies + grants catálogo
  0007_slice2_seed_demo.sql         # 2A: settings precio + demo data
  0008_slice2_crear_reserva.sql     # 2B: RLS reserva + RPC crear_reserva

apps/web/src/
  lib/
    format.ts                       # ARS + fechas es-AR
    supabase/types.ts               # ampliar stub
  domain/
    viajes/
      types.ts
      ports.ts
      schemas.ts                    # searchViajesSchema
      index.ts
    reservas/
      types.ts
      capacity.ts                   # RN-CAPACIDAD puro
      snapshots.ts                  # monto_sena + politica desde settings map
      ports.ts
      index.ts
  application/
    viajes/
      viajes-service.ts
      index.ts
    reservas/
      reservas-service.ts
      actions.ts                    # createReservaAction
      index.ts
  adapters/supabase/
    viajes-repository.ts
    reservas-repository.ts
  components/design/
    trip-card.tsx
    status-pill.tsx
    info-row.tsx
    index.ts                        # + exports
  components/pasajero/
    search-form.tsx
  app/pasajero/
    page.tsx                        # home P2/P7 mínimo
    buscar/page.tsx
    resultados/page.tsx
    viajes/[id]/page.tsx
```

---

# Parte A — Slice 2A: Catálogo (Búsqueda → Resultados → Detalle)

## Task A0 — Inventario Pencil (solo lectura)

**Files:** none

- [ ] **A0.1** Abrir previews y/o Pencil MCP: P3, P4, P5, P2.
- [ ] **A0.2** Anotar copy y bloques (título, CTA, qué datos muestra cada card/row).
- [ ] **A0.3** No code.

---

## Task A1 — Types stub: catálogo

**Files:**
- Modify: `apps/web/src/lib/supabase/types.ts`

- [ ] **A1.1** Agregar tipos de enum y tablas `ruta`, `parada`, `vehiculo`, `viaje` (Row/Insert/Update) alineados a `0001_init.sql`.

```ts
export type EstadoViaje =
  | "programado" | "recogida" | "en_curso" | "completado" | "cancelado";
export type TipoParada = "origen" | "intermedio" | "destino";
```

- [ ] **A1.2** Run: `npm run type-check --workspace=web` → pass.
- [ ] **A1.3** Commit usuario:

```bash
git add apps/web/src/lib/supabase/types.ts
git commit -S -m "feat(web): add catalog table types to supabase stub"
```

---

## Task A2 — Migración RLS lectura catálogo

**Files:**
- Create: `supabase/migrations/0006_slice2_catalog_rls.sql`

- [ ] **A2.1** Escribir policies + grants:

```sql
-- SELECT catálogo: cualquier authenticated
grant select on public.ruta, public.parada, public.viaje, public.vehiculo
  to authenticated;

create policy ruta_select_auth on public.ruta
  for select to authenticated using (true);

create policy parada_select_auth on public.parada
  for select to authenticated using (true);

create policy viaje_select_auth on public.viaje
  for select to authenticated using (true);

create policy vehiculo_select_auth on public.vehiculo
  for select to authenticated using (true);

-- Conductores legibles para joins de detalle (sin abrir DNI de pasajeros):
create policy profiles_select_conductores on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.current_rol() = 'operador'
    or rol = 'conductor'
  );
-- Nota: queries de app NUNCA piden columna dni en listados/detalle de viaje.
```

- [ ] **A2.2** Aplicar: `npx supabase db reset` (o migration up) y verificar que un user authenticated puede `select` viajes.
- [ ] **A2.3** Commit:

```bash
git add supabase/migrations/0006_slice2_catalog_rls.sql
git commit -S -m "feat(supabase): RLS select policies for trip catalog"
```

---

## Task A3 — Seed demo

**Files:**
- Create: `supabase/migrations/0007_slice2_seed_demo.sql`
- Modify: `apps/web/src/domain/settings/settings.ts` (solo si hace falta documentar keys; precio ya existe)

- [ ] **A3.1** Upsert precio demo:

```sql
insert into settings (clave, valor, tipo, descripcion) values
  ('tarifa.precio_base_tandil_bsas', '25000', 'number', 'Precio base demo')
on conflict (clave) do update
  set valor = excluded.valor, updated_at = now();
```

- [ ] **A3.2** Seed con UUIDs fijos:

1. `auth.users` + `profiles` conductor demo (`conductor.demo@tubi.local` / `demo-demo-1`) — solo local.
2. `ruta` Tandil → Buenos Aires.
3. `parada` ×4: Tandil (origen), Rauch, Las Flores, Buenos Aires (destino), con `orden` 1–4.
4. `vehiculo` capacidad 4, patente demo.
5. `viaje` ×3 `programado`, `precio = 25000`, salidas en próximos días (timestamptz correctos AR).

Si insert en `auth.users` falla por versión de Supabase: documentar fallback `scripts/seed-demo.mjs` con service role; no bloquear 2A — se puede seedear conductor manual una vez.

- [ ] **A3.3** Verificar:

```sql
select count(*) from ruta;    -- 1
select count(*) from parada;  -- 4
select count(*) from viaje;   -- >= 3
```

- [ ] **A3.4** Commit:

```bash
git add supabase/migrations/0007_slice2_seed_demo.sql
git commit -S -m "feat(supabase): seed demo route stops vehicle and trips"
```

---

## Task A4 — Domain viajes (puro)

**Files:**
- Create: `apps/web/src/domain/viajes/types.ts`
- Create: `apps/web/src/domain/viajes/ports.ts`
- Create: `apps/web/src/domain/viajes/schemas.ts`
- Create: `apps/web/src/domain/viajes/index.ts`
- Create: `apps/web/src/lib/format.ts`

- [ ] **A4.1** Types de aplicación (no DB crudos):

```ts
// types.ts
export type SearchViajesQuery = {
  origen: string;
  destino: string;
  fecha: string;       // YYYY-MM-DD
  horaDesde?: string;  // HH:mm
};

export type ViajeListItem = {
  id: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  precio: number;
  estado: EstadoViaje;
  asientosLibres: number;
  vehiculo: {
    patente: string;
    marca: string;
    modelo: string;
    color: string;
  };
};

export type ViajeDetail = ViajeListItem & {
  etaLlegada: string | null;
  conductor: { id: string; nombre: string; apellido: string };
  paradas: Array<{
    id: string;
    nombre: string;
    ciudad: string;
    orden: number;
    tipo: TipoParada;
  }>;
};
```

- [ ] **A4.2** Port:

```ts
export interface ViajesRepository {
  search(query: SearchViajesQuery): Promise<ViajeListItem[]>;
  findById(id: string): Promise<ViajeDetail | null>;
}
```

- [ ] **A4.3** Zod `searchViajesSchema` (origen, destino, fecha, hora_desde opcional).
- [ ] **A4.4** `formatArs` + `formatFechaHoraAr` en `lib/format.ts`.
- [ ] **A4.5** Typecheck + commit:

```bash
git add apps/web/src/domain/viajes apps/web/src/lib/format.ts
git commit -S -m "feat(domain): viajes types ports and search schema"
```

---

## Task A5 — Adapter + service viajes

**Files:**
- Create: `apps/web/src/adapters/supabase/viajes-repository.ts`
- Create: `apps/web/src/application/viajes/viajes-service.ts`
- Create: `apps/web/src/application/viajes/index.ts`

- [ ] **A5.1** Repository con client inyectado (`createClient` server — no env propio).

`search`:
- join `ruta!inner`, `vehiculo!inner`
- filtro `estado = programado`
- filtro origen/destino en ruta
- rango del día en `fecha_salida` (+ `horaDesde` si viene)
- calcular `asientosLibres`: `capacidad - count(reservas activas)`.  
  En 2A, si aún no hay RLS de `reserva` para count, opciones:
  1. Query count solo si hay policy select (mejor dejar count en 2B y en 2A mostrar `capacidad` como libres), **o**
  2. Agregar en A2 policy `reserva_select_count` limitada.  

  **Decisión:** en 2A mostrar `asientosLibres = capacidad` (o count si la tabla es legible). En 2B, al existir reservas, el repo recalcula con count de estados que ocupan asiento. Documentar en código con comentario breve en inglés.

`findById`:
- mismo join + `profiles` conductor (`nombre`, `apellido` only) + `parada` order by `orden`.

- [ ] **A5.2** Service:

```ts
export function createViajesService(repo: ViajesRepository) {
  return {
    search: (q: SearchViajesQuery) => repo.search(q),
    getById: (id: string) => repo.findById(id),
  };
}
```

- [ ] **A5.3** Typecheck + commit:

```bash
git add apps/web/src/adapters/supabase/viajes-repository.ts apps/web/src/application/viajes
git commit -S -m "feat(web): viajes repository and application service"
```

---

## Task A6 — Design: TripCard, StatusPill, InfoRow

**Pencil first:** componentes reutilizables del `.pen` / preview resultados-detalle.

**Files:**
- Create: `apps/web/src/components/design/trip-card.tsx`
- Create: `apps/web/src/components/design/status-pill.tsx`
- Create: `apps/web/src/components/design/info-row.tsx`
- Modify: `apps/web/src/components/design/index.ts`

- [ ] **A6.1** `TripCard`: props `origen`, `destino`, `horaLabel`, `asientosLabel`, `precioLabel`, `href`. Link full-card. Fraunces ruta · muted meta · precio.
- [ ] **A6.2** `StatusPill`: `variant: "ok" | "pending" | "neutral" | "danger"`.
- [ ] **A6.3** `InfoRow`: icon Lucide + label + value.
- [ ] **A6.4** Export en `index.ts`. Build OK + commit:

```bash
git add apps/web/src/components/design
git commit -S -m "feat(web): TripCard StatusPill InfoRow design components"
```

---

## Task A7 — UI Búsqueda (P3)

**Pencil first:** frame P3.

**Files:**
- Create: `apps/web/src/app/pasajero/buscar/page.tsx`
- Create: `apps/web/src/components/pasajero/search-form.tsx`

- [ ] **A7.1** Page server: `requireProfile` ya cubierto por layout; título “¿A dónde vas?”; `AppHeader`; `TabBar` (reusar).
- [ ] **A7.2** `SearchForm` client: origen/destino (defaults Tandil / Buenos Aires), chips fecha (hoy/mañana/+2), hora opcional, CTA Buscar → `router.push('/pasajero/resultados?…')`.
- [ ] **A7.3** Smoke visual vs preview. Commit:

```bash
git add apps/web/src/app/pasajero/buscar apps/web/src/components/pasajero/search-form.tsx
git commit -S -m "feat(web): passenger search page P3"
```

---

## Task A8 — UI Resultados (P4)

**Files:**
- Create: `apps/web/src/app/pasajero/resultados/page.tsx`

- [ ] **A8.1** Server page: parse `searchParams` con `searchViajesSchema`; wire `createClient` → repo → service → `search`.
- [ ] **A8.2** Lista `TripCard` o `EmptyHint` si vacío. Header con fecha.
- [ ] **A8.3** Smoke: seed → buscar → ≥1 card. Commit:

```bash
git add apps/web/src/app/pasajero/resultados
git commit -S -m "feat(web): passenger trip results page P4"
```

---

## Task A9 — UI Detalle (P5) sin mutación

**Files:**
- Create: `apps/web/src/app/pasajero/viajes/[id]/page.tsx`
- Modify: `apps/web/src/app/pasajero/page.tsx` (CTA Buscar → `/pasajero/buscar`)

- [ ] **A9.1** `getById`; `notFound()` si null.
- [ ] **A9.2** Hero ruta/hora, `StatusPill`, `InfoRow` conductor/vehículo/precio/asientos, timeline paradas.
- [ ] **A9.3** CTA “Reservar” **disabled** con hint “Próximamente” **o** link deshabilitado hasta 2B. (En 2B se activa.)
- [ ] **A9.4** Home: habilitar `BtnPrimary` Link a `/pasajero/buscar` + `EmptyHint` P2.
- [ ] **A9.5** Build + smoke catálogo E2E lectura. Commit:

```bash
git add apps/web/src/app/pasajero
git commit -S -m "feat(web): passenger trip detail and home search CTA"
```

---

## Criterios de Done — Slice 2A

- [ ] `db reset` deja ≥3 viajes demo Tandil→BsAs.
- [ ] Pasajero logueado: `/pasajero/buscar` → resultados con precio y vehículo.
- [ ] Detalle muestra conductor, vehículo, paradas ordenadas.
- [ ] Sin sesión: middleware manda a login.
- [ ] UI alineada a P3/P4/P5 (tokens + estructura Pencil).
- [ ] `type-check` + `build` OK.
- [ ] Domain viajes sin imports de React/Supabase.

**No se pide en 2A:** crear reserva, pago, QR.

---

# Parte B — Slice 2B: Crear reserva (`pendiente_sena` + `qr_token`)

## Task B0 — Types reserva + domain capacidad/snapshots

**Files:**
- Modify: `apps/web/src/lib/supabase/types.ts` (tablas `reserva`, opcional `pago` stub)
- Create: `apps/web/src/domain/reservas/types.ts`
- Create: `apps/web/src/domain/reservas/capacity.ts`
- Create: `apps/web/src/domain/reservas/snapshots.ts`
- Create: `apps/web/src/domain/reservas/ports.ts`
- Create: `apps/web/src/domain/reservas/index.ts`

- [ ] **B0.1** Enums `EstadoReserva` en types stub + tabla `reserva`.
- [ ] **B0.2** Capacity:

```ts
export const RESERVA_ESTADOS_OCUPAN = [
  "pendiente_sena", "confirmada", "verificada", "abordada",
] as const;

export function assertHayCapacidad(capacidad: number, ocupados: number): void {
  if (ocupados >= capacidad) throw new Error("RESERVA_SIN_ASIENTOS");
}
```

- [ ] **B0.3** Snapshots desde map de settings (`SETTING_KEYS`):

```ts
export type PoliticaCancelacionSnapshot = {
  devolucion_24h_pct: number;
  devolucion_12_24h_pct: number;
  devolucion_menos_12h_pct: number;
};

export function readSenaMonto(settings: ReadonlyMap<string, Setting>): number;
export function buildPoliticaCancelacion(settings: ReadonlyMap<string, Setting>): PoliticaCancelacionSnapshot;
```

Valores **solo** desde DB settings; throw si falta key.

- [ ] **B0.4** Port:

```ts
export type Reserva = {
  id: string;
  viajeId: string;
  pasajeroId: string;
  estado: "pendiente_sena" | ...;
  montoSena: number;
  qrToken: string;
  politicaCancelacion: PoliticaCancelacionSnapshot;
  createdAt: string;
};

export interface ReservasRepository {
  createForPassenger(viajeId: string): Promise<Reserva>;
  findByIdForPassenger(id: string, pasajeroId: string): Promise<Reserva | null>;
  findLatestActiveForPassenger(pasajeroId: string): Promise<Reserva | null>;
}
```

- [ ] **B0.5** Typecheck + commit:

```bash
git add apps/web/src/domain/reservas apps/web/src/lib/supabase/types.ts
git commit -S -m "feat(domain): reservas capacity snapshots and ports"
```

---

## Estado al arrancar 2B (2026-08-22)

- 2A cerrado + pulido visual P4/TripCard/P5.
- Migraciones existentes: `0001`…`0008_slice2_seed_demo.sql`. **RPC va en `0009`**, no 0008.
- `SessionProvider` + `useCurrentProfile` + `requireProfile` OK.
- Settings service/provider OK. Types stub ya incluyen `reserva` + `EstadoReserva`.
- **Scope 2B (cerrado):** crear reserva `pendiente_sena` + `qr_token` + home pill. **No P6** (checkout seña/pago → Slice 3). CTA desde P5 Detalle.

## Task B1 — Migración RLS reserva + RPC `crear_reserva`

**Files:**
- Create: `supabase/migrations/0009_slice2_crear_reserva.sql`

- [ ] **B1.1** Policies:

```sql
grant select, insert on public.reserva to authenticated;

create policy reserva_select_own on public.reserva
  for select to authenticated
  using (
    pasajero_id = auth.uid()
    or public.current_rol() = 'operador'
  );

create policy reserva_insert_own on public.reserva
  for insert to authenticated
  with check (
    pasajero_id = auth.uid()
    and public.current_rol() in ('pasajero', 'operador')
  );
```

- [ ] **B1.2** RPC `crear_reserva(p_viaje_id uuid)`:

1. `auth.uid()` required.
2. Lock/select viaje `programado` + vehiculo.capacidad.
3. Count reservas con estado ∈ ocupan asiento.
4. Si sin cupo → `raise exception 'RESERVA_SIN_ASIENTOS'`.
5. Leer settings: `reserva.sena_monto`, tres % devolución.
6. `qr_token := 'opq_' || encode(gen_random_bytes(16), 'hex')`.
7. Insert `reserva` (`pendiente_sena`, snapshots, `pasajero_id = auth.uid()`, `asiento_num null`).
8. Return fila reserva (json o table).

```sql
grant execute on function public.crear_reserva(uuid) to authenticated;
```

**Por qué RPC:** evita race de último asiento entre dos pasajeros.

- [ ] **B1.3** `db reset` + test manual RPC con user pasajero.
- [ ] **B1.4** Commit:

```bash
git add supabase/migrations/0009_slice2_crear_reserva.sql
git commit -S -m "feat(supabase): crear_reserva RPC and reserva RLS"
```

---

## Task B2 — Adapter + service + action crear reserva

**Files:**
- Create: `apps/web/src/adapters/supabase/reservas-repository.ts`
- Create: `apps/web/src/application/reservas/reservas-service.ts`
- Create: `apps/web/src/application/reservas/actions.ts`
- Create: `apps/web/src/application/reservas/index.ts`
- Modify: `apps/web/src/adapters/supabase/viajes-repository.ts` (asientosLibres con count real)

- [ ] **B2.1** `createForPassenger` → `client.rpc('crear_reserva', { p_viaje_id })`; mapear error `RESERVA_SIN_ASIENTOS`.
- [ ] **B2.2** Service thin + action:

```ts
"use server";

export async function createReservaAction(
  viajeId: string,
): Promise<{ error: string } | void> {
  const profile = await requireProfile(["pasajero", "operador"]);
  const supabase = await createClient();
  const service = createReservasService(
    createSupabaseReservasRepository(supabase),
  );
  try {
    const reserva = await service.crear(viajeId);
    revalidatePath("/pasajero");
    revalidatePath(`/pasajero/viajes/${viajeId}`);
    redirect(`/pasajero?reserva=${reserva.id}`); // o /pasajero/reservas/[id] mínima
  } catch (e) {
    if (e instanceof Error && e.message === "RESERVA_SIN_ASIENTOS") {
      return { error: "No quedan asientos en este viaje." };
    }
    return { error: "No se pudo crear la reserva." };
  }
}
```

- [ ] **B2.3** Viajes repo: count reservas activas para `asientosLibres`.
- [ ] **B2.4** Typecheck + commit:

```bash
git add apps/web/src/adapters/supabase/reservas-repository.ts \
  apps/web/src/adapters/supabase/viajes-repository.ts \
  apps/web/src/application/reservas
git commit -S -m "feat(web): create reserva action and repository"
```

---

## Task B3 — UI: activar Reservar + feedback post-crear + home

**Pencil first:** P5 CTA; P2/P7 home (card mínima, sin QR).

**Files:**
- Modify: `apps/web/src/app/pasajero/viajes/[id]/page.tsx`
- Modify: `apps/web/src/app/pasajero/page.tsx`
- Optional: `apps/web/src/app/pasajero/reservas/[id]/page.tsx` (confirmación mínima **sin** QR ni pago)

- [ ] **B3.1** Detalle: form/button “Reservar” → `createReservaAction`. Si `asientosLibres === 0`, disabled + mensaje.
- [ ] **B3.2** Mostrar error de action en UI (texto danger, no inventar modal).
- [ ] **B3.3** Home:
  - Sin reserva activa → EmptyHint + Buscar (P2).
  - Con `pendiente_sena` → card ruta/hora + `StatusPill` “Pendiente seña” + texto “Completá el pago de la seña pronto” (**sin** CTA de comprobante todavía; opcional disabled “Próximamente”).
- [ ] **B3.4** Opcional página `/pasajero/reservas/[id]`: “Reserva creada”, monto seña (snapshot), pill pendiente, CTA “Ir al inicio”. **Prohibido:** canvas QR, upload comprobante, cancelar.
- [ ] **B3.5** Build + smoke. Commit:

```bash
git add apps/web/src/app/pasajero
git commit -S -m "feat(web): passenger book trip and pending reservation home"
```

---

## Task B4 — Verificación puntos críticos

- [ ] **B4.1 Capacidad**

1. Set `vehiculo.capacidad = 1` en un viaje.
2. Primera reserva OK.
3. Segunda (otro user o misma si policy lo permite) → `RESERVA_SIN_ASIENTOS`.

- [ ] **B4.2 Snapshots**

1. Crear reserva A (`monto_sena` actual, ej. 5000).
2. `update settings set valor = '6000' where clave = 'reserva.sena_monto'`.
3. Reserva A sigue 5000; reserva B nueva usa 6000.
4. `politica_cancelacion` jsonb tiene las 3 keys.

- [ ] **B4.3 QR token**

```sql
select qr_token, estado from reserva;
-- opq_… único; estado = pendiente_sena; sin PII en token
```

- [ ] **B4.4 RLS**

- Otro pasajero no lee reserva ajena.
- Anónimo no inserta.

- [ ] **B4.5 Regresión 2A**

- Búsqueda/detalle siguen OK; asientos bajan tras reservar.

- [ ] **B4.6**

```bash
npm run type-check --workspace=web
npm run lint --workspace=web
npm run build --workspace=web
```

---

## Task B5 — Status doc

**Files:**
- Create: `docs/09-slice-2-reservas-status.md`

- [ ] **B5.1** Documentar rutas, cómo seedear, checklist Done 2A/2B, fuera de scope.
- [ ] **B5.2** Commit:

```bash
git add docs/09-slice-2-reservas-status.md
git commit -S -m "docs: slice 2 passenger reservations status"
```

---

## Criterios de Done — Slice 2 completo (2A + 2B)

| # | Criterio |
|---|---|
| 1 | Busco Tandil→BsAs y veo viajes seed con precio y asientos |
| 2 | Detalle muestra conductor, vehículo, paradas en orden |
| 3 | “Reservar” crea fila `reserva` con `estado = pendiente_sena` |
| 4 | `qr_token` opaco único generado al crear |
| 5 | `monto_sena` y `politica_cancelacion` son snapshots de settings |
| 6 | Sin cupo → error claro, sin fila nueva |
| 7 | Home refleja empty o reserva pendiente (sin QR ni pago) |
| 8 | UI Ruta de la siesta (P3/P4/P5/P2) validada vs Pencil/previews |
| 9 | Capas: domain puro; adapters I/O; actions orquestan |
| 10 | Reuso: Supabase clients, SettingsService/Provider, SessionProvider |
| 11 | `type-check` + `build` OK |

---

## Qué queda para el siguiente slice

**Slice 3 — Seña del pasajero + confirmación operador (propuesta):**

1. Settings de transferencia (alias/CBU/titular).
2. UI checkout seña (P6) + envío comprobante → `pago` tipo `sena` `pendiente`.
3. Pantalla P11 “Seña en revisión”.
4. Operador O1: confirmar/rechazar → reserva `confirmada` / pago `confirmado`.
5. Recién ahí: pantalla QR (P8) usable con token ya existente.
6. (Opcional mismo slice o 3.1) cancelación RN-03.

**Después:** conductor (recogida, escaneo, saldo), tracking GPS, settings UI operador completa.

---

## Orden de trabajo (checklist rápido)

```
2A: A0 → A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9 → Done 2A
2B: B0 → B1 → B2 → B3 → B4 → B5 → Done Slice 2
```

No mezclar UI de 2B antes de cerrar Done 2A.

---

## Riesgos (cortos)

| Riesgo | Mitigación |
|---|---|
| Race último asiento | RPC `crear_reserva` |
| Seed `auth.users` frágil | UUIDs fijos + fallback script |
| DNI filtrado en join conductor | select explícito sin `dni` |
| Reserva abandonada ocupa cupo | Aceptable MVP; expiración job → post |
| Scope creep (pago/QR) | Gate: si no está en Done table, no se codea |

---

## Handoff

Plan en `docs/superpowers/plans/2026-08-21-tubi-slice-2-reservas-pasajero.md`.

Al decir **«ejecuta slice 2»**: empezar por **2A Task A0**, no por 2B.

Opciones de ejecución entonces: subagent-driven (recomendado) o inline con checkpoints.

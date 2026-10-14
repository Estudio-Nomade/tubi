#!/usr/bin/env node
/**
 * Seed two demo trips Tandil → Buenos Aires at $30.000.
 * Uses service role from apps/web/.env (never commit secrets).
 *
 * Usage: node scripts/seed-demo-trips.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnv(resolve("apps/web/.env"));
const base = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/web/.env");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function api(method, path, body, extra = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { ...headers, ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

function zonedDate(daysAhead, hour, minute = 0) {
  // Build wall-clock in America/Argentina/Buenos_Aires then to ISO.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const nowParts = fmt.formatToParts(new Date());
  const y = Number(nowParts.find((p) => p.type === "year").value);
  const m = Number(nowParts.find((p) => p.type === "month").value);
  const d = Number(nowParts.find((p) => p.type === "day").value);
  // noon UTC anchor to avoid DST edge when adding days
  const anchor = new Date(Date.UTC(y, m - 1, d, 15, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() + daysAhead);
  const y2 = anchor.getUTCFullYear();
  const m2 = String(anchor.getUTCMonth() + 1).padStart(2, "0");
  const d2 = String(anchor.getUTCDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  // Argentina is UTC-3 year-round
  return new Date(`${y2}-${m2}-${d2}T${hh}:${mm}:00-03:00`);
}

const RUTA_TANDIL_BSAS = "bbbbbbbb-bbbb-cccc-dddd-000000000001";
const DEMO_EMAIL = "demo.conductor@tubi.local";
const VIAJE_1 = "aaaaaaaa-aaaa-aaaa-aaaa-0000000000a1";
const VIAJE_2 = "aaaaaaaa-aaaa-aaaa-aaaa-0000000000a2";
const VEHICULO_ID = "aaaaaaaa-aaaa-aaaa-aaaa-0000000000b1";

async function main() {
  // 1) Ensure demo conductor auth user
  let conductorId = null;
  const listed = await api("GET", "/auth/v1/admin/users?page=1&per_page=200");
  const users = listed.users ?? listed ?? [];
  const existing = users.find((u) => u.email === DEMO_EMAIL);
  if (existing) {
    conductorId = existing.id;
    console.log("demo conductor exists", conductorId);
  } else {
    const created = await api("POST", "/auth/v1/admin/users", {
      email: DEMO_EMAIL,
      password: crypto.randomUUID() + "Aa1!",
      email_confirm: true,
      user_metadata: { name: "Martín González" },
    });
    conductorId = created.id;
    console.log("created demo conductor", conductorId);
  }

  // 2) Profile
  await api(
    "POST",
    "/rest/v1/profiles?on_conflict=id",
    {
      id: conductorId,
      rol: "conductor",
      nombre: "Martín",
      apellido: "González",
      telefono: "2494000000",
    },
    { Prefer: "resolution=merge-duplicates,return=minimal" },
  );
  console.log("profile ok");

  // 3) Vehicle
  const vehRows = await api(
    "GET",
    `/rest/v1/vehiculo?or=(id.eq.${VEHICULO_ID},patente.eq.DEMO01)&select=id,conductor_id,patente`,
  );
  let vehiculoId = vehRows?.[0]?.id ?? null;
  if (!vehiculoId) {
    await api(
      "POST",
      "/rest/v1/vehiculo",
      {
        id: VEHICULO_ID,
        conductor_id: conductorId,
        patente: "DEMO01",
        marca: "Toyota",
        modelo: "Corolla",
        color: "Gris",
        capacidad: 4,
      },
      { Prefer: "return=minimal" },
    );
    vehiculoId = VEHICULO_ID;
    console.log("vehicle created", vehiculoId);
  } else {
    console.log("vehicle exists", vehiculoId);
  }

  // 4) Trips
  const t1 = zonedDate(1, 8, 0);
  const t2 = zonedDate(2, 18, 0);
  const trips = [
    {
      id: VIAJE_1,
      ruta_id: RUTA_TANDIL_BSAS,
      conductor_id: conductorId,
      vehiculo_id: vehiculoId,
      fecha_salida: t1.toISOString(),
      eta_llegada: new Date(t1.getTime() + 5 * 3600_000).toISOString(),
      precio: 30000,
      estado: "programado",
    },
    {
      id: VIAJE_2,
      ruta_id: RUTA_TANDIL_BSAS,
      conductor_id: conductorId,
      vehiculo_id: vehiculoId,
      fecha_salida: t2.toISOString(),
      eta_llegada: new Date(t2.getTime() + 5 * 3600_000).toISOString(),
      precio: 30000,
      estado: "programado",
    },
  ];

  for (const trip of trips) {
    await api(
      "POST",
      "/rest/v1/viaje?on_conflict=id",
      trip,
      { Prefer: "resolution=merge-duplicates,return=minimal" },
    );
    console.log("trip upsert", trip.id, trip.fecha_salida, trip.precio);
  }

  // 5) Lock operator signup setting
  await api(
    "POST",
    "/rest/v1/settings?on_conflict=clave",
    {
      clave: "auth.allow_operador_signup",
      valor: false,
      tipo: "boolean",
      descripcion: "Permite el alta self-service de cuentas de operador",
    },
    { Prefer: "resolution=merge-duplicates,return=minimal" },
  );
  console.log("auth.allow_operador_signup = false");

  const check = await api(
    "GET",
    `/rest/v1/viaje?id=in.(${VIAJE_1},${VIAJE_2})&select=id,fecha_salida,precio,estado`,
  );
  console.log("verify", check);
  console.log("DONE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

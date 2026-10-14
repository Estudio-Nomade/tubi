import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Catalog city suggestions for passenger search.
 * GET /api/ciudades?q=tan → { results: ["Tandil", ...] }
 * Requires authenticated session (parada/ruta RLS is authenticated-only).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "NO_AUTENTICADO" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const [paradaRes, rutaRes] = await Promise.all([
    supabase.from("parada").select("ciudad"),
    supabase.from("ruta").select("origen,destino"),
  ]);

  if (paradaRes.error || rutaRes.error) {
    return NextResponse.json({ results: [], error: "CATALOG_ERROR" }, { status: 500 });
  }

  const cities = new Set<string>();
  for (const row of paradaRes.data ?? []) {
    const c = (row.ciudad ?? "").trim();
    if (c) cities.add(c);
  }
  for (const row of rutaRes.data ?? []) {
    const o = (row.origen ?? "").trim();
    const d = (row.destino ?? "").trim();
    if (o) cities.add(o);
    if (d) cities.add(d);
  }

  let results = [...cities].sort((a, b) => a.localeCompare(b, "es"));
  if (q) {
    results = results.filter((c) => c.toLowerCase().includes(q));
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}

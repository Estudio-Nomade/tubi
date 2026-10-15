import { NextResponse } from "next/server";

import { createPhotonGeocoder } from "@/adapters/photon/photon-geocoder";
import { createClient } from "@/lib/supabase/server";

/**
 * City suggestions for passenger search.
 * Catalog (paradas/rutas) first, then Photon localities so any place is searchable.
 * GET /api/ciudades?q=bar → { results: ["Bariloche", ...] }
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
  const qRaw = (url.searchParams.get("q") ?? "").trim();
  const q = qRaw.toLowerCase();

  const [paradaRes, rutaRes] = await Promise.all([
    supabase.from("parada").select("ciudad"),
    supabase.from("ruta").select("origen,destino"),
  ]);

  if (paradaRes.error || rutaRes.error) {
    return NextResponse.json(
      { results: [], error: "CATALOG_ERROR" },
      { status: 500 },
    );
  }

  const catalog = new Set<string>();
  for (const row of paradaRes.data ?? []) {
    const c = (row.ciudad ?? "").trim();
    if (c) catalog.add(c);
  }
  for (const row of rutaRes.data ?? []) {
    const o = (row.origen ?? "").trim();
    const d = (row.destino ?? "").trim();
    if (o) catalog.add(o);
    if (d) catalog.add(d);
  }

  let catalogList = [...catalog].sort((a, b) => a.localeCompare(b, "es"));
  if (q) {
    catalogList = catalogList.filter((c) => c.toLowerCase().includes(q));
  }

  const seen = new Set(catalogList.map((c) => c.toLowerCase()));
  const results = [...catalogList];

  // Free-world suggestions via Photon when query is long enough
  if (qRaw.length >= 2) {
    try {
      const geocoder = createPhotonGeocoder();
      const geo = await geocoder.search({ query: qRaw });
      if (!geo.error) {
        for (const s of geo.results) {
          const locality = localityFromLabel(s.label);
          if (!locality) continue;
          const key = locality.toLowerCase();
          if (seen.has(key)) continue;
          if (q && !key.includes(q) && !locality.toLowerCase().startsWith(q)) {
            // keep if label contains query (e.g. "San Carlos de Bariloche")
            if (!s.label.toLowerCase().includes(q)) continue;
          }
          seen.add(key);
          results.push(locality);
          if (results.length >= 12) break;
        }
      }
    } catch {
      // catalog-only fallback
    }
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}

/** Prefer city-like token from "Street, City, Province, Country". */
function localityFromLabel(label: string): string | null {
  const parts = label
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  // Skip pure street+number first segment when there is a locality after
  if (parts.length >= 2 && /\d/.test(parts[0]!)) {
    return parts[1] ?? null;
  }
  // Single name or city-first
  const candidate = parts[0]!;
  if (candidate.length < 2) return null;
  return candidate;
}

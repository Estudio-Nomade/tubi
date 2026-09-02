import { NextResponse } from "next/server";

import { createPhotonGeocoder } from "@/adapters/photon/photon-geocoder";
import { TANDIL_BBOX, TANDIL_CENTER } from "@/domain/geo";
import { createClient } from "@/lib/supabase/server";

/**
 * Proxy de geocodificación (AD-9): el browser nunca llama a Photon directo.
 * Forward: GET /api/geocode?q=<texto>&bias=tandil
 * Reverse: GET /api/geocode?lat=<lat>&lng=<lng>
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
  const q = (url.searchParams.get("q") ?? "").trim();
  const biasParam = (url.searchParams.get("bias") ?? "").trim().toLowerCase();
  const limitRaw = Number(url.searchParams.get("limit") ?? "6");

  // `lat`/`lng` ausentes → get() devuelve null → Number(null) === 0 (finito).
  // Detectar reverse por presencia del parámetro, no por Number(), o todo
  // search caería en el branch reverse (reverse en 0,0 → features vacías).
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const isReverse = latParam !== null && lngParam !== null;

  const geocoder = createPhotonGeocoder();

  if (isReverse) {
    const latRaw = Number(latParam);
    const lngRaw = Number(lngParam);
    if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) {
      return NextResponse.json({ results: [] });
    }
    const suggestion = await geocoder.reverse({ lat: latRaw, lng: lngRaw });
    return NextResponse.json({ results: suggestion ? [suggestion] : [] });
  }

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const bias =
    biasParam === "tandil"
      ? { lat: TANDIL_CENTER.lat, lon: TANDIL_CENTER.lng, bbox: TANDIL_BBOX }
      : undefined;

  const results = await geocoder.search({
    query: q,
    bias,
  });

  if (results.error) {
    return NextResponse.json({ results: [], error: results.error });
  }

  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : results.results.length;

  return NextResponse.json({ results: results.results.slice(0, limit) });
}

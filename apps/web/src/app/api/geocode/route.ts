import { NextResponse } from "next/server";

import { createPhotonGeocoder } from "@/adapters/photon/photon-geocoder";
import { TANDIL_BBOX, TANDIL_CENTER } from "@/domain/geo";
import { createClient } from "@/lib/supabase/server";

/**
 * Proxy de geocodificación (AD-9): el browser nunca llama a Photon directo.
 * GET /api/geocode?q=<texto>&bias=tandil
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

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const geocoder = createPhotonGeocoder();
  const bias =
    biasParam === "tandil"
      ? { lat: TANDIL_CENTER.lat, lon: TANDIL_CENTER.lng, bbox: TANDIL_BBOX }
      : undefined;

  const results = await geocoder.search({
    query: q,
    bias,
  });

  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : results.length;

  return NextResponse.json({ results: results.slice(0, limit) });
}

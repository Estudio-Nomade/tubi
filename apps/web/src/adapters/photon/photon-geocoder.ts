/**
 * Photon adapter para el puerto Geocoder (AD-9).
 * Photon es la implementación MVP: geocodificación libre (OSM) sin clave.
 * La URL de Photon vive acá (adapter), nunca en el dominio ni en la UI cruda.
 */

import type {
  GeocodeBias,
  GeocodeInput,
  GeocodeReverseInput,
  GeocodeSearchResult,
  GeocodeSuggestion,
  Geocoder,
} from "@/domain/geo";

const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";

// Photon (API pública) solo soporta default|de|en|fr. `lang=es` devuelve 400.
const PHOTON_LANG = "default";
// Algunos edges OSM exigen User-Agent; no mandar requests sin él.
const USER_AGENT = "Tubi/1.0 (viajes compartidos; local-dev)";
// No colgar el picker si Photon no responde.
const FETCH_TIMEOUT_MS = 8000;

type PhotonProperties = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  osm_id?: number;
  osm_type?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
};

/**
 * Label legible calle-primero (patrón Lifty `formatPhotonAddress`):
 * "San Martín 454, Tandil, Buenos Aires". El `name` solo entra si no hay
 * calle+altura (POI), para no anteponer un POI genérico al dato de dirección.
 */
function buildLabel(props: PhotonProperties): string {
  const street = (props.street ?? "").trim();
  const housenumber = (props.housenumber ?? "").trim();
  const name = (props.name ?? "").trim();

  const streetLine = street && housenumber ? `${street} ${housenumber}` : street;
  const primary = streetLine || name;

  const locality = props.city ?? props.town ?? props.village ?? "";
  const parts = [primary, locality, props.state, props.country]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Ubicación";
}

function buildOsmUrl(props: PhotonProperties): string | null {
  if (!props.osm_type || props.osm_id == null) return null;
  return `https://www.openstreetmap.org/${props.osm_type}/${props.osm_id}`;
}

function buildPlaceId(props: PhotonProperties): string | null {
  if (!props.osm_type || props.osm_id == null) return null;
  return `${props.osm_type}/${props.osm_id}`;
}

function toSuggestion(feature: PhotonFeature): GeocodeSuggestion | null {
  const coords = feature.geometry?.coordinates;
  const props = feature.properties ?? {};
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    label: buildLabel(props),
    lat,
    lng,
    placeId: buildPlaceId(props),
    osmUrl: buildOsmUrl(props),
  };
}

type FetchResult =
  | { ok: true; json: unknown }
  | { ok: false; status: number; body: string };

async function fetchJson(url: string): Promise<FetchResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[photon] fetch error:", err);
    }
    return { ok: false, status: 0, body: "" };
  }

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // no hacer nada: el status ya alcanza para el log de dev
    }
    if (process.env.NODE_ENV !== "production") {
      console.error(`[photon] ${url} -> HTTP ${res.status}: ${body}`);
    }
    return { ok: false, status: res.status, body };
  }

  try {
    return { ok: true, json: await res.json() };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[photon] json parse error:", err);
    }
    return { ok: false, status: res.status, body: "" };
  }
}

function toSuggestions(json: unknown): GeocodeSuggestion[] {
  const features = (json as { features?: PhotonFeature[] })?.features ?? [];
  const out: GeocodeSuggestion[] = [];
  for (const feature of features) {
    const s = toSuggestion(feature);
    if (s) out.push(s);
  }
  return out;
}

function buildSearchUrl(q: string, bias?: GeocodeBias): string {
  const params = new URLSearchParams({ q, limit: "6", lang: PHOTON_LANG });

  if (bias) {
    params.set("lat", String(bias.lat));
    params.set("lon", String(bias.lon));
    if (bias.bbox) {
      params.set(
        "bbox",
        [
          bias.bbox.minLng,
          bias.bbox.minLat,
          bias.bbox.maxLng,
          bias.bbox.maxLat,
        ].join(","),
      );
    }
  }

  return `${PHOTON_URL}?${params.toString()}`;
}

export function createPhotonGeocoder(): Geocoder {
  return {
    async search(input: GeocodeInput): Promise<GeocodeSearchResult> {
      const q = input.query.trim();
      if (!q) return { results: [], error: null };

      // Intento A: bias completo (lat/lon + bbox). Intento B: sin bbox (solo
      // lat/lon). Intento C: q + " Tandil" sin bbox, cuando A/B no devuelven
      // nada y la query no menciona la ciudad. Así el predictivo no se queda
      // en empty por un bbox o una query demasiado local.
      const attempts: { q: string; bias?: GeocodeBias }[] = [];
      const bias = input.bias;

      if (bias) {
        attempts.push({ q, bias });
        if (bias.bbox) {
          attempts.push({ q, bias: { lat: bias.lat, lon: bias.lon } });
          if (!q.toLowerCase().includes("tandil")) {
            attempts.push({
              q: `${q} Tandil`,
              bias: { lat: bias.lat, lon: bias.lon },
            });
          }
        }
      } else {
        attempts.push({ q });
      }

      let sawError = false;

      for (const attempt of attempts) {
        const result = await fetchJson(buildSearchUrl(attempt.q, attempt.bias));
        if (!result.ok) {
          sawError = true;
          continue;
        }
        const suggestions = toSuggestions(result.json);
        if (suggestions.length > 0) {
          return { results: suggestions, error: null };
        }
      }

      if (sawError) return { results: [], error: "GEOCODER_UPSTREAM" };
      return { results: [], error: null };
    },

    async reverse(input: GeocodeReverseInput): Promise<GeocodeSuggestion | null> {
      const { lat, lng } = input;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        lang: PHOTON_LANG,
      });

      const result = await fetchJson(`${PHOTON_REVERSE_URL}?${params.toString()}`);
      if (!result.ok) return null;
      return toSuggestions(result.json)[0] ?? null;
    },
  };
}

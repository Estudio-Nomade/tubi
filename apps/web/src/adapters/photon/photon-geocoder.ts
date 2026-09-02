/**
 * Photon adapter para el puerto Geocoder (AD-9).
 * Photon es la implementación MVP: geocodificación libre (OSM) sin clave.
 * La URL de Photon vive acá (adapter), nunca en el dominio ni en la UI cruda.
 */

import type {
  GeocodeBias,
  GeocodeInput,
  GeocodeReverseInput,
  GeocodeSuggestion,
  Geocoder,
} from "@/domain/geo";

const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";

type PhotonProperties = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  osm_id?: number;
  osm_type?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
};

function buildLabel(props: PhotonProperties): string {
  const parts: string[] = [];

  const streetLine = [props.housenumber, props.street]
    .filter(Boolean)
    .join(" ");

  if (props.name && props.name !== props.street) {
    parts.push(props.name);
  }
  if (streetLine && !parts.includes(streetLine)) {
    parts.push(streetLine);
  }

  const locality = props.city ?? props.district ?? props.county ?? props.state;
  if (locality) {
    const already = parts.some((p) =>
      p.toLowerCase().includes(locality.toLowerCase()),
    );
    if (!already) parts.push(locality);
  }

  if (parts.length === 0 && props.name) parts.push(props.name);
  if (parts.length === 0) parts.push("Ubicación");

  return parts.join(", ");
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

export function createPhotonGeocoder(): Geocoder {
  return {
    async search(input: GeocodeInput): Promise<GeocodeSuggestion[]> {
      const q = input.query.trim();
      if (!q) return [];

      // Photon no soporta "es"; usa los nombres nativos de OSM por default.
      const params = new URLSearchParams({ q, limit: "6" });

      const bias: GeocodeBias | undefined = input.bias;
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

      let res: Response;
      try {
        res = await fetch(`${PHOTON_URL}?${params.toString()}`, {
          headers: { accept: "application/json" },
        });
      } catch {
        return [];
      }

      if (!res.ok) return [];

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        return [];
      }

      const features = (json as { features?: PhotonFeature[] })?.features ?? [];
      const out: GeocodeSuggestion[] = [];
      for (const feature of features) {
        const s = toSuggestion(feature);
        if (s) out.push(s);
      }
      return out;
    },

    async reverse(input: GeocodeReverseInput): Promise<GeocodeSuggestion | null> {
      const { lat, lng } = input;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
      });

      let res: Response;
      try {
        res = await fetch(`${PHOTON_REVERSE_URL}?${params.toString()}`, {
          headers: { accept: "application/json" },
        });
      } catch {
        return null;
      }

      if (!res.ok) return null;

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        return null;
      }

      const features = (json as { features?: PhotonFeature[] })?.features ?? [];
      const first = features[0];
      return first ? toSuggestion(first) : null;
    },
  };
}

/** Tipos del puerto de geocodificación (AD-9: MapsProvider). */

export type PickupMode = "libre_tandil" | "fijo_ruta";

export type GeocodeSuggestion = {
  label: string;
  lat: number;
  lng: number;
  placeId: string | null;
  osmUrl: string | null;
};

export type GeocodeBias = {
  lat: number;
  lon: number;
  /** Photon format (lon,lat order when serialized): minLng,minLat,maxLng,maxLat */
  bbox?: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
};

export type GeocodeInput = {
  query: string;
  bias?: GeocodeBias;
};

export type GeocodeSearchResult = {
  results: GeocodeSuggestion[];
  /** Distingue "no hay resultados" (null) de "el geocoder falló" (error). */
  error: "GEOCODER_UPSTREAM" | null;
};

export type GeocodeReverseInput = {
  lat: number;
  lng: number;
};

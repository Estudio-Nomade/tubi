import type {
  GeocodeInput,
  GeocodeReverseInput,
  GeocodeSearchResult,
  GeocodeSuggestion,
} from "./types";

/** Puerto de geocodificación. Photon es el adaptador MVP. */
export interface Geocoder {
  search(input: GeocodeInput): Promise<GeocodeSearchResult>;
  reverse(input: GeocodeReverseInput): Promise<GeocodeSuggestion | null>;
}

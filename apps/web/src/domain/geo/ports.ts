import type {
  GeocodeInput,
  GeocodeReverseInput,
  GeocodeSuggestion,
} from "./types";

/** Puerto de geocodificación. Photon es el adaptador MVP. */
export interface Geocoder {
  search(input: GeocodeInput): Promise<GeocodeSuggestion[]>;
  reverse(input: GeocodeReverseInput): Promise<GeocodeSuggestion | null>;
}

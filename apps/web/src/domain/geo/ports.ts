import type { GeocodeInput, GeocodeSuggestion } from "./types";

/** Puerto de geocodificación. Photon es el adaptador MVP. */
export interface Geocoder {
  search(input: GeocodeInput): Promise<GeocodeSuggestion[]>;
}

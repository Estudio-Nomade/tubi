/** Link "cómo llegar" sin depender del SDK de mapas (AD-9). */

export function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

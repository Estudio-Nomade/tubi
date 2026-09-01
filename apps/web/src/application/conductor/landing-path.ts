/**
 * Where a conductor should land after auth / when opening the area.
 * New conductors must register a vehicle before the trip home is useful.
 */

export const CONDUCTOR_VEHICULO_ONBOARDING_PATH =
  "/conductor/vehiculo?onboarding=1" as const;

export function conductorLandingPath(hasVehiculo: boolean): string {
  return hasVehiculo ? "/conductor" : CONDUCTOR_VEHICULO_ONBOARDING_PATH;
}

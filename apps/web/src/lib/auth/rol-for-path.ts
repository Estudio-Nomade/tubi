/**
 * Maps a role-area path to its role, so the auth middleware can preserve role
 * context when it bounces an anonymous user to /login (e.g. /operador → login
 * "Cuenta de operador" → /registro/operador).
 */

export type RolContext = "pasajero" | "conductor" | "operador";

const AREAS: readonly { prefix: string; rol: RolContext }[] = [
  { prefix: "/operador", rol: "operador" },
  { prefix: "/conductor", rol: "conductor" },
  { prefix: "/pasajero", rol: "pasajero" },
];

export function rolForPath(pathname: string): RolContext | null {
  for (const { prefix, rol } of AREAS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return rol;
    }
  }
  return null;
}

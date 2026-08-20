/**
 * Auth / profile domain types. No framework or Supabase imports.
 */

export type Rol = "pasajero" | "conductor" | "operador";

export type Profile = {
  id: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string | null;
  dniVerificado: boolean;
};

/** Fields required to insert a new profile after sign-up. */
export type ProfileInsert = {
  id: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string | null;
};

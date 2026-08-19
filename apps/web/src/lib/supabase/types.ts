/**
 * Minimal Database stub aligned with supabase/migrations/0001_init.sql.
 * Replace with `supabase gen types typescript` once the project is linked.
 */

export type Rol = "pasajero" | "conductor" | "operador";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          rol: Rol;
          nombre: string;
          apellido: string;
          telefono: string;
          dni: string | null;
          dni_verificado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          rol?: Rol;
          nombre: string;
          apellido: string;
          telefono: string;
          dni?: string | null;
          dni_verificado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rol?: Rol;
          nombre?: string;
          apellido?: string;
          telefono?: string;
          dni?: string | null;
          dni_verificado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          clave: string;
          valor: Json;
          tipo: string;
          descripcion: string | null;
          actualizado_por: string | null;
          updated_at: string;
        };
        Insert: {
          clave: string;
          valor: Json;
          tipo?: string;
          descripcion?: string | null;
          actualizado_por?: string | null;
          updated_at?: string;
        };
        Update: {
          clave?: string;
          valor?: Json;
          tipo?: string;
          descripcion?: string | null;
          actualizado_por?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      rol: Rol;
    };
    CompositeTypes: Record<string, never>;
  };
};

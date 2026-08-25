import type { EstadoViaje, TipoParada } from "@/lib/supabase/types";

export type { EstadoViaje, TipoParada };

export type SearchViajesQuery = {
  origen: string;
  destino: string;
  /** YYYY-MM-DD */
  fecha: string;
  /** HH:mm optional lower bound on departure time */
  horaDesde?: string;
};

export type ViajeListItem = {
  id: string;
  origen: string;
  destino: string;
  fechaSalida: string;
  precio: number;
  estado: EstadoViaje;
  /** Slice 2A: equals vehicle capacity until reservas count exists in 2B */
  asientosLibres: number;
  vehiculo: {
    patente: string;
    marca: string;
    modelo: string;
    color: string;
  };
};

export type ViajeDetail = ViajeListItem & {
  etaLlegada: string | null;
  conductor: {
    id: string;
    nombre: string;
    apellido: string;
  };
  paradas: Array<{
    id: string;
    nombre: string;
    ciudad: string;
    orden: number;
    tipo: TipoParada;
  }>;
};

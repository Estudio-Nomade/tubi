import type { TipoParada } from "@/domain/viajes";

export type ParadaRow = {
  id: string;
  rutaId: string;
  nombre: string;
  ciudad: string;
  lat: number;
  lng: number;
  orden: number;
  tipo: TipoParada;
};

export type RutaParadasInfo = {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
};

export type ActualizarParadaInput = {
  paradaId: string;
  nombre: string;
  ciudad: string;
  lat: number;
  lng: number;
};

export type CrearParadaIntermediaInput = {
  rutaId: string;
  nombre: string;
  ciudad: string;
  lat: number;
  lng: number;
  orden?: number | null;
};

export type ParadaMutationResult = {
  ok: true;
  paradaId: string;
  rutaId: string;
};

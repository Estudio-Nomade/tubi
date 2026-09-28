import type { CuponCampania, CuponUsuario } from "./types";

export type CuponesRepository = {
  canjear(codigo: string): Promise<CuponUsuario>;
  listMine(pasajeroId: string): Promise<CuponUsuario[]>;
  listDisponiblesForRuta(
    pasajeroId: string,
    rutaId: string | null,
  ): Promise<CuponUsuario[]>;
  listCampanias(): Promise<CuponCampania[]>;
  crearCampania(input: {
    codigo: string;
    montoDescuento: number;
    cuposTotales: number | null;
    vigenciaDesde: string;
    vigenciaHasta: string;
    validoDiasPostCanje: number;
    maxPorUsuario: number;
    rutaId: string | null;
  }): Promise<{ id: string; codigo: string }>;
  setCampaniaActiva(id: string, activa: boolean): Promise<void>;
};

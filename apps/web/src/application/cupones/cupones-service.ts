import type {
  CuponCampania,
  CuponesRepository,
  CuponUsuario,
} from "@/domain/cupones";

export function createCuponesService(repo: CuponesRepository) {
  return {
    canjear(codigo: string): Promise<CuponUsuario> {
      return repo.canjear(codigo);
    },
    listMine(pasajeroId: string): Promise<CuponUsuario[]> {
      return repo.listMine(pasajeroId);
    },
    listDisponiblesForRuta(
      pasajeroId: string,
      rutaId: string | null,
    ): Promise<CuponUsuario[]> {
      return repo.listDisponiblesForRuta(pasajeroId, rutaId);
    },
    listCampanias(): Promise<CuponCampania[]> {
      return repo.listCampanias();
    },
    crearCampania(input: {
      codigo: string;
      montoDescuento: number;
      cuposTotales: number | null;
      vigenciaDesde: string;
      vigenciaHasta: string;
      validoDiasPostCanje: number;
      maxPorUsuario: number;
      rutaId: string | null;
    }): Promise<{ id: string; codigo: string }> {
      return repo.crearCampania(input);
    },
    setCampaniaActiva(id: string, activa: boolean): Promise<void> {
      return repo.setCampaniaActiva(id, activa);
    },
  };
}

export type CuponesService = ReturnType<typeof createCuponesService>;

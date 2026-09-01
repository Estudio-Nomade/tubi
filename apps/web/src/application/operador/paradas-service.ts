import type {
  ActualizarParadaInput,
  CrearParadaIntermediaInput,
  OperadorParadasRepository,
  ParadaMutationResult,
  ParadaRow,
  RutaParadasInfo,
} from "@/domain/operador";

export function createOperadorParadasService(repo: OperadorParadasRepository) {
  return {
    getRuta(rutaId: string): Promise<RutaParadasInfo | null> {
      return repo.getRuta(rutaId);
    },
    listParadas(rutaId: string): Promise<ParadaRow[]> {
      return repo.listParadas(rutaId);
    },
    actualizarParada(
      input: ActualizarParadaInput,
    ): Promise<ParadaMutationResult> {
      return repo.actualizarParada(input);
    },
    crearParadaIntermedia(
      input: CrearParadaIntermediaInput,
    ): Promise<ParadaMutationResult> {
      return repo.crearParadaIntermedia(input);
    },
    eliminarParadaIntermedia(paradaId: string): Promise<ParadaMutationResult> {
      return repo.eliminarParadaIntermedia(paradaId);
    },
    reordenarParadas(
      rutaId: string,
      ids: string[],
    ): Promise<ParadaMutationResult> {
      return repo.reordenarParadas(rutaId, ids);
    },
  };
}

export type OperadorParadasService = ReturnType<
  typeof createOperadorParadasService
>;

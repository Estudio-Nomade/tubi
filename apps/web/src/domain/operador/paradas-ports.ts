import type {
  ActualizarParadaInput,
  CrearParadaIntermediaInput,
  ParadaMutationResult,
  ParadaRow,
  RutaParadasInfo,
} from "./paradas-types";

export interface OperadorParadasRepository {
  getRuta(rutaId: string): Promise<RutaParadasInfo | null>;
  listParadas(rutaId: string): Promise<ParadaRow[]>;
  actualizarParada(input: ActualizarParadaInput): Promise<ParadaMutationResult>;
  crearParadaIntermedia(
    input: CrearParadaIntermediaInput,
  ): Promise<ParadaMutationResult>;
  eliminarParadaIntermedia(paradaId: string): Promise<ParadaMutationResult>;
  reordenarParadas(rutaId: string, ids: string[]): Promise<ParadaMutationResult>;
}

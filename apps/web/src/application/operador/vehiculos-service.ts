import type {
  CrearVehiculoInput,
  CrearVehiculoResult,
  OperadorVehiculosRepository,
} from "@/domain/operador";

export function createOperadorVehiculosService(
  repo: OperadorVehiculosRepository,
) {
  return {
    crearVehiculo(input: CrearVehiculoInput): Promise<CrearVehiculoResult> {
      return repo.crearVehiculo(input);
    },
  };
}

export type OperadorVehiculosService = ReturnType<
  typeof createOperadorVehiculosService
>;

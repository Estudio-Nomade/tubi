import type {
  CrearVehiculoInput,
  CrearVehiculoResult,
} from "./vehiculos-types";

export interface OperadorVehiculosRepository {
  crearVehiculo(input: CrearVehiculoInput): Promise<CrearVehiculoResult>;
}

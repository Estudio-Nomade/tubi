export type CrearVehiculoInput = {
  conductorId: string;
  patente: string;
  marca: string;
  modelo: string;
  color: string;
  capacidad: number;
};

export type CrearVehiculoResult = {
  ok: true;
  vehiculoId: string;
  conductorId: string;
  patente: string;
  capacidad: number;
};

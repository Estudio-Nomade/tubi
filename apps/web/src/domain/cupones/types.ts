export type EstadoCuponUsuario =
  | "disponible"
  | "reservado"
  | "usado"
  | "vencido"
  | "anulado";

export type CuponUsuario = {
  id: string;
  campaniaId: string;
  codigoCampania: string;
  estado: EstadoCuponUsuario;
  montoDescuento: number;
  venceEn: string;
  reservaId: string | null;
  canjeadoEn: string;
};

export type CuponCampania = {
  id: string;
  codigo: string;
  montoDescuento: number;
  cuposTotales: number | null;
  cuposUsados: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  validoDiasPostCanje: number;
  maxPorUsuario: number;
  rutaId: string | null;
  activa: boolean;
};

/**
 * Minimal Database stub aligned with supabase/migrations.
 * Replace with `supabase gen types typescript` once the project is linked.
 */

export type Rol = "pasajero" | "conductor" | "operador";

export type EstadoViaje =
  | "programado"
  | "recogida"
  | "en_curso"
  | "completado"
  | "cancelado";

export type TipoParada = "origen" | "intermedio" | "destino";

export type EstadoReserva =
  | "pendiente_sena"
  | "confirmada"
  | "verificada"
  | "abordada"
  | "cancelada"
  | "no_show";

export type TipoPago = "sena" | "saldo";
export type MetodoPago = "efectivo" | "transferencia";
export type EstadoPago = "pendiente" | "confirmado" | "rechazado";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          rol: Rol;
          nombre: string;
          apellido: string;
          telefono: string;
          dni: string | null;
          dni_verificado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          rol?: Rol;
          nombre: string;
          apellido: string;
          telefono: string;
          dni?: string | null;
          dni_verificado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rol?: Rol;
          nombre?: string;
          apellido?: string;
          telefono?: string;
          dni?: string | null;
          dni_verificado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          clave: string;
          valor: Json;
          tipo: string;
          descripcion: string | null;
          actualizado_por: string | null;
          updated_at: string;
        };
        Insert: {
          clave: string;
          valor: Json;
          tipo?: string;
          descripcion?: string | null;
          actualizado_por?: string | null;
          updated_at?: string;
        };
        Update: {
          clave?: string;
          valor?: Json;
          tipo?: string;
          descripcion?: string | null;
          actualizado_por?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ruta: {
        Row: {
          id: string;
          nombre: string;
          origen: string;
          destino: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          origen: string;
          destino: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          origen?: string;
          destino?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      parada: {
        Row: {
          id: string;
          ruta_id: string;
          nombre: string;
          ciudad: string;
          lat: number;
          lng: number;
          orden: number;
          tipo: TipoParada;
        };
        Insert: {
          id?: string;
          ruta_id: string;
          nombre: string;
          ciudad: string;
          lat: number;
          lng: number;
          orden: number;
          tipo?: TipoParada;
        };
        Update: {
          id?: string;
          ruta_id?: string;
          nombre?: string;
          ciudad?: string;
          lat?: number;
          lng?: number;
          orden?: number;
          tipo?: TipoParada;
        };
        Relationships: [];
      };
      vehiculo: {
        Row: {
          id: string;
          conductor_id: string;
          patente: string;
          marca: string;
          modelo: string;
          color: string;
          capacidad: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conductor_id: string;
          patente: string;
          marca: string;
          modelo: string;
          color: string;
          capacidad: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conductor_id?: string;
          patente?: string;
          marca?: string;
          modelo?: string;
          color?: string;
          capacidad?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      viaje: {
        Row: {
          id: string;
          ruta_id: string;
          conductor_id: string;
          vehiculo_id: string;
          fecha_salida: string;
          eta_llegada: string | null;
          precio: number;
          estado: EstadoViaje;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ruta_id: string;
          conductor_id: string;
          vehiculo_id: string;
          fecha_salida: string;
          eta_llegada?: string | null;
          precio: number;
          estado?: EstadoViaje;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ruta_id?: string;
          conductor_id?: string;
          vehiculo_id?: string;
          fecha_salida?: string;
          eta_llegada?: string | null;
          precio?: number;
          estado?: EstadoViaje;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reserva: {
        Row: {
          id: string;
          viaje_id: string;
          pasajero_id: string;
          asiento_num: number | null;
          estado: EstadoReserva;
          monto_sena: number;
          qr_token: string;
          politica_cancelacion: Json;
          cancelada_en: string | null;
          monto_devolucion: number | null;
          devolucion_pct: number | null;
          devolucion_saldada_en: string | null;
          recogida_label: string | null;
          recogida_lat: number | null;
          recogida_lng: number | null;
          recogida_place_id: string | null;
          recogida_mode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          viaje_id: string;
          pasajero_id: string;
          asiento_num?: number | null;
          estado?: EstadoReserva;
          monto_sena: number;
          qr_token: string;
          politica_cancelacion: Json;
          cancelada_en?: string | null;
          monto_devolucion?: number | null;
          devolucion_pct?: number | null;
          devolucion_saldada_en?: string | null;
          recogida_label?: string | null;
          recogida_lat?: number | null;
          recogida_lng?: number | null;
          recogida_place_id?: string | null;
          recogida_mode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          viaje_id?: string;
          pasajero_id?: string;
          asiento_num?: number | null;
          estado?: EstadoReserva;
          monto_sena?: number;
          qr_token?: string;
          politica_cancelacion?: Json;
          cancelada_en?: string | null;
          monto_devolucion?: number | null;
          devolucion_pct?: number | null;
          devolucion_saldada_en?: string | null;
          recogida_label?: string | null;
          recogida_lat?: number | null;
          recogida_lng?: number | null;
          recogida_place_id?: string | null;
          recogida_mode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pago: {
        Row: {
          id: string;
          reserva_id: string;
          tipo: TipoPago;
          monto: number;
          metodo: MetodoPago;
          estado: EstadoPago;
          comprobante: string | null;
          confirmado_por: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reserva_id: string;
          tipo: TipoPago;
          monto: number;
          metodo: MetodoPago;
          estado?: EstadoPago;
          comprobante?: string | null;
          confirmado_por?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reserva_id?: string;
          tipo?: TipoPago;
          monto?: number;
          metodo?: MetodoPago;
          estado?: EstadoPago;
          comprobante?: string | null;
          confirmado_por?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      crear_reserva: {
        Args: {
          p_viaje_id: string;
          p_recogida_label?: string | null;
          p_recogida_lat?: number | null;
          p_recogida_lng?: number | null;
          p_recogida_place_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["reserva"]["Row"];
      };
      actualizar_parada: {
        Args: {
          p_parada_id: string;
          p_nombre: string;
          p_ciudad: string;
          p_lat: number;
          p_lng: number;
        };
        Returns: Json;
      };
      crear_parada_intermedia: {
        Args: {
          p_ruta_id: string;
          p_nombre: string;
          p_ciudad: string;
          p_lat: number;
          p_lng: number;
          p_orden?: number | null;
        };
        Returns: Json;
      };
      eliminar_parada_intermedia: {
        Args: { p_parada_id: string };
        Returns: Json;
      };
      reordenar_paradas_ruta: {
        Args: { p_ruta_id: string; p_ids: string[] };
        Returns: Json;
      };
      asientos_libres_viaje: {
        Args: { p_viaje_id: string };
        Returns: number;
      };
      resolver_sena: {
        Args: { p_pago_id: string; p_accion: string };
        Returns: Json;
      };
      iniciar_recogida: {
        Args: { p_viaje_id: string };
        Returns: Database["public"]["Tables"]["viaje"]["Row"];
      };
      verificar_reserva_qr: {
        Args: { p_viaje_id: string; p_qr_token: string };
        Returns: Json;
      };
      registrar_saldo_y_abordar: {
        Args: { p_reserva_id: string; p_metodo: string };
        Returns: Json;
      };
      cancelar_reserva: {
        Args: { p_reserva_id: string };
        Returns: Json;
      };
      marcar_no_show: {
        Args: { p_reserva_id: string };
        Returns: Json;
      };
      completar_viaje: {
        Args: { p_viaje_id: string };
        Returns: Json;
      };
      cancelar_viaje: {
        Args: { p_viaje_id: string; p_motivo?: string };
        Returns: Json;
      };
      vencer_programados: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      marcar_devolucion_saldada: {
        Args: { p_reserva_id: string };
        Returns: Json;
      };
      crear_viaje: {
        Args: {
          p_ruta_id: string;
          p_conductor_id: string;
          p_vehiculo_id: string;
          p_fecha_salida: string;
          p_precio?: number | null;
          p_eta_llegada?: string | null;
        };
        Returns: Json;
      };
      crear_vehiculo: {
        Args: {
          p_conductor_id: string;
          p_patente: string;
          p_marca: string;
          p_modelo: string;
          p_color: string;
          p_capacidad: number;
        };
        Returns: Json;
      };
      crear_vehiculo_propio: {
        Args: {
          p_patente: string;
          p_marca: string;
          p_modelo: string;
          p_color: string;
          p_capacidad: number;
        };
        Returns: Json;
      };
      actualizar_vehiculo_propio: {
        Args: {
          p_vehiculo_id: string;
          p_patente: string;
          p_marca: string;
          p_modelo: string;
          p_color: string;
          p_capacidad: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      rol: Rol;
      estado_viaje: EstadoViaje;
      tipo_parada: TipoParada;
      estado_reserva: EstadoReserva;
      tipo_pago: TipoPago;
      metodo_pago: MetodoPago;
      estado_pago: EstadoPago;
    };
    CompositeTypes: Record<string, never>;
  };
};

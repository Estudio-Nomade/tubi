/**
 * Minimal Database stub aligned with supabase/migrations.
 * Replace with `supabase gen types typescript` once the project is linked.
 */

export type Rol = "pasajero" | "conductor" | "operador";

export type DriverKycStatus =
  | "unverified"
  | "pending_kyc"
  | "verified"
  | "rejected"
  | "suspended";


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

export type EstadoCuponUsuario =
  | "disponible"
  | "reservado"
  | "usado"
  | "vencido"
  | "anulado";

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
          is_passenger: boolean;
          is_driver: boolean;
          is_operator: boolean;
          driver_kyc_status: DriverKycStatus;
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
          is_passenger?: boolean;
          is_driver?: boolean;
          is_operator?: boolean;
          driver_kyc_status?: DriverKycStatus;
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
          is_passenger?: boolean;
          is_driver?: boolean;
          is_operator?: boolean;
          driver_kyc_status?: DriverKycStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      driver_kyc_sessions: {
        Row: {
          id: string;
          user_id: string;
          external_session_id: string;
          provider: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          external_session_id: string;
          provider?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          external_session_id?: string;
          provider?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_thread: {
        Row: {
          id: string;
          reserva_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reserva_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reserva_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_message: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          flagged_bypass: boolean;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
          flagged_bypass?: boolean;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
          flagged_bypass?: boolean;
        };
        Relationships: [];
      };
      push_subscription: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_outbox: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          href: string | null;
          created_at: string;
          sent_at: string | null;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          href?: string | null;
          created_at?: string;
          sent_at?: string | null;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          href?: string | null;
          created_at?: string;
          sent_at?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
      };
      commission_obligation: {
        Row: {
          id: string;
          reserva_id: string;
          viaje_id: string;
          conductor_id: string;
          price: number;
          seña: number;
          commission: number;
          settlement_driver_to_tubi: number;
          status: string;
          created_at: string;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          reserva_id: string;
          viaje_id: string;
          conductor_id: string;
          price: number;
          seña: number;
          commission: number;
          settlement_driver_to_tubi: number;
          status?: string;
          created_at?: string;
          settled_at?: string | null;
        };
        Update: {
          id?: string;
          reserva_id?: string;
          viaje_id?: string;
          conductor_id?: string;
          price?: number;
          seña?: number;
          commission?: number;
          settlement_driver_to_tubi?: number;
          status?: string;
          created_at?: string;
          settled_at?: string | null;
        };
        Relationships: [];
      };
      detective_signal: {
        Row: {
          id: string;
          kind: string;
          payload: Json;
          status: string;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          kind: string;
          payload?: Json;
          status?: string;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          kind?: string;
          payload?: Json;
          status?: string;
          created_at?: string;
          resolved_at?: string | null;
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
          offer_source: "peer" | "tubi_operated";
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
          offer_source?: "peer" | "tubi_operated";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ruta_id?: string;
          conductor_id?: string;
          vehiculo_id?: string;
          fecha_salida?: string;
          offer_source?: "peer" | "tubi_operated";
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
          cupon_usuario_id: string | null;
          descuento_monto: number;
          request_status: string | null;
          request_expires_at: string | null;
          accepted_at: string | null;
          deposit_pay_expires_at: string | null;
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
          cupon_usuario_id?: string | null;
          descuento_monto?: number;
          request_status?: string | null;
          request_expires_at?: string | null;
          accepted_at?: string | null;
          deposit_pay_expires_at?: string | null;
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
          cupon_usuario_id?: string | null;
          descuento_monto?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cupon_campania: {
        Row: {
          id: string;
          codigo: string;
          monto_descuento: number;
          cupos_totales: number | null;
          cupos_usados: number;
          vigencia_desde: string;
          vigencia_hasta: string;
          valido_dias_post_canje: number;
          max_por_usuario: number;
          ruta_id: string | null;
          activa: boolean;
          creada_por: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          monto_descuento: number;
          cupos_totales?: number | null;
          cupos_usados?: number;
          vigencia_desde: string;
          vigencia_hasta: string;
          valido_dias_post_canje?: number;
          max_por_usuario?: number;
          ruta_id?: string | null;
          activa?: boolean;
          creada_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          codigo?: string;
          monto_descuento?: number;
          cupos_totales?: number | null;
          cupos_usados?: number;
          vigencia_desde?: string;
          vigencia_hasta?: string;
          valido_dias_post_canje?: number;
          max_por_usuario?: number;
          ruta_id?: string | null;
          activa?: boolean;
          creada_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cupon_usuario: {
        Row: {
          id: string;
          campania_id: string;
          pasajero_id: string;
          estado: EstadoCuponUsuario;
          monto_descuento: number;
          reserva_id: string | null;
          canjeado_en: string;
          vence_en: string;
          usado_en: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campania_id: string;
          pasajero_id: string;
          estado?: EstadoCuponUsuario;
          monto_descuento: number;
          reserva_id?: string | null;
          canjeado_en?: string;
          vence_en: string;
          usado_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campania_id?: string;
          pasajero_id?: string;
          estado?: EstadoCuponUsuario;
          monto_descuento?: number;
          reserva_id?: string | null;
          canjeado_en?: string;
          vence_en?: string;
          usado_en?: string | null;
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
          p_cupon_usuario_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["reserva"]["Row"];
      };
      canjear_cupon: {
        Args: { p_codigo: string };
        Returns: Json;
      };
      crear_cupon_campania: {
        Args: {
          p_codigo: string;
          p_monto_descuento: number;
          p_cupos_totales?: number | null;
          p_vigencia_desde?: string;
          p_vigencia_hasta?: string;
          p_valido_dias_post_canje?: number;
          p_max_por_usuario?: number;
          p_ruta_id?: string | null;
        };
        Returns: Json;
      };
      set_cupon_campania_activa: {
        Args: { p_campania_id: string; p_activa: boolean };
        Returns: Json;
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
      solicitar_asiento: {
        Args: {
          p_viaje_id: string;
          p_recogida_label?: string | null;
          p_recogida_lat?: number | null;
          p_recogida_lng?: number | null;
          p_recogida_place_id?: string | null;
        };
        Returns: Json;
      };
      aceptar_solicitud: {
        Args: { p_reserva_id: string };
        Returns: Json;
      };
      rechazar_solicitud: {
        Args: { p_reserva_id: string };
        Returns: Json;
      };
      ensure_chat_thread: {
        Args: { p_reserva_id: string };
        Returns: string;
      };
      enviar_mensaje_chat: {
        Args: { p_thread_id: string; p_body: string };
        Returns: Json;
      };
      enqueue_notification: {
        Args: {
          p_user_id: string;
          p_title: string;
          p_body: string;
          p_href?: string | null;
        };
        Returns: string;
      };
      set_driver_kyc_pending: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      apply_driver_kyc_result: {
        Args: {
          p_user_id: string;
          p_status: string;
          p_dni_verificado?: boolean | null;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      vencer_solicitudes: {
        Args: Record<string, never>;
        Returns: Json;
      };
      search_viajes_places: {
        Args: {
          p_origen: string;
          p_destino: string;
          p_fecha_desde?: string;
          p_fecha_hasta?: string | null;
          p_limit?: number;
        };
        Returns: Database["public"]["Tables"]["viaje"]["Row"][];
      };
      resolve_detective_signal: {
        Args: { p_signal_id: string; p_status: string };
        Returns: Json;
      };
      compute_peer_commission: {
        Args: { p_precio: number };
        Returns: number;
      };
      driver_has_overdue_commission: {
        Args: { p_uid: string };
        Returns: boolean;
      };
      publicar_viaje_peer: {
        Args: {
          p_ruta_id: string;
          p_vehiculo_id: string;
          p_fecha_salida: string;
          p_precio: number;
          p_eta_llegada?: string | null;
        };
        Returns: Json;
      };
      driver_is_verified: {
        Args: { p_user_id: string };
        Returns: boolean;
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
      crear_perfil_operador: {
        Args: {
          p_nombre: string;
          p_apellido: string;
          p_telefono: string;
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

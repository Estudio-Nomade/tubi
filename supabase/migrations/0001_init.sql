-- 0001_init.sql
create extension if not exists pgcrypto;

create type rol            as enum ('pasajero', 'conductor', 'operador');
create type estado_viaje   as enum ('programado', 'recogida', 'en_curso', 'completado', 'cancelado');
create type estado_reserva as enum ('pendiente_sena', 'confirmada', 'verificada', 'abordada', 'cancelada', 'no_show');
create type tipo_pago      as enum ('sena', 'saldo');
create type metodo_pago    as enum ('efectivo', 'transferencia');
create type estado_pago    as enum ('pendiente', 'confirmado', 'rechazado');
create type tipo_parada    as enum ('origen', 'intermedio', 'destino');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol rol not null default 'pasajero',
  nombre text not null,
  apellido text not null,
  telefono text not null,
  dni text,
  dni_verificado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vehiculo (
  id uuid primary key default gen_random_uuid(),
  conductor_id uuid not null references profiles(id),
  patente text not null unique,
  marca text not null,
  modelo text not null,
  color text not null,
  capacidad int not null check (capacidad > 0),
  created_at timestamptz not null default now()
);

create table ruta (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  origen text not null,
  destino text not null,
  created_at timestamptz not null default now()
);

create table parada (
  id uuid primary key default gen_random_uuid(),
  ruta_id uuid not null references ruta(id) on delete cascade,
  nombre text not null,
  ciudad text not null,
  lat numeric not null,
  lng numeric not null,
  orden int not null,
  tipo tipo_parada not null default 'intermedio',
  unique (ruta_id, orden)
);

create table viaje (
  id uuid primary key default gen_random_uuid(),
  ruta_id uuid not null references ruta(id),
  conductor_id uuid not null references profiles(id),
  vehiculo_id uuid not null references vehiculo(id),
  fecha_salida timestamptz not null,
  eta_llegada timestamptz,
  precio numeric not null,
  estado estado_viaje not null default 'programado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reserva (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references viaje(id),
  pasajero_id uuid not null references profiles(id),
  asiento_num int,
  estado estado_reserva not null default 'pendiente_sena',
  monto_sena numeric not null,
  qr_token text not null unique,
  politica_cancelacion jsonb not null,
  cancelada_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pago (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reserva(id),
  tipo tipo_pago not null,
  monto numeric not null,
  metodo metodo_pago not null,
  estado estado_pago not null default 'pendiente',
  comprobante text,
  confirmado_por uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table tracking_events (
  id bigint generated always as identity primary key,
  client_id uuid not null,
  viaje_id uuid not null references viaje(id),
  lat numeric not null,
  lng numeric not null,
  precision_m numeric,
  ts timestamptz not null,
  sincronizado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id)
);

create table settings (
  clave text primary key,
  valor jsonb not null,
  tipo text not null default 'text',
  descripcion text,
  actualizado_por uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create index on viaje (estado);
create index on viaje (fecha_salida);
create index on viaje (ruta_id);
create index on reserva (viaje_id);
create index on reserva (pasajero_id);
create index on tracking_events (viaje_id, ts);
create index on parada (ruta_id, orden);
create index on pago (reserva_id);

-- RLS: activar en todas las tablas y crear políticas por rol (ver sección Seguridad).
alter table profiles enable row level security;
alter table vehiculo enable row level security;
alter table ruta enable row level security;
alter table parada enable row level security;
alter table viaje enable row level security;
alter table reserva enable row level security;
alter table pago enable row level security;
alter table tracking_events enable row level security;
alter table settings enable row level security;

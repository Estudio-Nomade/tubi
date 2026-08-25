-- 0015_slice7_cancelar_reserva.sql
-- Passenger cancel reservation (FR-17, RN-03). Records pending refund; no bank transfer.

alter table public.reserva
  add column if not exists monto_devolucion numeric,
  add column if not exists devolucion_pct numeric;

comment on column public.reserva.monto_devolucion is
  'Pending refund amount of sena (operator settles later). 0 if none.';
comment on column public.reserva.devolucion_pct is
  'Refund percentage applied at cancel time (from snapshot policy).';

create or replace function public.cancelar_reserva(p_reserva_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_reserva public.reserva%rowtype;
  v_viaje public.viaje%rowtype;
  v_politica jsonb;
  v_pct numeric := 0;
  v_monto numeric := 0;
  v_antelacion interval;
  v_hours numeric;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('pasajero', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_reserva
  from public.reserva
  where id = p_reserva_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_rol = 'pasajero' and v_reserva.pasajero_id <> v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_reserva.estado not in ('pendiente_sena', 'confirmada') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = v_reserva.viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  -- pendiente_sena: no refund (sena never confirmed)
  if v_reserva.estado = 'pendiente_sena' then
    v_pct := 0;
    v_monto := 0;
  else
    -- confirmada: RN-03 from snapshot on reserva
    v_politica := v_reserva.politica_cancelacion;
    if v_politica is null
       or v_politica->>'devolucion_24h_pct' is null
       or v_politica->>'devolucion_12_24h_pct' is null
       or v_politica->>'devolucion_menos_12h_pct' is null then
      raise exception 'RESERVA_POLITICA_INVALIDA' using errcode = 'P0001';
    end if;

    v_antelacion := v_viaje.fecha_salida - now();
    v_hours := extract(epoch from v_antelacion) / 3600.0;

    if v_hours > 24 then
      v_pct := (v_politica->>'devolucion_24h_pct')::numeric;
    elsif v_hours >= 12 then
      v_pct := (v_politica->>'devolucion_12_24h_pct')::numeric;
    else
      v_pct := (v_politica->>'devolucion_menos_12h_pct')::numeric;
    end if;

    if v_pct is null or v_pct < 0 then
      v_pct := 0;
    end if;

    v_monto := round(v_reserva.monto_sena * v_pct / 100.0, 2);
    if v_monto < 0 then
      v_monto := 0;
    end if;
  end if;

  update public.reserva
  set
    estado = 'cancelada',
    cancelada_en = now(),
    monto_devolucion = v_monto,
    devolucion_pct = v_pct,
    updated_at = now()
  where id = v_reserva.id
  returning * into v_reserva;

  return jsonb_build_object(
    'ok', true,
    'reserva_id', v_reserva.id,
    'viaje_id', v_viaje.id,
    'estado', v_reserva.estado,
    'devolucion_pct', v_pct,
    'monto_devolucion', v_monto,
    'cancelada_en', v_reserva.cancelada_en
  );
end;
$$;

revoke all on function public.cancelar_reserva(uuid) from public;
grant execute on function public.cancelar_reserva(uuid) to authenticated;

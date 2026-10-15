-- CRITICAL marketplace hardening (self-review 2026-10-15)
-- Additive only — safe with migration up (no reset). Preserves auth.users.

-- ─────────────────────────────────────────────────────────────
-- 1) GRANTs on marketplace tables (auto_expose off)
-- ─────────────────────────────────────────────────────────────
grant select, insert, update on table public.driver_kyc_sessions to authenticated;
grant select, insert on table public.chat_thread to authenticated;
grant select, insert on table public.chat_message to authenticated;
grant select, insert, update, delete on table public.push_subscription to authenticated;
grant select on table public.notification_outbox to authenticated;
grant select on table public.detective_signal to authenticated;
grant select on table public.commission_obligation to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2) Protect capability columns (no self-escalation KYC/operator)
-- ─────────────────────────────────────────────────────────────
create or replace function public.profiles_protect_capabilities()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    ''
  );
  v_allow text := coalesce(
    nullif(current_setting('tubi.allow_capability_write', true), ''),
    ''
  );
begin
  -- service_role (webhooks) and explicit RPC flag
  if v_jwt_role = 'service_role' or v_allow = '1' then
    return new;
  end if;

  -- operators may edit any profile capabilities
  if public.is_operador() then
    return new;
  end if;

  -- freeze privileged fields for normal user updates
  new.is_operator := old.is_operator;
  new.is_driver := old.is_driver;
  new.driver_kyc_status := old.driver_kyc_status;
  new.dni_verificado := old.dni_verificado;
  return new;
end;
$$;

drop trigger if exists trg_profiles_protect_capabilities on public.profiles;
create trigger trg_profiles_protect_capabilities
  before update on public.profiles
  for each row
  execute function public.profiles_protect_capabilities();

-- User starts KYC: only pending + aspirational is_driver
create or replace function public.set_driver_kyc_pending()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  perform set_config('tubi.allow_capability_write', '1', true);

  update public.profiles
  set
    is_driver = true,
    driver_kyc_status = 'pending_kyc',
    is_passenger = coalesce(is_passenger, true)
  where id = v_uid
  returning * into v_row;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;
  return v_row;
end;
$$;

revoke all on function public.set_driver_kyc_pending() from public;
grant execute on function public.set_driver_kyc_pending() to authenticated;

-- Service/webhook/operator applies final KYC status
create or replace function public.apply_driver_kyc_result(
  p_user_id uuid,
  p_status text,
  p_dni_verificado boolean default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    ''
  );
  v_row public.profiles%rowtype;
begin
  if v_jwt_role is distinct from 'service_role' and not public.is_operador() then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if p_status not in ('verified', 'rejected', 'pending_kyc', 'unverified') then
    raise exception 'ESTADO_INVALIDO' using errcode = 'P0001';
  end if;

  perform set_config('tubi.allow_capability_write', '1', true);

  update public.profiles
  set
    is_driver = case when p_status = 'verified' then true else is_driver end,
    driver_kyc_status = p_status,
    dni_verificado = coalesce(p_dni_verificado, dni_verificado)
  where id = p_user_id
  returning * into v_row;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;
  return v_row;
end;
$$;

revoke all on function public.apply_driver_kyc_result(uuid, text, boolean) from public;
grant execute on function public.apply_driver_kyc_result(uuid, text, boolean) to authenticated;
grant execute on function public.apply_driver_kyc_result(uuid, text, boolean) to service_role;

-- ─────────────────────────────────────────────────────────────
-- 3) Shared occupancy helper (request does not hold until accepted)
-- ─────────────────────────────────────────────────────────────
create or replace function public.reserva_ocupa_asiento(p_reserva public.reserva)
returns boolean
language sql
immutable
as $$
  select
    p_reserva.estado in ('pendiente_sena', 'confirmada', 'verificada', 'abordada')
    and (
      p_reserva.request_status is null
      or p_reserva.request_status = 'accepted'
    );
$$;

create or replace function public.asientos_libres_viaje(p_viaje_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    coalesce(
      (
        select v.capacidad
        from public.viaje j
        join public.vehiculo v on v.id = j.vehiculo_id
        where j.id = p_viaje_id
      ),
      0
    )
    - coalesce(
      (
        select count(*)::int
        from public.reserva r
        where r.viaje_id = p_viaje_id
          and public.reserva_ocupa_asiento(r)
      ),
      0
    )
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 4) Seña only after accept (or legacy null request_status)
-- ─────────────────────────────────────────────────────────────
drop policy if exists pago_insert_sena_own on public.pago;
create policy pago_insert_sena_own
  on public.pago
  for insert
  to authenticated
  with check (
    tipo = 'sena'
    and metodo = 'transferencia'
    and estado = 'pendiente'
    and exists (
      select 1 from public.reserva r
      where r.id = pago.reserva_id
        and r.pasajero_id = (select auth.uid())
        and r.estado = 'pendiente_sena'
        and (
          r.request_status is null
          or r.request_status = 'accepted'
        )
        and (
          r.deposit_pay_expires_at is null
          or r.deposit_pay_expires_at >= now()
        )
        and public.current_rol() in ('pasajero', 'operador')
    )
    and not public.reserva_tiene_sena_abierta(pago.reserva_id)
  );

create or replace function public.resolver_sena(p_pago_id uuid, p_accion text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_pago public.pago%rowtype;
  v_reserva public.reserva%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  if not (select public.is_operador()) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if p_accion not in ('confirmar', 'rechazar') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  select * into v_pago from public.pago where id = p_pago_id for update;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_pago.tipo <> 'sena' or v_pago.estado <> 'pendiente' then
    raise exception 'PAGO_NO_PENDIENTE' using errcode = 'P0001';
  end if;

  select * into v_reserva from public.reserva where id = v_pago.reserva_id for update;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_reserva.estado <> 'pendiente_sena' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  -- marketplace: must be accepted (or legacy)
  if v_reserva.request_status is not null
     and v_reserva.request_status is distinct from 'accepted' then
    raise exception 'SOLICITUD_NO_ACEPTADA' using errcode = 'P0001';
  end if;

  if v_reserva.deposit_pay_expires_at is not null
     and v_reserva.deposit_pay_expires_at < now() then
    raise exception 'SENA_VENCIDA' using errcode = 'P0001';
  end if;

  if p_accion = 'confirmar' then
    update public.pago
    set estado = 'confirmado', confirmado_por = v_uid
    where id = v_pago.id;

    update public.reserva
    set estado = 'confirmada', updated_at = now()
    where id = v_reserva.id;

    return jsonb_build_object(
      'pago_id', v_pago.id,
      'reserva_id', v_reserva.id,
      'pago_estado', 'confirmado',
      'reserva_estado', 'confirmada',
      'accion', 'confirmar'
    );
  end if;

  update public.pago
  set estado = 'rechazado', confirmado_por = v_uid
  where id = v_pago.id;

  return jsonb_build_object(
    'pago_id', v_pago.id,
    'reserva_id', v_reserva.id,
    'pago_estado', 'rechazado',
    'reserva_estado', v_reserva.estado,
    'accion', 'rechazar'
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5) crear_reserva: occupancy aligned + peer must use solicitar
-- ─────────────────────────────────────────────────────────────
create or replace function public.crear_reserva(
  p_viaje_id uuid,
  p_recogida_label text default null,
  p_recogida_lat numeric default null,
  p_recogida_lng numeric default null,
  p_recogida_place_id text default null,
  p_cupon_usuario_id uuid default null
)
returns public.reserva
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
  v_ruta public.ruta%rowtype;
  v_capacidad int;
  v_ocupados int;
  v_sena numeric;
  v_politica jsonb;
  v_token text;
  v_row public.reserva;
  v_label text := trim(coalesce(p_recogida_label, ''));
  v_lat numeric := p_recogida_lat;
  v_lng numeric := p_recogida_lng;
  v_place_id text := nullif(trim(coalesce(p_recogida_place_id, '')), '');
  v_mode text;
  v_parada_origen public.parada%rowtype;
  v_enabled text;
  v_cupon public.cupon_usuario%rowtype;
  v_camp public.cupon_campania%rowtype;
  v_descuento numeric := 0;
  v_cupon_id uuid := null;
  c_tandil_min_lat constant numeric := -37.7;
  c_tandil_max_lat constant numeric := -36.9;
  c_tandil_min_lng constant numeric := -59.8;
  c_tandil_max_lng constant numeric := -58.8;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('pasajero', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_viaje from public.viaje where id = p_viaje_id for update;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_viaje.estado <> 'programado' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  -- Peer marketplace: must use solicitar_asiento
  if coalesce(v_viaje.offer_source, 'tubi_operated') = 'peer' then
    raise exception 'USE_SOLICITAR_ASIENTO' using errcode = 'P0001';
  end if;

  if v_viaje.conductor_id = v_uid then
    raise exception 'SOLAPAMIENTO' using errcode = 'P0001';
  end if;

  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if lower(trim(coalesce(v_ruta.origen, ''))) = 'tandil' then
    v_mode := 'libre_tandil';
    if v_label = '' then
      raise exception 'RECOGIDA_REQUERIDA' using errcode = 'P0001';
    end if;
    if v_lat is null or v_lng is null
       or v_lat < -90 or v_lat > 90
       or v_lng < -180 or v_lng > 180 then
      raise exception 'RECOGIDA_INVALIDA' using errcode = 'P0001';
    end if;
    if v_lat < c_tandil_min_lat or v_lat > c_tandil_max_lat
       or v_lng < c_tandil_min_lng or v_lng > c_tandil_max_lng then
      raise exception 'RECOGIDA_FUERA_ZONA' using errcode = 'P0001';
    end if;
  else
    v_mode := 'fijo_ruta';
    select * into v_parada_origen
    from public.parada
    where ruta_id = v_ruta.id and tipo = 'origen'
    order by orden limit 1;
    if not found then
      raise exception 'PARADA_ORIGEN_MISSING' using errcode = 'P0001';
    end if;
    v_label := v_parada_origen.nombre;
    v_lat := v_parada_origen.lat;
    v_lng := v_parada_origen.lng;
    v_place_id := null;
  end if;

  select capacidad into v_capacidad from public.vehiculo where id = v_viaje.vehiculo_id;
  if v_capacidad is null then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  select count(*)::int into v_ocupados
  from public.reserva r
  where r.viaje_id = p_viaje_id
    and public.reserva_ocupa_asiento(r);

  if v_ocupados >= v_capacidad then
    raise exception 'RESERVA_SIN_ASIENTOS' using errcode = 'P0001';
  end if;

  select (valor #>> '{}')::numeric into v_sena
  from public.settings where clave = 'reserva.sena_monto';
  if v_sena is null then
    raise exception 'SETTING_MISSING:reserva.sena_monto' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'devolucion_24h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_24h_pct'),
    'devolucion_12_24h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_12_24h_pct'),
    'devolucion_menos_12h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_menos_12h_pct')
  ) into v_politica;

  if v_politica->>'devolucion_24h_pct' is null
     or v_politica->>'devolucion_12_24h_pct' is null
     or v_politica->>'devolucion_menos_12h_pct' is null then
    raise exception 'SETTING_MISSING:reserva.devolucion_*' using errcode = 'P0001';
  end if;

  if p_cupon_usuario_id is not null then
    select (valor #>> '{}') into v_enabled
    from public.settings where clave = 'cupones.enabled';
    if v_enabled is not null and lower(v_enabled) in ('false', '0', 'no') then
      raise exception 'CUPONES_DESHABILITADOS' using errcode = 'P0001';
    end if;

    select * into v_cupon from public.cupon_usuario where id = p_cupon_usuario_id for update;
    if not found
       or v_cupon.pasajero_id is distinct from v_uid
       or v_cupon.estado is distinct from 'disponible' then
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;
    if v_cupon.vence_en < now() then
      update public.cupon_usuario set estado = 'vencido', updated_at = now() where id = v_cupon.id;
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;
    select * into v_camp from public.cupon_campania where id = v_cupon.campania_id for update;
    if not found or not v_camp.activa then
      raise exception 'CUPON_NO_DISPONIBLE' using errcode = 'P0001';
    end if;
    if v_camp.ruta_id is not null and v_camp.ruta_id is distinct from v_viaje.ruta_id then
      raise exception 'CUPON_RUTA_INVALIDA' using errcode = 'P0001';
    end if;
    v_descuento := v_cupon.monto_descuento;
    v_cupon_id := v_cupon.id;
  end if;

  v_token := 'opq_' || encode(gen_random_bytes(16), 'hex');

  insert into public.reserva (
    viaje_id, pasajero_id, asiento_num, estado, monto_sena, qr_token,
    politica_cancelacion, recogida_label, recogida_lat, recogida_lng,
    recogida_place_id, recogida_mode, cupon_usuario_id, descuento_monto,
    request_status
  ) values (
    p_viaje_id, v_uid, null, 'pendiente_sena', v_sena, v_token,
    v_politica, v_label, v_lat, v_lng, v_place_id, v_mode, v_cupon_id, v_descuento,
    null
  )
  returning * into v_row;

  if v_cupon_id is not null then
    update public.cupon_usuario
    set estado = 'reservado', reserva_id = v_row.id, updated_at = now()
    where id = v_cupon_id;
  end if;

  return v_row;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6) enqueue_notification: only self (system RPCs insert directly)
-- ─────────────────────────────────────────────────────────────
create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_href text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    ''
  );
  v_id uuid;
begin
  if v_jwt_role is distinct from 'service_role' then
    if v_uid is null then
      raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
    end if;
    -- callers may only enqueue for themselves unless service_role
    if p_user_id is distinct from v_uid then
      raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
    end if;
  end if;

  insert into public.notification_outbox (user_id, title, body, href)
  values (p_user_id, p_title, p_body, p_href)
  returning id into v_id;
  return v_id;
end;
$$;

-- Internal helper for security definer trip RPCs
create or replace function public._enqueue_notification_internal(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_href text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_outbox (user_id, title, body, href)
  values (p_user_id, p_title, p_body, p_href);
exception when others then
  null; -- non-fatal
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 7) aceptar_solicitud: reject leftover when full + notify internal
-- ─────────────────────────────────────────────────────────────
create or replace function public.aceptar_solicitud(p_reserva_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_res public.reserva%rowtype;
  v_viaje public.viaje%rowtype;
  v_pay_timeout int;
  v_pay_exp timestamptz;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select * into v_res from public.reserva where id = p_reserva_id for update;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  select * into v_viaje from public.viaje where id = v_res.viaje_id for update;
  if v_viaje.conductor_id is distinct from v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_res.request_status is distinct from 'requested' then
    raise exception 'ESTADO_INVALIDO' using errcode = 'P0001';
  end if;

  if v_res.request_expires_at is not null and v_res.request_expires_at < now() then
    update public.reserva
      set request_status = 'expired', estado = 'cancelada', cancelada_en = now(), updated_at = now()
      where id = p_reserva_id;
    raise exception 'SOLICITUD_VENCIDA' using errcode = 'P0001';
  end if;

  if public.asientos_libres_viaje(v_viaje.id) <= 0 then
    raise exception 'SIN_CUPOS' using errcode = 'P0001';
  end if;

  begin
    select coalesce((valor #>> '{}')::int, 60) into v_pay_timeout
    from public.settings where clave = 'deposit.pay_timeout_minutes';
  exception when others then
    v_pay_timeout := 60;
  end;
  if v_pay_timeout is null then v_pay_timeout := 60; end if;
  v_pay_exp := now() + make_interval(mins => greatest(v_pay_timeout, 5));

  update public.reserva set
    request_status = 'accepted',
    accepted_at = now(),
    deposit_pay_expires_at = v_pay_exp,
    updated_at = now()
  where id = p_reserva_id;

  -- if now full, reject remaining requests on this trip
  if public.asientos_libres_viaje(v_viaje.id) <= 0 then
    update public.reserva r
    set
      request_status = 'rejected',
      estado = 'cancelada',
      cancelada_en = now(),
      updated_at = now()
    where r.viaje_id = v_viaje.id
      and r.id is distinct from p_reserva_id
      and r.request_status = 'requested'
      and r.estado = 'pendiente_sena';
  end if;

  perform public._enqueue_notification_internal(
    v_res.pasajero_id,
    'Te aceptaron',
    'Pagá la seña para confirmar tu lugar',
    '/pasajero/reservas/' || p_reserva_id::text || '/sena'
  );

  return jsonb_build_object(
    'id', p_reserva_id,
    'request_status', 'accepted',
    'deposit_pay_expires_at', v_pay_exp
  );
end;
$$;

create or replace function public.rechazar_solicitud(p_reserva_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_res public.reserva%rowtype;
  v_viaje public.viaje%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select * into v_res from public.reserva where id = p_reserva_id for update;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  select * into v_viaje from public.viaje where id = v_res.viaje_id;
  if v_viaje.conductor_id is distinct from v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_res.request_status is distinct from 'requested' then
    raise exception 'ESTADO_INVALIDO' using errcode = 'P0001';
  end if;

  update public.reserva set
    request_status = 'rejected',
    estado = 'cancelada',
    cancelada_en = now(),
    updated_at = now()
  where id = p_reserva_id;

  perform public._enqueue_notification_internal(
    v_res.pasajero_id,
    'Solicitud rechazada',
    'El conductor no pudo aceptarte en este viaje',
    '/pasajero'
  );

  return jsonb_build_object('id', p_reserva_id, 'request_status', 'rejected');
end;
$$;

-- Patch solicitar to notify driver internally
create or replace function public.solicitar_asiento(
  p_viaje_id uuid,
  p_recogida_label text default null,
  p_recogida_lat numeric default null,
  p_recogida_lng numeric default null,
  p_recogida_place_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_viaje public.viaje%rowtype;
  v_ruta public.ruta%rowtype;
  v_sena numeric;
  v_timeout int;
  v_token text;
  v_id uuid;
  v_expires timestamptz;
  v_politica jsonb;
  v_label text := trim(coalesce(p_recogida_label, ''));
  v_lat numeric := p_recogida_lat;
  v_lng numeric := p_recogida_lng;
  v_place_id text := nullif(trim(coalesce(p_recogida_place_id, '')), '');
  v_mode text;
  v_parada_origen public.parada%rowtype;
  c_tandil_min_lat constant numeric := -37.7;
  c_tandil_max_lat constant numeric := -36.9;
  c_tandil_min_lng constant numeric := -59.8;
  c_tandil_max_lng constant numeric := -58.8;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_uid and (is_passenger or rol in ('pasajero', 'operador'))
  ) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_viaje from public.viaje where id = p_viaje_id for update;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;
  if v_viaje.estado <> 'programado' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;
  if v_viaje.conductor_id = v_uid then
    raise exception 'SOLAPAMIENTO' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.reserva r
    where r.viaje_id = p_viaje_id
      and r.pasajero_id = v_uid
      and r.request_status in ('requested', 'accepted')
      and r.estado not in ('cancelada', 'no_show')
  ) then
    raise exception 'YA_SOLICITADO' using errcode = 'P0001';
  end if;

  if public.asientos_libres_viaje(p_viaje_id) <= 0 then
    raise exception 'RESERVA_SIN_ASIENTOS' using errcode = 'P0001';
  end if;

  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if lower(trim(coalesce(v_ruta.origen, ''))) = 'tandil' then
    v_mode := 'libre_tandil';
    if v_label = '' then
      raise exception 'RECOGIDA_REQUERIDA' using errcode = 'P0001';
    end if;
    if v_lat is null or v_lng is null
       or v_lat < -90 or v_lat > 90
       or v_lng < -180 or v_lng > 180 then
      raise exception 'RECOGIDA_INVALIDA' using errcode = 'P0001';
    end if;
    if v_lat < c_tandil_min_lat or v_lat > c_tandil_max_lat
       or v_lng < c_tandil_min_lng or v_lng > c_tandil_max_lng then
      raise exception 'RECOGIDA_FUERA_ZONA' using errcode = 'P0001';
    end if;
  else
    v_mode := 'fijo_ruta';
    select * into v_parada_origen
    from public.parada
    where ruta_id = v_ruta.id and tipo = 'origen'
    order by orden limit 1;
    if not found then
      raise exception 'PARADA_ORIGEN_MISSING' using errcode = 'P0001';
    end if;
    v_label := v_parada_origen.nombre;
    v_lat := v_parada_origen.lat;
    v_lng := v_parada_origen.lng;
    v_place_id := null;
  end if;

  v_sena := public.compute_sena_monto(v_viaje.precio);

  select jsonb_build_object(
    'devolucion_24h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_24h_pct'),
    'devolucion_12_24h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_12_24h_pct'),
    'devolucion_menos_12h_pct',
      (select (valor #>> '{}')::numeric from public.settings where clave = 'reserva.devolucion_menos_12h_pct')
  ) into v_politica;

  if v_politica->>'devolucion_24h_pct' is null
     or v_politica->>'devolucion_12_24h_pct' is null
     or v_politica->>'devolucion_menos_12h_pct' is null then
    raise exception 'SETTING_MISSING:reserva.devolucion_*' using errcode = 'P0001';
  end if;

  begin
    select coalesce((valor #>> '{}')::int, 180) into v_timeout
    from public.settings where clave = 'request.accept_timeout_minutes';
  exception when others then
    v_timeout := 180;
  end;
  if v_timeout is null then v_timeout := 180; end if;

  v_expires := now() + make_interval(mins => greatest(v_timeout, 5));
  v_token := 'opq_' || encode(gen_random_bytes(16), 'hex');

  insert into public.reserva (
    viaje_id, pasajero_id, asiento_num, estado, monto_sena, qr_token,
    politica_cancelacion, recogida_label, recogida_lat, recogida_lng,
    recogida_place_id, recogida_mode, request_status, request_expires_at
  ) values (
    p_viaje_id, v_uid, null, 'pendiente_sena', v_sena, v_token,
    v_politica, nullif(v_label, ''), v_lat, v_lng, v_place_id, v_mode,
    'requested', v_expires
  )
  returning id into v_id;

  if v_viaje.conductor_id is not null then
    perform public._enqueue_notification_internal(
      v_viaje.conductor_id,
      'Nueva solicitud',
      'Alguien pidió un asiento en tu viaje',
      '/conductor/solicitudes'
    );
  end if;

  return jsonb_build_object(
    'id', v_id,
    'request_status', 'requested',
    'request_expires_at', v_expires,
    'monto_sena', v_sena
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 8) Commission: drop accept trigger; open on complete; waive cancel
-- ─────────────────────────────────────────────────────────────
drop trigger if exists trg_open_commission_on_accept on public.reserva;
drop function if exists public.open_commission_on_accept();

-- Waive open obligations when reservation leaves hold without board
create or replace function public.waive_commission_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado in ('cancelada', 'no_show')
     and old.estado is distinct from new.estado then
    update public.commission_obligation
    set status = 'waived', settled_at = now()
    where reserva_id = new.id
      and status in ('open', 'overdue');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_waive_commission_on_cancel on public.reserva;
create trigger trg_waive_commission_on_cancel
  after update of estado on public.reserva
  for each row
  execute function public.waive_commission_on_cancel();

create or replace function public.completar_viaje(p_viaje_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
  v_pending int;
  v_ruta public.ruta%rowtype;
  r record;
  v_c numeric;
  v_settle numeric;
  v_on_noshow boolean := false;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is null or v_rol not in ('conductor', 'operador') then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_viaje from public.viaje where id = p_viaje_id for update;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_rol = 'conductor' and v_viaje.conductor_id <> v_uid then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_viaje.estado <> 'en_curso' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  select count(*)::int into v_pending
  from public.reserva r
  where r.viaje_id = v_viaje.id
    and r.estado in ('confirmada', 'verificada');

  if v_pending > 0 then
    raise exception 'PENDIENTES_ACTIVOS' using errcode = 'P0001';
  end if;

  -- dangling pending sena / bare requests → cancel
  update public.reserva
  set
    estado = 'cancelada',
    request_status = case
      when request_status = 'requested' then 'expired'
      when request_status = 'accepted' then 'cancelled'
      else request_status
    end,
    cancelada_en = coalesce(cancelada_en, now()),
    updated_at = now()
  where viaje_id = v_viaje.id
    and estado = 'pendiente_sena';

  update public.viaje
  set estado = 'completado', updated_at = now()
  where id = v_viaje.id;

  -- Peer commission only for boarded seats
  if coalesce(v_viaje.offer_source, 'tubi_operated') = 'peer' then
    begin
      select coalesce((valor #>> '{}')::boolean, false) into v_on_noshow
      from public.settings where clave = 'commission.on_noshow';
    exception when others then
      v_on_noshow := false;
    end;

    for r in
      select *
      from public.reserva
      where viaje_id = v_viaje.id
        and (
          estado = 'abordada'
          or (v_on_noshow and estado = 'no_show')
        )
    loop
      v_c := public.compute_peer_commission(v_viaje.precio);
      v_settle := round(v_c - r.monto_sena, 2);
      insert into public.commission_obligation (
        reserva_id, viaje_id, conductor_id, price, seña, commission,
        settlement_driver_to_tubi, status
      ) values (
        r.id, v_viaje.id, v_viaje.conductor_id, v_viaje.precio, r.monto_sena,
        v_c, v_settle, 'open'
      )
      on conflict (reserva_id) do nothing;
    end loop;
  end if;

  select * into v_ruta from public.ruta where id = v_viaje.ruta_id;

  return jsonb_build_object(
    'ok', true,
    'viaje_id', v_viaje.id,
    'estado', 'completado',
    'origen', coalesce(v_ruta.origen, ''),
    'destino', coalesce(v_ruta.destino, '')
  );
end;
$$;

-- Overdue: only obligations older than 7d still open after trip complete context
create or replace function public.driver_has_overdue_commission(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.commission_obligation
    where conductor_id = p_uid
      and status = 'overdue'
  )
  or exists (
    select 1 from public.commission_obligation co
    join public.viaje v on v.id = co.viaje_id
    where co.conductor_id = p_uid
      and co.status = 'open'
      and v.estado = 'completado'
      and co.created_at < now() - interval '7 days'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 9) Expire stale requests / unpaid accepted holds
-- ─────────────────────────────────────────────────────────────
create or replace function public.vencer_solicitudes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req int := 0;
  v_dep int := 0;
begin
  update public.reserva
  set
    request_status = 'expired',
    estado = 'cancelada',
    cancelada_en = now(),
    updated_at = now()
  where request_status = 'requested'
    and estado = 'pendiente_sena'
    and request_expires_at is not null
    and request_expires_at < now();
  get diagnostics v_req = row_count;

  update public.reserva
  set
    request_status = 'cancelled',
    estado = 'cancelada',
    cancelada_en = now(),
    updated_at = now()
  where request_status = 'accepted'
    and estado = 'pendiente_sena'
    and deposit_pay_expires_at is not null
    and deposit_pay_expires_at < now();
  get diagnostics v_dep = row_count;

  return jsonb_build_object(
    'expired_requests', v_req,
    'expired_deposits', v_dep
  );
end;
$$;

revoke all on function public.vencer_solicitudes() from public;
grant execute on function public.vencer_solicitudes() to authenticated;
grant execute on function public.vencer_solicitudes() to service_role;

create index if not exists reserva_request_status_viaje_idx
  on public.reserva (viaje_id, request_status)
  where request_status is not null;

create index if not exists reserva_request_expires_idx
  on public.reserva (request_expires_at)
  where request_status = 'requested';

create index if not exists reserva_deposit_expires_idx
  on public.reserva (deposit_pay_expires_at)
  where request_status = 'accepted' and estado = 'pendiente_sena';

create index if not exists detective_signal_open_idx
  on public.detective_signal (created_at desc)
  where status = 'open';

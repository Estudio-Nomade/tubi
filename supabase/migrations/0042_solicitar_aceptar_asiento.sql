-- Solicitud → aceptación (flujo marketplace peer)
-- request no quema cupo; accept sí.
-- Chat thread se abre post-seña confirmada.

-- Capacity: only accepted/legacy holdings count (not bare requests)
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
          and r.estado in (
            'pendiente_sena',
            'confirmada',
            'verificada',
            'abordada'
          )
          and (
            r.request_status is null
            or r.request_status = 'accepted'
          )
      ),
      0
    )
  );
$$;

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

  -- soft capacity gate (accepted seats only)
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
    viaje_id,
    pasajero_id,
    asiento_num,
    estado,
    monto_sena,
    qr_token,
    politica_cancelacion,
    recogida_label,
    recogida_lat,
    recogida_lng,
    recogida_place_id,
    recogida_mode,
    request_status,
    request_expires_at
  ) values (
    p_viaje_id,
    v_uid,
    null,
    'pendiente_sena',
    v_sena,
    v_token,
    v_politica,
    nullif(v_label, ''),
    v_lat,
    v_lng,
    v_place_id,
    v_mode,
    'requested',
    v_expires
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'request_status', 'requested',
    'request_expires_at', v_expires,
    'monto_sena', v_sena
  );
end;
$$;

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

  return jsonb_build_object('id', p_reserva_id, 'request_status', 'rejected');
end;
$$;

create or replace function public.ensure_chat_thread(p_reserva_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_res public.reserva%rowtype;
  v_tid uuid;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select * into v_res from public.reserva where id = p_reserva_id;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_res.estado not in ('confirmada', 'verificada', 'abordada') then
    raise exception 'CHAT_NO_DISPONIBLE' using errcode = 'P0001';
  end if;

  if not public.user_in_reserva_chat(p_reserva_id, v_uid) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select id into v_tid from public.chat_thread where reserva_id = p_reserva_id;
  if v_tid is null then
    insert into public.chat_thread (reserva_id)
    values (p_reserva_id)
    returning id into v_tid;
  end if;

  return v_tid;
end;
$$;

create or replace function public.enviar_mensaje_chat(
  p_thread_id uuid,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_thread public.chat_thread%rowtype;
  v_body text := trim(coalesce(p_body, ''));
  v_flag boolean := false;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if length(v_body) < 1 or length(v_body) > 2000 then
    raise exception 'MENSAJE_INVALIDO' using errcode = 'P0001';
  end if;

  select * into v_thread from public.chat_thread where id = p_thread_id;
  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;
  if not public.user_in_reserva_chat(v_thread.reserva_id, v_uid) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  if v_body ~* 'whats\s*app|wsp|watsap|telegram|pasame.*(numero|cel|n[uú]mero)'
     or v_body ~ '[0-9][0-9\s\-\.]{7,}[0-9]' then
    v_flag := true;
  end if;

  insert into public.chat_message (thread_id, sender_id, body, flagged_bypass)
  values (p_thread_id, v_uid, v_body, v_flag)
  returning id into v_id;

  if v_flag then
    insert into public.detective_signal (kind, payload)
    values (
      'bypass_chat',
      jsonb_build_object(
        'thread_id', p_thread_id,
        'message_id', v_id,
        'user_id', v_uid,
        'reserva_id', v_thread.reserva_id
      )
    );
  end if;

  return jsonb_build_object('id', v_id, 'flagged_bypass', v_flag);
end;
$$;

-- Notify other users (security definer bypasses RLS on outbox)
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
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  insert into public.notification_outbox (user_id, title, body, href)
  values (p_user_id, p_title, p_body, p_href)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.solicitar_asiento(uuid, text, numeric, numeric, text) to authenticated;
grant execute on function public.aceptar_solicitud(uuid) to authenticated;
grant execute on function public.rechazar_solicitud(uuid) to authenticated;
grant execute on function public.ensure_chat_thread(uuid) to authenticated;
grant execute on function public.enviar_mensaje_chat(uuid, text) to authenticated;
grant execute on function public.enqueue_notification(uuid, text, text, text) to authenticated;

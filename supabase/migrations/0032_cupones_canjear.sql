-- 0032_cupones_canjear.sql
-- canjear_cupon + operador campaign RPCs + seed TUBI1

create or replace function public.canjear_cupon(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_enabled text;
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
  v_camp public.cupon_campania%rowtype;
  v_count int;
  v_id uuid;
  v_vence timestamptz;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'pasajero' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select (valor #>> '{}') into v_enabled
  from public.settings where clave = 'cupones.enabled';
  if v_enabled is not null and lower(v_enabled) in ('false', '0', 'no') then
    raise exception 'CUPONES_DESHABILITADOS' using errcode = 'P0001';
  end if;

  if v_codigo = '' then
    raise exception 'CUPON_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  perform public.cupon_expire_disponibles(v_uid);

  select * into v_camp
  from public.cupon_campania
  where upper(trim(codigo)) = v_codigo
  for update;

  if not found then
    raise exception 'CUPON_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if not v_camp.activa then
    raise exception 'CUPON_INACTIVO' using errcode = 'P0001';
  end if;

  if now() < v_camp.vigencia_desde or now() > v_camp.vigencia_hasta then
    raise exception 'CUPON_VENCIDO_CAMPANIA' using errcode = 'P0001';
  end if;

  if v_camp.cupos_totales is not null
     and v_camp.cupos_usados >= v_camp.cupos_totales then
    raise exception 'CUPON_SIN_CUPOS' using errcode = 'P0001';
  end if;

  select count(*)::int into v_count
  from public.cupon_usuario
  where campania_id = v_camp.id
    and pasajero_id = v_uid
    and estado in ('disponible', 'reservado', 'usado');

  if v_count >= v_camp.max_por_usuario then
    raise exception 'CUPON_YA_CANJEADO' using errcode = 'P0001';
  end if;

  v_vence := now() + make_interval(days => v_camp.valido_dias_post_canje);

  insert into public.cupon_usuario (
    campania_id, pasajero_id, estado, monto_descuento, vence_en
  ) values (
    v_camp.id, v_uid, 'disponible', v_camp.monto_descuento, v_vence
  )
  returning id into v_id;

  update public.cupon_campania
  set cupos_usados = cupos_usados + 1, updated_at = now()
  where id = v_camp.id;

  return jsonb_build_object(
    'ok', true,
    'cupon_usuario_id', v_id,
    'monto_descuento', v_camp.monto_descuento,
    'vence_en', v_vence,
    'codigo', v_camp.codigo
  );
end;
$$;

revoke all on function public.canjear_cupon(text) from public;
grant execute on function public.canjear_cupon(text) to authenticated;

-- Operador: crear campaña
create or replace function public.crear_cupon_campania(
  p_codigo text,
  p_monto_descuento numeric,
  p_cupos_totales int default null,
  p_vigencia_desde timestamptz default now(),
  p_vigencia_hasta timestamptz default (now() + interval '30 days'),
  p_valido_dias_post_canje int default 14,
  p_max_por_usuario int default 1,
  p_ruta_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if not (select public.is_operador()) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;
  if v_codigo = '' or p_monto_descuento is null or p_monto_descuento <= 0 then
    raise exception 'CUPON_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  insert into public.cupon_campania (
    codigo, monto_descuento, cupos_totales,
    vigencia_desde, vigencia_hasta, valido_dias_post_canje,
    max_por_usuario, ruta_id, creada_por
  ) values (
    v_codigo, p_monto_descuento, p_cupos_totales,
    p_vigencia_desde, p_vigencia_hasta, p_valido_dias_post_canje,
    coalesce(p_max_por_usuario, 1), p_ruta_id, v_uid
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'codigo', v_codigo);
end;
$$;

revoke all on function public.crear_cupon_campania(
  text, numeric, int, timestamptz, timestamptz, int, int, uuid
) from public;
grant execute on function public.crear_cupon_campania(
  text, numeric, int, timestamptz, timestamptz, int, int, uuid
) to authenticated;

create or replace function public.set_cupon_campania_activa(
  p_campania_id uuid,
  p_activa boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;
  if not (select public.is_operador()) then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  update public.cupon_campania
  set activa = p_activa, updated_at = now()
  where id = p_campania_id;

  if not found then
    raise exception 'CUPON_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  return jsonb_build_object('ok', true, 'id', p_campania_id, 'activa', p_activa);
end;
$$;

revoke all on function public.set_cupon_campania_activa(uuid, boolean) from public;
grant execute on function public.set_cupon_campania_activa(uuid, boolean) to authenticated;

-- Seed local TUBI1 (idempotent) — 15 cupos, 14 días post-canje, cualquier ruta
insert into public.cupon_campania (
  codigo, monto_descuento, cupos_totales, cupos_usados,
  vigencia_desde, vigencia_hasta, valido_dias_post_canje, max_por_usuario, activa
)
select 'TUBI1', 5000, 15, 0,
  now() - interval '1 day', now() + interval '60 days', 14, 1, true
where not exists (
  select 1 from public.cupon_campania where upper(trim(codigo)) = 'TUBI1'
);

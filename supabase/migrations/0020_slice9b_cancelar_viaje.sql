-- 0020_slice9b_cancelar_viaje.sql
-- Operator cancels trip (RN-CANCEL): open reservas → cancelada + 100% sena refund if confirmed.

create or replace function public.cancelar_viaje(
  p_viaje_id uuid,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_viaje public.viaje%rowtype;
  r public.reserva%rowtype;
  v_count int := 0;
  v_refund_total numeric := 0;
  v_sena_ok boolean;
  v_monto numeric;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'operador' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_viaje
  from public.viaje
  where id = p_viaje_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_viaje.estado not in ('programado', 'recogida', 'en_curso') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  for r in
    select *
    from public.reserva
    where viaje_id = v_viaje.id
      and estado in ('pendiente_sena', 'confirmada', 'verificada')
    for update
  loop
    v_monto := 0;
    if r.estado in ('confirmada', 'verificada') then
      select exists (
        select 1
        from public.pago p
        where p.reserva_id = r.id
          and p.tipo = 'sena'
          and p.estado = 'confirmado'
      ) into v_sena_ok;
      if v_sena_ok then
        v_monto := r.monto_sena;
      end if;
    end if;

    update public.reserva
    set
      estado = 'cancelada',
      cancelada_en = now(),
      monto_devolucion = v_monto,
      devolucion_pct = case when v_monto > 0 then 100 else 0 end,
      updated_at = now()
    where id = r.id;

    v_count := v_count + 1;
    v_refund_total := v_refund_total + coalesce(v_monto, 0);
  end loop;

  update public.viaje
  set estado = 'cancelado', updated_at = now()
  where id = v_viaje.id;

  return jsonb_build_object(
    'ok', true,
    'viaje_id', v_viaje.id,
    'estado', 'cancelado',
    'reservas_canceladas', v_count,
    'monto_devolucion_total', v_refund_total,
    'motivo', p_motivo
  );
end;
$$;

revoke all on function public.cancelar_viaje(uuid, text) from public;
grant execute on function public.cancelar_viaje(uuid, text) to authenticated;

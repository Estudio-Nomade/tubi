-- 0021_slice9b_devolucion_marcada.sql
-- Operator marks out-of-band sena refund as paid.

alter table public.reserva
  add column if not exists devolucion_saldada_en timestamptz;

comment on column public.reserva.devolucion_saldada_en is
  'When operator marked sena refund as paid out-of-band. null = still pending if monto_devolucion > 0.';

create or replace function public.marcar_devolucion_saldada(p_reserva_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_r public.reserva%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'operador' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_r
  from public.reserva
  where id = p_reserva_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if coalesce(v_r.monto_devolucion, 0) <= 0 then
    raise exception 'SIN_DEVOLUCION' using errcode = 'P0001';
  end if;

  if v_r.devolucion_saldada_en is not null then
    raise exception 'YA_SALDADA' using errcode = 'P0001';
  end if;

  update public.reserva
  set devolucion_saldada_en = now(), updated_at = now()
  where id = p_reserva_id;

  return jsonb_build_object(
    'ok', true,
    'reserva_id', p_reserva_id,
    'saldada_en', now()
  );
end;
$$;

revoke all on function public.marcar_devolucion_saldada(uuid) from public;
grant execute on function public.marcar_devolucion_saldada(uuid) to authenticated;

-- 0011_slice3_resolver_sena.sql
-- Operator confirms/rejects sena payment (RN-CONFIRMACION). Reject ≠ cancel reservation.

grant update on table public.pago to authenticated;
grant update on table public.reserva to authenticated;

drop policy if exists pago_update_operador on public.pago;
create policy pago_update_operador
  on public.pago
  for update
  to authenticated
  using ((select public.is_operador()))
  with check ((select public.is_operador()));

drop policy if exists reserva_update_operador on public.reserva;
create policy reserva_update_operador
  on public.reserva
  for update
  to authenticated
  using ((select public.is_operador()))
  with check ((select public.is_operador()));

-- Avoid RLS recursion: subquery on pago inside pago policies must be security definer.
create or replace function public.reserva_tiene_sena_abierta(p_reserva_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pago p
    where p.reserva_id = p_reserva_id
      and p.tipo = 'sena'
      and p.estado in ('pendiente', 'confirmado')
  );
$$;

revoke all on function public.reserva_tiene_sena_abierta(uuid) from public;
grant execute on function public.reserva_tiene_sena_abierta(uuid) to authenticated;

-- Allow passenger to insert a new sena after previous was rejected (no pending/confirmed sena).
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

  select * into v_pago
  from public.pago
  where id = p_pago_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_pago.tipo <> 'sena' or v_pago.estado <> 'pendiente' then
    raise exception 'PAGO_NO_PENDIENTE' using errcode = 'P0001';
  end if;

  select * into v_reserva
  from public.reserva
  where id = v_pago.reserva_id
  for update;

  if not found then
    raise exception 'NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if v_reserva.estado <> 'pendiente_sena' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  if p_accion = 'confirmar' then
    update public.pago
    set
      estado = 'confirmado',
      confirmado_por = v_uid
    where id = v_pago.id;

    update public.reserva
    set
      estado = 'confirmada',
      updated_at = now()
    where id = v_reserva.id;

    return jsonb_build_object(
      'pago_id', v_pago.id,
      'reserva_id', v_reserva.id,
      'pago_estado', 'confirmado',
      'reserva_estado', 'confirmada',
      'accion', 'confirmar'
    );
  end if;

  -- rechazar seña: only payment; reservation stays pendiente_sena
  update public.pago
  set
    estado = 'rechazado',
    confirmado_por = v_uid
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

revoke all on function public.resolver_sena(uuid, text) from public;
grant execute on function public.resolver_sena(uuid, text) to authenticated;

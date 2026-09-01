-- 0027_vencer_programados.sql
-- Auto-cancel 'programado' trips whose departure already passed (no departure).
-- Mirrors cancelar_viaje refund logic: open reservas -> cancelada + seña refund.

create or replace function public.vencer_programados()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viaje record;
  r record;
  v_count int := 0;
  v_monto numeric;
  v_sena_ok boolean;
begin
  for v_viaje in
    select id
    from public.viaje
    where estado = 'programado'
      and fecha_salida < now()
    for update
  loop
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
    end loop;

    update public.viaje
    set estado = 'cancelado', updated_at = now()
    where id = v_viaje.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.vencer_programados() from public;
grant execute on function public.vencer_programados() to authenticated;
grant execute on function public.vencer_programados() to service_role;

-- One-time cleanup of already-expired programado trips.
select public.vencer_programados();

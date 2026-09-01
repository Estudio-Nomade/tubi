-- 0026_fr09_actualizar_vehiculo_propio.sql
-- Conductor updates their own vehicle (FR-09 self-service edit).

create or replace function public.actualizar_vehiculo_propio(
  p_vehiculo_id uuid,
  p_patente text,
  p_marca text,
  p_modelo text,
  p_color text,
  p_capacidad int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rol rol;
  v_patente text;
  v_marca text;
  v_modelo text;
  v_color text;
  v_veh public.vehiculo%rowtype;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select rol into v_rol from public.profiles where id = v_uid;
  if v_rol is distinct from 'conductor' then
    raise exception 'NO_AUTORIZADO' using errcode = 'P0001';
  end if;

  select * into v_veh from public.vehiculo where id = p_vehiculo_id;
  if not found or v_veh.conductor_id is distinct from v_uid then
    raise exception 'VEHICULO_INVALIDO' using errcode = 'P0001';
  end if;

  v_patente := upper(btrim(p_patente));
  if v_patente is null or v_patente = '' then
    raise exception 'PATENTE_INVALIDA' using errcode = 'P0001';
  end if;

  if p_capacidad is null or p_capacidad <= 0 then
    raise exception 'CAPACIDAD_INVALIDA' using errcode = 'P0001';
  end if;

  v_marca := btrim(p_marca);
  v_modelo := btrim(p_modelo);
  v_color := btrim(p_color);
  if v_marca is null or v_marca = ''
     or v_modelo is null or v_modelo = ''
     or v_color is null or v_color = '' then
    raise exception 'DATOS_INVALIDOS' using errcode = 'P0001';
  end if;

  begin
    update public.vehiculo
    set patente = v_patente,
        marca = v_marca,
        modelo = v_modelo,
        color = v_color,
        capacidad = p_capacidad
    where id = p_vehiculo_id;
  exception
    when unique_violation then
      raise exception 'PATENTE_DUPLICADA' using errcode = 'P0001';
  end;

  return jsonb_build_object(
    'ok', true,
    'vehiculo_id', p_vehiculo_id,
    'conductor_id', v_uid,
    'patente', v_patente,
    'capacidad', p_capacidad
  );
end;
$$;

revoke all on function public.actualizar_vehiculo_propio(uuid, text, text, text, text, int) from public;
grant execute on function public.actualizar_vehiculo_propio(uuid, text, text, text, text, int) to authenticated;

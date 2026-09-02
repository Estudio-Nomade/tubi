-- 0030_auth_allow_operador_signup.sql
-- Self-service operator signup, gated by a business setting (AD-5).
-- The app can't INSERT rol = 'operador' directly (0006 profiles_insert_own blocks
-- it), so we expose a SECURITY DEFINER RPC that reads the setting and inserts.

insert into public.settings (clave, valor, tipo, descripcion)
values (
  'auth.allow_operador_signup',
  'true'::jsonb,
  'boolean',
  'Permite el alta self-service de cuentas de operador'
)
on conflict (clave) do update
set
  valor = excluded.valor,
  updated_at = now();

create or replace function public.crear_perfil_operador(
  p_nombre text,
  p_apellido text,
  p_telefono text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_allow boolean;
  v_nombre text;
  v_apellido text;
  v_telefono text;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO' using errcode = 'P0001';
  end if;

  select coalesce(valor = 'true'::jsonb, false) into v_allow
  from public.settings
  where clave = 'auth.allow_operador_signup';

  if v_allow is not true then
    raise exception 'REGISTRO_OPERADOR_DESHABILITADO' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'PERFIL_YA_EXISTE' using errcode = 'P0001';
  end if;

  v_nombre := btrim(p_nombre);
  v_apellido := btrim(p_apellido);
  v_telefono := btrim(p_telefono);
  if v_nombre is null or v_nombre = ''
     or v_apellido is null or v_apellido = ''
     or v_telefono is null or v_telefono = '' then
    raise exception 'DATOS_INVALIDOS' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, rol, nombre, apellido, telefono, dni)
  values (v_uid, 'operador', v_nombre, v_apellido, v_telefono, null);

  return jsonb_build_object('ok', true, 'id', v_uid);
end;
$$;

revoke all on function public.crear_perfil_operador(text, text, text) from public;
grant execute on function public.crear_perfil_operador(text, text, text) to authenticated;

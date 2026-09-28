-- 0035_cupones_helpers_revoke.sql
-- Helpers are security definer and must not be callable by clients.
-- Only other definer RPCs (cancelar_*, registrar_saldo_*, marcar_no_show) invoke them.

revoke all on function public.cupon_liberar_si_reservado(uuid) from public;
revoke all on function public.cupon_liberar_si_reservado(uuid) from authenticated;
revoke all on function public.cupon_liberar_si_reservado(uuid) from anon;

revoke all on function public.cupon_marcar_usado(uuid) from public;
revoke all on function public.cupon_marcar_usado(uuid) from authenticated;
revoke all on function public.cupon_marcar_usado(uuid) from anon;

revoke all on function public.cupon_expire_disponibles(uuid) from public;
revoke all on function public.cupon_expire_disponibles(uuid) from authenticated;
revoke all on function public.cupon_expire_disponibles(uuid) from anon;

-- Keep execute for postgres / superuser (migration owner) only — definer functions
-- still call them with owner rights regardless of grants to authenticated.

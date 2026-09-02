-- 0010_slice3_pago_sena.sql
-- Passenger sena payment: transfer settings, pago RLS, storage for comprobantes.

insert into public.settings (clave, valor, tipo, descripcion) values
  ('pagos.transferencia_banco',   '""', 'text', 'Banco cuenta seña'),
  ('pagos.transferencia_alias',   '""', 'text', 'Alias CBU/CVU seña'),
  ('pagos.transferencia_cbu',     '""', 'text', 'CBU/CVU seña'),
  ('pagos.transferencia_titular', '""', 'text', 'Titular cuenta seña')
on conflict (clave) do update
set valor = excluded.valor, updated_at = now();

grant select, insert on table public.pago to authenticated;

drop policy if exists pago_select_own on public.pago;
create policy pago_select_own
  on public.pago
  for select
  to authenticated
  using (
    exists (
      select 1 from public.reserva r
      where r.id = pago.reserva_id
        and (
          r.pasajero_id = (select auth.uid())
          or (select public.is_operador())
        )
    )
  );

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
  );

-- Private bucket for transfer receipts (path stored in pago.comprobante).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprobantes',
  'comprobantes',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists comprobantes_insert_own on storage.objects;
create policy comprobantes_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists comprobantes_select_own on storage.objects;
create policy comprobantes_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'comprobantes'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_operador())
    )
  );

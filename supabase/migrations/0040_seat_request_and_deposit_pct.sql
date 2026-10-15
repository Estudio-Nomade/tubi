-- Solicitud → aceptación + seña % del tramo (marketplace phase 3 foundation)
-- Extends reserva with request lifecycle; deposit.pct setting.

insert into public.settings (clave, valor, tipo, descripcion)
values
  (
    'deposit.pct',
    '0.2',
    'number',
    'Seña como fracción del precio del tramo aceptado (0–1)'
  ),
  (
    'request.accept_timeout_minutes',
    '180',
    'number',
    'Minutos para que el conductor acepte una solicitud'
  ),
  (
    'deposit.pay_timeout_minutes',
    '60',
    'number',
    'Minutos post-aceptación para pagar la seña'
  )
on conflict (clave) do nothing;

-- Request status on reserva (nullable for legacy rows treated as already accepted path)
alter table public.reserva
  add column if not exists request_status text;

alter table public.reserva
  drop constraint if exists reserva_request_status_check;

alter table public.reserva
  add constraint reserva_request_status_check
  check (
    request_status is null
    or request_status in (
      'requested',
      'accepted',
      'rejected',
      'expired',
      'cancelled'
    )
  );

alter table public.reserva
  add column if not exists request_expires_at timestamptz;

alter table public.reserva
  add column if not exists accepted_at timestamptz;

alter table public.reserva
  add column if not exists deposit_pay_expires_at timestamptz;

comment on column public.reserva.request_status is
  'Marketplace request lifecycle; null = legacy pre-request flow';

-- Helper: compute seña from trip price * deposit.pct
create or replace function public.compute_sena_monto(p_precio numeric)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pct numeric;
  v_sena numeric;
begin
  begin
    select (valor #>> '{}')::numeric into v_pct
    from public.settings where clave = 'deposit.pct';
  exception when others then
    v_pct := 0.2;
  end;
  if v_pct is null or v_pct <= 0 or v_pct > 1 then
    v_pct := 0.2;
  end if;
  v_sena := round(p_precio * v_pct, 2);
  if v_sena < 1 then
    v_sena := 1;
  end if;
  return v_sena;
end;
$$;

grant execute on function public.compute_sena_monto(numeric) to authenticated;

-- Idempotency for Didit webhook deliveries (event_id unique per attempt).

create table if not exists public.didit_webhook_events (
  event_id text primary key,
  session_id text,
  status text,
  processed_at timestamptz not null default now()
);

comment on table public.didit_webhook_events is
  'Didit webhook event_id dedupe; service_role writes only';

alter table public.didit_webhook_events enable row level security;

-- No policies for authenticated: only service_role (bypasses RLS) inserts.

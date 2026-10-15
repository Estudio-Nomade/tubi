-- Driver KYC sessions (Didit / IdentityVerifier)
-- Links external provider session to profiles for webhook updates.

create table if not exists public.driver_kyc_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  external_session_id text not null,
  provider text not null default 'didit',
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint driver_kyc_sessions_status_check check (
    status in (
      'not_started',
      'in_progress',
      'approved',
      'declined',
      'in_review',
      'expired',
      'unknown'
    )
  ),
  constraint driver_kyc_sessions_external_unique unique (external_session_id)
);

create index if not exists driver_kyc_sessions_user_id_idx
  on public.driver_kyc_sessions (user_id);

create index if not exists driver_kyc_sessions_external_idx
  on public.driver_kyc_sessions (external_session_id);

alter table public.driver_kyc_sessions enable row level security;

-- Users can read their own sessions
drop policy if exists driver_kyc_sessions_select_own on public.driver_kyc_sessions;
create policy driver_kyc_sessions_select_own
  on public.driver_kyc_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts/updates via service role / security definer functions preferred;
-- allow authenticated insert of own row for start flow with user client:
drop policy if exists driver_kyc_sessions_insert_own on public.driver_kyc_sessions;
create policy driver_kyc_sessions_insert_own
  on public.driver_kyc_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Service role bypasses RLS for webhooks.

comment on table public.driver_kyc_sessions is
  'KYC sessions for driver capability (Didit vendor_data = user_id)';

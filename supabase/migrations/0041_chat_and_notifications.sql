-- Chat in-app (unique channel post-seña) + notification outbox (phase 6–7 foundation)

create table if not exists public.chat_thread (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reserva (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chat_thread_reserva_unique unique (reserva_id)
);

create table if not exists public.chat_message (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_thread (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  flagged_bypass boolean not null default false
);

create index if not exists chat_message_thread_created_idx
  on public.chat_message (thread_id, created_at);

create table if not exists public.push_subscription (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  constraint push_subscription_endpoint_unique unique (endpoint)
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz
);

create index if not exists notification_outbox_user_idx
  on public.notification_outbox (user_id, created_at desc);

create table if not exists public.detective_signal (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb not null default '{}',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint detective_signal_status_check check (
    status in ('open', 'ok', 'warned', 'paused')
  )
);

alter table public.chat_thread enable row level security;
alter table public.chat_message enable row level security;
alter table public.push_subscription enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.detective_signal enable row level security;

-- Chat: participants of the reserva only (passenger + trip driver)
create or replace function public.user_in_reserva_chat(p_reserva_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reserva r
    join public.viaje v on v.id = r.viaje_id
    where r.id = p_reserva_id
      and (r.pasajero_id = p_uid or v.conductor_id = p_uid)
  );
$$;

drop policy if exists chat_thread_select on public.chat_thread;
create policy chat_thread_select on public.chat_thread
  for select to authenticated
  using (public.user_in_reserva_chat(reserva_id, auth.uid()));

drop policy if exists chat_message_select on public.chat_message;
create policy chat_message_select on public.chat_message
  for select to authenticated
  using (
    exists (
      select 1 from public.chat_thread t
      where t.id = thread_id
        and public.user_in_reserva_chat(t.reserva_id, auth.uid())
    )
  );

drop policy if exists chat_message_insert on public.chat_message;
create policy chat_message_insert on public.chat_message
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_thread t
      where t.id = thread_id
        and public.user_in_reserva_chat(t.reserva_id, auth.uid())
    )
  );

drop policy if exists push_sub_own on public.push_subscription;
create policy push_sub_own on public.push_subscription
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notif_own on public.notification_outbox;
create policy notif_own on public.notification_outbox
  for select to authenticated
  using (user_id = auth.uid());

-- detective: operators only
drop policy if exists detective_op on public.detective_signal;
create policy detective_op on public.detective_signal
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.is_operator or p.rol = 'operador')
    )
  );

grant execute on function public.user_in_reserva_chat(uuid, uuid) to authenticated;

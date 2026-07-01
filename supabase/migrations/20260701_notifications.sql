create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'manual',
  action text,
  status text not null default 'unread' check (status in ('unread', 'read')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  dedupe_key text,
  sent_by uuid references public.profiles(id) on delete set null
);

create unique index if not exists notifications_user_dedupe_key_idx
  on public.notifications(user_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists notifications_user_created_at_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_status_idx
  on public.notifications(status);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own_or_admin on public.notifications;
create policy notifications_select_own_or_admin
  on public.notifications
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.plano = 'Admin')
    )
  );

drop policy if exists notifications_insert_own_or_admin on public.notifications;
create policy notifications_insert_own_or_admin
  on public.notifications
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.plano = 'Admin')
    )
  );

drop policy if exists notifications_update_own_or_admin on public.notifications;
create policy notifications_update_own_or_admin
  on public.notifications
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.plano = 'Admin')
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.plano = 'Admin')
    )
  );

grant select, insert, update on public.notifications to authenticated;

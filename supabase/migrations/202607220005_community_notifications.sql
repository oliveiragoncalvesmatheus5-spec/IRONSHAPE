-- Add real notifications for Community interactions.

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Atleta IronShape',
  type text not null,
  title text not null,
  body text not null default '',
  post_id uuid references public.posts(id) on delete cascade,
  read_at timestamptz,
  criado_em timestamptz not null default now(),
  constraint community_notifications_type_not_blank check (length(trim(type)) > 0),
  constraint community_notifications_title_not_blank check (length(trim(title)) > 0)
);

create index if not exists community_notifications_recipient_created_idx
  on public.community_notifications (recipient_id, criado_em desc);

create index if not exists community_notifications_unread_idx
  on public.community_notifications (recipient_id, read_at)
  where read_at is null;

alter table public.community_notifications enable row level security;

drop policy if exists community_notifications_select_own_or_admin on public.community_notifications;
create policy community_notifications_select_own_or_admin
  on public.community_notifications
  for select
  to authenticated
  using (
    public.has_active_community_access()
    and (recipient_id::text = auth.uid()::text or public.is_admin())
  );

drop policy if exists community_notifications_insert_paid_actor on public.community_notifications;
create policy community_notifications_insert_paid_actor
  on public.community_notifications
  for insert
  to authenticated
  with check (
    public.has_active_community_access()
    and (actor_id::text = auth.uid()::text or public.is_admin())
  );

drop policy if exists community_notifications_update_own_or_admin on public.community_notifications;
create policy community_notifications_update_own_or_admin
  on public.community_notifications
  for update
  to authenticated
  using (
    public.has_active_community_access()
    and (recipient_id::text = auth.uid()::text or public.is_admin())
  )
  with check (
    public.has_active_community_access()
    and (recipient_id::text = auth.uid()::text or public.is_admin())
  );

drop policy if exists community_notifications_delete_admin_only on public.community_notifications;
create policy community_notifications_delete_admin_only
  on public.community_notifications
  for delete
  to authenticated
  using (public.has_active_community_access() and public.is_admin());

grant select, insert, update, delete on public.community_notifications to authenticated;

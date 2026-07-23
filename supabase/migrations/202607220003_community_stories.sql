-- Add real Stories for the Community.

create table if not exists public.community_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null default 'Atleta IronShape',
  user_avatar text,
  media_url text not null,
  caption text not null default '',
  view_count integer not null default 0,
  active boolean not null default true,
  criado_em timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint community_stories_caption_length check (char_length(caption) <= 220),
  constraint community_stories_view_count_non_negative check (view_count >= 0)
);

create index if not exists community_stories_expires_created_idx
  on public.community_stories (expires_at desc, criado_em desc)
  where active = true;

create index if not exists community_stories_user_created_idx
  on public.community_stories (user_id, criado_em desc);

alter table public.community_stories enable row level security;

drop policy if exists community_stories_select_paid_community on public.community_stories;
create policy community_stories_select_paid_community
  on public.community_stories
  for select
  to authenticated
  using (
    public.has_active_community_access()
    and active = true
    and expires_at > now()
  );

drop policy if exists community_stories_insert_paid_own on public.community_stories;
create policy community_stories_insert_paid_own
  on public.community_stories
  for insert
  to authenticated
  with check (
    public.has_active_community_access()
    and user_id::text = auth.uid()::text
    and expires_at > now()
  );

drop policy if exists community_stories_update_paid_own_or_admin on public.community_stories;
create policy community_stories_update_paid_own_or_admin
  on public.community_stories
  for update
  to authenticated
  using (
    public.has_active_community_access()
    and (user_id::text = auth.uid()::text or public.is_admin())
  )
  with check (
    public.has_active_community_access()
    and (user_id::text = auth.uid()::text or public.is_admin())
  );

drop policy if exists community_stories_delete_paid_own_or_admin on public.community_stories;
create policy community_stories_delete_paid_own_or_admin
  on public.community_stories
  for delete
  to authenticated
  using (
    public.has_active_community_access()
    and (user_id::text = auth.uid()::text or public.is_admin())
  );

grant select, insert, update, delete on public.community_stories to authenticated;

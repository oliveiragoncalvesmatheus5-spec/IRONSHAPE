-- Add per-user likes for Community posts.

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_created_idx
  on public.post_likes (user_id, criado_em desc);

alter table public.post_likes enable row level security;

drop policy if exists post_likes_select_paid_community on public.post_likes;
create policy post_likes_select_paid_community
  on public.post_likes
  for select
  to authenticated
  using (public.has_active_community_access());

drop policy if exists post_likes_insert_paid_own on public.post_likes;
create policy post_likes_insert_paid_own
  on public.post_likes
  for insert
  to authenticated
  with check (
    public.has_active_community_access()
    and user_id::text = auth.uid()::text
  );

drop policy if exists post_likes_delete_paid_own on public.post_likes;
create policy post_likes_delete_paid_own
  on public.post_likes
  for delete
  to authenticated
  using (
    public.has_active_community_access()
    and user_id::text = auth.uid()::text
  );

grant select, insert, delete on public.post_likes to authenticated;

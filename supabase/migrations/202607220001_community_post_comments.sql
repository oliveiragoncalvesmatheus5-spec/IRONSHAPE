-- Add persistent comments for Community posts.

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null default 'Atleta IronShape',
  user_avatar text default '',
  conteudo text not null,
  likes integer not null default 0,
  criado_em timestamptz not null default now(),
  constraint post_comments_content_not_blank check (length(trim(conteudo)) > 0),
  constraint post_comments_likes_non_negative check (likes >= 0)
);

create index if not exists post_comments_post_created_idx
  on public.post_comments (post_id, criado_em asc);

create index if not exists post_comments_user_created_idx
  on public.post_comments (user_id, criado_em desc);

alter table public.post_comments enable row level security;

drop policy if exists post_comments_select_paid_community on public.post_comments;
create policy post_comments_select_paid_community
  on public.post_comments
  for select
  to authenticated
  using (public.has_active_community_access());

drop policy if exists post_comments_insert_paid_own on public.post_comments;
create policy post_comments_insert_paid_own
  on public.post_comments
  for insert
  to authenticated
  with check (
    public.has_active_community_access()
    and user_id::text = auth.uid()::text
  );

drop policy if exists post_comments_update_paid_own_or_admin on public.post_comments;
create policy post_comments_update_paid_own_or_admin
  on public.post_comments
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

drop policy if exists post_comments_delete_paid_own_or_admin on public.post_comments;
create policy post_comments_delete_paid_own_or_admin
  on public.post_comments
  for delete
  to authenticated
  using (
    public.has_active_community_access()
    and (user_id::text = auth.uid()::text or public.is_admin())
  );

grant select, insert, update, delete on public.post_comments to authenticated;

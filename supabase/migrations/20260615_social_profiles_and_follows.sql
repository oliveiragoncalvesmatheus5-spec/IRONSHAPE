alter table public.profiles
  add column if not exists bio text default '',
  add column if not exists avatar_url text default '',
  add column if not exists social_private boolean not null default false;

create table if not exists public.social_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint social_follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists social_follows_following_idx
  on public.social_follows (following_id, criado_em desc);

create index if not exists social_follows_follower_idx
  on public.social_follows (follower_id, criado_em desc);

alter table public.social_follows enable row level security;

create or replace view public.social_profiles
with (security_barrier = true)
as
select
  id,
  name,
  plano,
  bio,
  avatar_url,
  streak,
  criado_em
from public.profiles;

drop policy if exists "Authenticated users can view follows" on public.social_follows;
create policy "Authenticated users can view follows"
  on public.social_follows
  for select
  to authenticated
  using (true);

drop policy if exists "Users can follow from their own account" on public.social_follows;
create policy "Users can follow from their own account"
  on public.social_follows
  for insert
  to authenticated
  with check (auth.uid() = follower_id and follower_id <> following_id);

drop policy if exists "Users can unfollow from their own account" on public.social_follows;
create policy "Users can unfollow from their own account"
  on public.social_follows
  for delete
  to authenticated
  using (auth.uid() = follower_id);

grant select, insert, delete on public.social_follows to authenticated;
grant select on public.social_profiles to authenticated;

-- Restrict Community data to active paid subscribers and admins.
-- The frontend can stay locked while the database is prepared for subscriber access.

create or replace function public.has_active_community_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.profiles
      where profiles.id::text = auth.uid()::text
        and (
          profiles.role = 'admin'
          or profiles.plano = 'Admin'
          or (
            profiles.plano in ('Pro', 'Elite')
            and coalesce(profiles."subscriptionStatus", 'inactive') = 'active'
          )
        )
    );
$$;

revoke all on function public.has_active_community_access() from public;
grant execute on function public.has_active_community_access() to authenticated;

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
from public.profiles
where public.has_active_community_access()
  and (
    coalesce(social_private, false) = false
    or id::text = auth.uid()::text
    or public.is_admin()
  );

grant select on public.social_profiles to authenticated;

alter table if exists public.posts enable row level security;

drop policy if exists posts_select_authenticated on public.posts;
drop policy if exists posts_select_paid_community on public.posts;
create policy posts_select_paid_community
  on public.posts
  for select
  to authenticated
  using (public.has_active_community_access());

drop policy if exists posts_insert_own on public.posts;
drop policy if exists posts_insert_paid_own on public.posts;
create policy posts_insert_paid_own
  on public.posts
  for insert
  to authenticated
  with check (
    public.has_active_community_access()
    and (user_id::text = auth.uid()::text or public.is_admin())
  );

drop policy if exists posts_update_authenticated_protected_by_trigger on public.posts;
drop policy if exists posts_update_paid_protected_by_trigger on public.posts;
create policy posts_update_paid_protected_by_trigger
  on public.posts
  for update
  to authenticated
  using (public.has_active_community_access())
  with check (public.has_active_community_access());

drop policy if exists posts_delete_own_or_admin on public.posts;
drop policy if exists posts_delete_paid_own_or_admin on public.posts;
create policy posts_delete_paid_own_or_admin
  on public.posts
  for delete
  to authenticated
  using (
    public.has_active_community_access()
    and (user_id::text = auth.uid()::text or public.is_admin())
  );

grant select, insert, update, delete on public.posts to authenticated;

alter table if exists public.social_follows enable row level security;

drop policy if exists "Authenticated users can view follows" on public.social_follows;
drop policy if exists social_follows_select_paid_community on public.social_follows;
create policy social_follows_select_paid_community
  on public.social_follows
  for select
  to authenticated
  using (public.has_active_community_access());

drop policy if exists "Users can follow from their own account" on public.social_follows;
drop policy if exists social_follows_insert_paid_own on public.social_follows;
create policy social_follows_insert_paid_own
  on public.social_follows
  for insert
  to authenticated
  with check (
    public.has_active_community_access()
    and auth.uid() = follower_id
    and follower_id <> following_id
  );

drop policy if exists "Users can unfollow from their own account" on public.social_follows;
drop policy if exists social_follows_delete_paid_own on public.social_follows;
create policy social_follows_delete_paid_own
  on public.social_follows
  for delete
  to authenticated
  using (
    public.has_active_community_access()
    and auth.uid() = follower_id
  );

grant select, insert, delete on public.social_follows to authenticated;

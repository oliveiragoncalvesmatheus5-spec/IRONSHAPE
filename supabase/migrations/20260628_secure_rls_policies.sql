-- IronShape security hardening
-- Applies row-level security policies for user-owned data and protects billing/admin fields.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'carlosalbertojuniorourak@gmail.com';
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    new.role := old.role;
  end if;

  if new."paymentCustomerId" is distinct from old."paymentCustomerId" then
    new."paymentCustomerId" := old."paymentCustomerId";
  end if;

  if new."subscriptionPaidAt" is distinct from old."subscriptionPaidAt" then
    new."subscriptionPaidAt" := old."subscriptionPaidAt";
  end if;

  if new.plano is distinct from old.plano
    and coalesce(new.plano, 'free') not in ('free', 'Iniciante') then
    new.plano := old.plano;
  end if;

  if new."subscriptionStatus" is distinct from old."subscriptionStatus"
    and coalesce(new."subscriptionStatus", 'inactive') <> 'inactive' then
    new."subscriptionStatus" := old."subscriptionStatus";
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_fields_trigger on public.profiles;
create trigger protect_profile_sensitive_fields_trigger
before update on public.profiles
for each row
execute function public.protect_profile_sensitive_fields();

alter table if exists public.profiles enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to authenticated
  using (id::text = auth.uid()::text or public.is_admin());

drop policy if exists profiles_insert_own_safe on public.profiles;
create policy profiles_insert_own_safe
  on public.profiles
  for insert
  to authenticated
  with check (
    id::text = auth.uid()::text
    and coalesce(role, 'user') = 'user'
    and coalesce(plano, 'free') in ('free', 'Iniciante')
    and coalesce("subscriptionStatus", 'inactive') = 'inactive'
  );

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
  on public.profiles
  for update
  to authenticated
  using (id::text = auth.uid()::text or public.is_admin())
  with check (id::text = auth.uid()::text or public.is_admin());

grant select, insert, update on public.profiles to authenticated;

alter table if exists public.workout_logs enable row level security;

drop policy if exists workout_logs_select_own_or_admin on public.workout_logs;
create policy workout_logs_select_own_or_admin
  on public.workout_logs
  for select
  to authenticated
  using ("userUid"::text = auth.uid()::text or public.is_admin());

drop policy if exists workout_logs_insert_own on public.workout_logs;
create policy workout_logs_insert_own
  on public.workout_logs
  for insert
  to authenticated
  with check ("userUid"::text = auth.uid()::text or public.is_admin());

drop policy if exists workout_logs_update_own on public.workout_logs;
create policy workout_logs_update_own
  on public.workout_logs
  for update
  to authenticated
  using ("userUid"::text = auth.uid()::text or public.is_admin())
  with check ("userUid"::text = auth.uid()::text or public.is_admin());

drop policy if exists workout_logs_delete_own on public.workout_logs;
create policy workout_logs_delete_own
  on public.workout_logs
  for delete
  to authenticated
  using ("userUid"::text = auth.uid()::text or public.is_admin());

grant select, insert, update, delete on public.workout_logs to authenticated;

alter table if exists public.progress_logs enable row level security;

drop policy if exists progress_logs_select_own_or_admin on public.progress_logs;
create policy progress_logs_select_own_or_admin
  on public.progress_logs
  for select
  to authenticated
  using ("userUid"::text = auth.uid()::text or public.is_admin());

drop policy if exists progress_logs_insert_own on public.progress_logs;
create policy progress_logs_insert_own
  on public.progress_logs
  for insert
  to authenticated
  with check ("userUid"::text = auth.uid()::text or public.is_admin());

drop policy if exists progress_logs_update_own on public.progress_logs;
create policy progress_logs_update_own
  on public.progress_logs
  for update
  to authenticated
  using ("userUid"::text = auth.uid()::text or public.is_admin())
  with check ("userUid"::text = auth.uid()::text or public.is_admin());

drop policy if exists progress_logs_delete_own on public.progress_logs;
create policy progress_logs_delete_own
  on public.progress_logs
  for delete
  to authenticated
  using ("userUid"::text = auth.uid()::text or public.is_admin());

grant select, insert, update, delete on public.progress_logs to authenticated;

alter table if exists public.nutrition_logs enable row level security;

drop policy if exists nutrition_logs_select_own_or_admin on public.nutrition_logs;
create policy nutrition_logs_select_own_or_admin
  on public.nutrition_logs
  for select
  to authenticated
  using (user_id::text = auth.uid()::text or public.is_admin());

drop policy if exists nutrition_logs_insert_own on public.nutrition_logs;
create policy nutrition_logs_insert_own
  on public.nutrition_logs
  for insert
  to authenticated
  with check (user_id::text = auth.uid()::text or public.is_admin());

drop policy if exists nutrition_logs_update_own on public.nutrition_logs;
create policy nutrition_logs_update_own
  on public.nutrition_logs
  for update
  to authenticated
  using (user_id::text = auth.uid()::text or public.is_admin())
  with check (user_id::text = auth.uid()::text or public.is_admin());

drop policy if exists nutrition_logs_delete_own on public.nutrition_logs;
create policy nutrition_logs_delete_own
  on public.nutrition_logs
  for delete
  to authenticated
  using (user_id::text = auth.uid()::text or public.is_admin());

grant select, insert, update, delete on public.nutrition_logs to authenticated;

create or replace function public.protect_post_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() or old.user_id::text = auth.uid()::text then
    return new;
  end if;

  new.user_id := old.user_id;
  new.user_name := old.user_name;
  new.user_avatar := old.user_avatar;
  new.conteudo := old.conteudo;
  new.imagem_url := old.imagem_url;
  new.criado_em := old.criado_em;
  return new;
end;
$$;

drop trigger if exists protect_post_update_trigger on public.posts;
create trigger protect_post_update_trigger
before update on public.posts
for each row
execute function public.protect_post_update();

alter table if exists public.posts enable row level security;

drop policy if exists posts_select_authenticated on public.posts;
create policy posts_select_authenticated
  on public.posts
  for select
  to authenticated
  using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
  on public.posts
  for insert
  to authenticated
  with check (user_id::text = auth.uid()::text or public.is_admin());

drop policy if exists posts_update_authenticated_protected_by_trigger on public.posts;
create policy posts_update_authenticated_protected_by_trigger
  on public.posts
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists posts_delete_own_or_admin on public.posts;
create policy posts_delete_own_or_admin
  on public.posts
  for delete
  to authenticated
  using (user_id::text = auth.uid()::text or public.is_admin());

grant select, insert, update, delete on public.posts to authenticated;

alter table if exists public.affiliates enable row level security;

drop policy if exists affiliates_select_own_or_admin on public.affiliates;
create policy affiliates_select_own_or_admin
  on public.affiliates
  for select
  to authenticated
  using (user_id::text = auth.uid()::text or public.is_admin());

drop policy if exists affiliates_insert_own on public.affiliates;
create policy affiliates_insert_own
  on public.affiliates
  for insert
  to authenticated
  with check (user_id::text = auth.uid()::text or public.is_admin());

drop policy if exists affiliates_update_admin_only on public.affiliates;
create policy affiliates_update_admin_only
  on public.affiliates
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.affiliates to authenticated;

alter table if exists public.affiliate_clicks enable row level security;

drop policy if exists affiliate_clicks_insert_public on public.affiliate_clicks;
create policy affiliate_clicks_insert_public
  on public.affiliate_clicks
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists affiliate_clicks_select_owner_or_admin on public.affiliate_clicks;
create policy affiliate_clicks_select_owner_or_admin
  on public.affiliate_clicks
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.affiliates a
      where a.id = affiliate_clicks.affiliate_id
        and a.user_id::text = auth.uid()::text
    )
  );

grant insert on public.affiliate_clicks to anon, authenticated;
grant select on public.affiliate_clicks to authenticated;

alter table if exists public.affiliate_conversions enable row level security;

drop policy if exists affiliate_conversions_select_owner_or_admin on public.affiliate_conversions;
create policy affiliate_conversions_select_owner_or_admin
  on public.affiliate_conversions
  for select
  to authenticated
  using (
    public.is_admin()
    or user_id::text = auth.uid()::text
    or exists (
      select 1
      from public.affiliates a
      where a.id = affiliate_conversions.affiliate_id
        and a.user_id::text = auth.uid()::text
    )
  );

grant select on public.affiliate_conversions to authenticated;

drop policy if exists post_images_public_read on storage.objects;
create policy post_images_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'post-images');

drop policy if exists post_images_insert_own_folder on storage.objects;
create policy post_images_insert_own_folder
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists post_images_update_own_folder on storage.objects;
create policy post_images_update_own_folder
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  )
  with check (
    bucket_id = 'post-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists post_images_delete_own_folder on storage.objects;
create policy post_images_delete_own_folder
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

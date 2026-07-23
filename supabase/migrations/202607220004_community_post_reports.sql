-- Add moderation reports for Community posts.

create table if not exists public.community_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reporter_name text not null default 'Atleta IronShape',
  reason text not null default 'conteudo_inadequado',
  details text not null default '',
  status text not null default 'pending',
  criado_em timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  constraint community_post_reports_unique_report unique (post_id, reporter_id),
  constraint community_post_reports_reason_not_blank check (length(trim(reason)) > 0),
  constraint community_post_reports_status_valid check (status in ('pending', 'reviewed', 'dismissed', 'actioned'))
);

create index if not exists community_post_reports_status_created_idx
  on public.community_post_reports (status, criado_em desc);

create index if not exists community_post_reports_post_created_idx
  on public.community_post_reports (post_id, criado_em desc);

alter table public.community_post_reports enable row level security;

drop policy if exists community_post_reports_select_own_or_admin on public.community_post_reports;
create policy community_post_reports_select_own_or_admin
  on public.community_post_reports
  for select
  to authenticated
  using (
    public.has_active_community_access()
    and (reporter_id::text = auth.uid()::text or public.is_admin())
  );

drop policy if exists community_post_reports_insert_paid_own on public.community_post_reports;
create policy community_post_reports_insert_paid_own
  on public.community_post_reports
  for insert
  to authenticated
  with check (
    public.has_active_community_access()
    and reporter_id::text = auth.uid()::text
  );

drop policy if exists community_post_reports_update_admin_only on public.community_post_reports;
create policy community_post_reports_update_admin_only
  on public.community_post_reports
  for update
  to authenticated
  using (public.has_active_community_access() and public.is_admin())
  with check (public.has_active_community_access() and public.is_admin());

drop policy if exists community_post_reports_delete_admin_only on public.community_post_reports;
create policy community_post_reports_delete_admin_only
  on public.community_post_reports
  for delete
  to authenticated
  using (public.has_active_community_access() and public.is_admin());

grant select, insert, update, delete on public.community_post_reports to authenticated;

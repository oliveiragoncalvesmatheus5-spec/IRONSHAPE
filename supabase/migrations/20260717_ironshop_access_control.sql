create table if not exists public.ironshop_settings (
  id text primary key default 'global',
  ironshop_enabled boolean not null default false,
  availability_mode text not null default 'blocked'
    check (availability_mode in ('blocked', 'admins', 'testers', 'group', 'gradual', 'all')),
  gradual_percentage integer not null default 0 check (gradual_percentage >= 0 and gradual_percentage <= 100),
  allowed_group text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.ironshop_settings (id, ironshop_enabled, availability_mode, gradual_percentage)
values ('global', false, 'blocked', 0)
on conflict (id) do nothing;

create table if not exists public.ironshop_early_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  group_key text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  constraint ironshop_early_access_target check (user_id is not null or email is not null)
);

create index if not exists ironshop_early_access_user_id_idx on public.ironshop_early_access(user_id) where active = true;
create index if not exists ironshop_early_access_email_idx on public.ironshop_early_access(lower(email)) where active = true;

create table if not exists public.ironshop_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  admin_email text,
  previous_state jsonb not null,
  new_state jsonb not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists ironshop_audit_logs_created_at_idx on public.ironshop_audit_logs(created_at desc);

create table if not exists public.ironshop_access_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  source text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists ironshop_access_attempts_created_at_idx on public.ironshop_access_attempts(created_at desc);
create index if not exists ironshop_access_attempts_user_id_idx on public.ironshop_access_attempts(user_id);

alter table public.ironshop_settings enable row level security;
alter table public.ironshop_early_access enable row level security;
alter table public.ironshop_audit_logs enable row level security;
alter table public.ironshop_access_attempts enable row level security;

drop policy if exists "ironshop_settings_admin_read" on public.ironshop_settings;
create policy "ironshop_settings_admin_read"
on public.ironshop_settings
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.plano = 'Admin')
  )
);

drop policy if exists "ironshop_early_access_admin_read" on public.ironshop_early_access;
create policy "ironshop_early_access_admin_read"
on public.ironshop_early_access
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.plano = 'Admin')
  )
);

drop policy if exists "ironshop_audit_admin_read" on public.ironshop_audit_logs;
create policy "ironshop_audit_admin_read"
on public.ironshop_audit_logs
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.plano = 'Admin')
  )
);

drop policy if exists "ironshop_attempts_admin_read" on public.ironshop_access_attempts;
create policy "ironshop_attempts_admin_read"
on public.ironshop_access_attempts
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.plano = 'Admin')
  )
);

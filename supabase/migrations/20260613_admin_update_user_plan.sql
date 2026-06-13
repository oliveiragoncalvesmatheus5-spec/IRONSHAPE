create or replace function public.admin_update_user_plan(
  target_user_id text,
  target_plan text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text := coalesce(auth.jwt() ->> 'email', '');
  updated_profile jsonb;
begin
  if caller_email <> 'carlosalbertojuniorourak@gmail.com' then
    raise exception 'Acesso restrito ao administrador.' using errcode = '42501';
  end if;

  if target_plan not in ('free', 'Pro', 'Elite') then
    raise exception 'Plano inválido.' using errcode = '22023';
  end if;

  update public.profiles
  set
    plano = target_plan,
    "subscriptionStatus" = case when target_plan = 'free' then 'inactive' else 'active' end,
    "updatedAt" = now()
  where id::text = target_user_id
    and coalesce(email, '') <> 'carlosalbertojuniorourak@gmail.com'
    and coalesce(role, 'user') <> 'admin'
    and coalesce(plano, 'free') <> 'Admin'
  returning to_jsonb(profiles.*) into updated_profile;

  if updated_profile is null then
    raise exception 'Usuário não encontrado ou conta administrativa protegida.' using errcode = 'P0002';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.admin_update_user_plan(text, text) from public;
grant execute on function public.admin_update_user_plan(text, text) to authenticated;

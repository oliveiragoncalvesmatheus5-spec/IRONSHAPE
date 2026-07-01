create or replace view public.social_profiles
with (security_invoker = true, security_barrier = true)
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
where coalesce(social_private, false) = false
   or id = auth.uid()
   or public.is_admin();

grant select on public.social_profiles to authenticated;

alter table public.profiles
  add column if not exists "subscriptionPaidAt" timestamptz;

comment on column public.profiles."subscriptionPaidAt" is
  'Date of the latest confirmed subscription payment, used to calculate the next monthly charge.';

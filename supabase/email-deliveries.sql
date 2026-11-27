-- CITE 2026 — email delivery audit trail
-- Run once in Supabase → SQL Editor. Safe to re-run.

create table if not exists public.email_deliveries (
  id uuid primary key default uuid_generate_v4(),
  recipient text not null,
  subject text not null,
  provider text not null,
  status text not null check (status in ('submitted', 'sent', 'failed', 'captured')),
  error_message text,
  related_type text,
  related_id text,
  created_by text,
  created_at timestamptz not null default now()
);

-- Existing installations created this table with a narrower status check that
-- could not record Graph's HTTP 202 "accepted for submission" result.
alter table public.email_deliveries
  drop constraint if exists email_deliveries_status_check;
alter table public.email_deliveries
  add constraint email_deliveries_status_check
  check (status in ('submitted', 'sent', 'failed', 'captured'));

create index if not exists idx_email_deliveries_created_at
  on public.email_deliveries(created_at desc);

alter table public.email_deliveries enable row level security;

drop policy if exists "Admins can view email deliveries" on public.email_deliveries;
create policy "Admins can view email deliveries" on public.email_deliveries
  for select using (public.is_admin());

grant select on public.email_deliveries to authenticated;

notify pgrst, 'reload schema';

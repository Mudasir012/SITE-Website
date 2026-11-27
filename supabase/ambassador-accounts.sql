-- CITE 2026 — Ambassador self-service accounts
-- Run once in Supabase → SQL Editor after ambassador-portal.sql and
-- email-deliveries.sql. Safe to re-run.
--
-- Flow: admin invites by email -> ambassador sets password + details on
-- /ambassador/setup -> account becomes pending -> admin approves/rejects.

-- 1. Extend the ambassador record with signup details and review metadata.
alter table public.ambassadors
  add column if not exists cnic text,
  add column if not exists signup_completed_at timestamptz,
  add column if not exists invited_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

alter table public.ambassadors drop constraint if exists ambassadors_status_check;
alter table public.ambassadors add constraint ambassadors_status_check
  check (status in ('invited', 'pending', 'approved', 'rejected'));

create index if not exists idx_ambassadors_email_lower on public.ambassadors(lower(email));

-- Existing linked ambassadors from the earlier flow have already signed up.
update public.ambassadors
set signup_completed_at = coalesce(signup_completed_at, created_at)
where user_id is not null and status in ('approved', 'rejected');

-- 2. Complete the invited account. The Supabase invite link has already set
-- the auth session; this stores the portal details and moves the row to
-- pending so the admin can review it.
create or replace function public.complete_ambassador_setup(
  p_full_name text,
  p_phone text,
  p_cnic text,
  p_university text
)
returns table (
  id uuid,
  full_name text,
  email text,
  university text,
  referral_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.email(), ''));
  v_id uuid;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_cnic text := regexp_replace(coalesce(p_cnic, ''), '\D', '', 'g');
begin
  if auth.uid() is null then
    raise exception 'Open your invitation link before completing this form.' using errcode = '42501';
  end if;

  if v_email = '' then
    raise exception 'Your session has no email address. Please open the invitation link again.' using errcode = '42501';
  end if;

  if coalesce(length(trim(p_full_name)), 0) < 2 then
    raise exception 'Enter your full name.' using errcode = '22023';
  end if;

  if length(v_phone) < 11 then
    raise exception 'Enter a valid 11-digit phone number.' using errcode = '22023';
  end if;

  if length(v_cnic) <> 13 then
    raise exception 'Enter a valid 13-digit CNIC.' using errcode = '22023';
  end if;

  if coalesce(length(trim(p_university)), 0) < 2 then
    raise exception 'Enter your university name.' using errcode = '22023';
  end if;

  select a.id into v_id
  from public.ambassadors a
  where lower(a.email) = v_email
    and a.deleted_at is null
    and (a.user_id is null or a.user_id = auth.uid())
    and a.status in ('invited', 'pending')
  order by (a.user_id = auth.uid()) desc, a.created_at asc
  limit 1;

  if v_id is null then
    raise exception 'No invitation is waiting for this email. Ask the admin to send one.' using errcode = '42501';
  end if;

  update public.ambassadors a
  set
    user_id = auth.uid(),
    full_name = trim(p_full_name),
    phone = v_phone,
    cnic = v_cnic,
    university = trim(p_university),
    status = 'pending',
    signup_completed_at = now(),
    updated_at = now()
  where a.id = v_id
    and (a.user_id is null or a.user_id = auth.uid());

  return query
  select a.id, a.full_name, a.email, a.university, a.referral_code, a.status
  from public.ambassadors a
  where a.id = v_id;
end;
$$;

revoke all on function public.complete_ambassador_setup(TEXT, TEXT, TEXT, TEXT) from public;
grant execute on function public.complete_ambassador_setup(TEXT, TEXT, TEXT, TEXT) to authenticated;

-- 3. Read the signed-in ambassador's own account (including pending accounts,
-- whose dashboard is not unlocked until approval).
create or replace function public.get_ambassador_account()
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  cnic text,
  university text,
  referral_code text,
  status text,
  signup_completed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to access the ambassador portal.' using errcode = '42501';
  end if;

  return query
  select
    a.id, a.full_name, a.email, a.phone, a.cnic, a.university,
    a.referral_code, a.status, a.signup_completed_at
  from public.ambassadors a
  where a.user_id = auth.uid()
    and a.deleted_at is null
  limit 1;
end;
$$;

revoke all on function public.get_ambassador_account() from public;
grant execute on function public.get_ambassador_account() to authenticated;

notify pgrst, 'reload schema';

-- CITE 2026 — ambassador review of referred registrations
-- Run once in Supabase → SQL Editor after registration-form.sql and
-- ambassador-portal.sql. Safe to re-run.
--
-- When a participant picks an ambassador while registering, the registration
-- starts as 'pending' and lands in that ambassador's portal. The ambassador can
-- approve (status -> 'approved', so it appears as a participant for admins) or
-- reject (status -> 'rejected'). Admin decisions keep working independently;
-- only registrations still in 'pending' can be decided by an ambassador.

-- 1. Track which ambassador reviewed a registration and when.
alter table public.registrations
  add column if not exists ambassador_reviewed_by uuid
    references public.ambassadors(id) on delete set null;

alter table public.registrations
  add column if not exists ambassador_reviewed_at timestamptz;

create index if not exists idx_reg_amb_review
  on public.registrations(ambassador_reviewed_by)
  where ambassador_reviewed_by is not null and deleted_at is null;

-- 2. Ambassador decision RPC. SECURITY DEFINER keeps direct table access closed;
-- the function only touches rows carrying the caller's own referral code.
create or replace function public.ambassador_review_referral(
  p_registration_id uuid,
  p_decision text
)
returns table (
  id uuid,
  status text,
  ambassador_reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amb public.ambassadors%rowtype;
  v_reg public.registrations%rowtype;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
begin
  if auth.uid() is null then
    raise exception 'Sign in to review referrals.' using errcode = '42501';
  end if;

  if v_decision not in ('approved', 'rejected') then
    raise exception 'Review decision must be approved or rejected.' using errcode = '22023';
  end if;

  select a.* into v_amb
  from public.ambassadors a
  where a.user_id = auth.uid()
    and a.status = 'approved'
    and a.deleted_at is null
  limit 1;

  if not found then
    raise exception 'No approved ambassador profile is linked to this account.' using errcode = '42501';
  end if;

  select r.* into v_reg
  from public.registrations r
  where r.id = p_registration_id
    and r.deleted_at is null
    and upper(r.referral_code) = upper(v_amb.referral_code)
  limit 1;

  if not found then
    raise exception 'That registration is not linked to your referral code.' using errcode = '42501';
  end if;

  if v_reg.status <> 'pending' then
    raise exception 'This referral has already been reviewed.' using errcode = '22023';
  end if;

  update public.registrations r
  set
    status = v_decision,
    ambassador_reviewed_by = v_amb.id,
    ambassador_reviewed_at = now(),
    updated_at = now()
  where r.id = v_reg.id;

  insert into public.audit_logs (actor_email, action, entity_type, entity_id, details)
  values (
    v_amb.email,
    'AMBASSADOR_REVIEW_REFERRAL',
    'registration',
    v_reg.id::text,
    jsonb_build_object(
      'decision', v_decision,
      'participant', v_reg.full_name,
      'participant_email', v_reg.user_email,
      'event', coalesce(v_reg.event_name, v_reg.event_slug),
      'ambassador', v_amb.full_name,
      'ambassador_code', v_amb.referral_code
    )
  );

  return query
  select r.id, r.status, r.ambassador_reviewed_at
  from public.registrations r
  where r.id = v_reg.id;
end;
$$;

revoke all on function public.ambassador_review_referral(uuid, text) from public;
grant execute on function public.ambassador_review_referral(uuid, text) to authenticated;

-- 3. Referral list now exposes the review timestamp (drop first: the return
-- type changed, so CREATE OR REPLACE alone would fail).
drop function if exists public.get_ambassador_referrals();

create function public.get_ambassador_referrals()
returns table (
  id uuid,
  full_name text,
  user_email text,
  phone text,
  cnic text,
  event_name text,
  event_slug text,
  status text,
  created_at timestamptz,
  ambassador_reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_amb public.ambassadors%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to access the ambassador portal.' using errcode = '42501';
  end if;

  select a.* into v_amb
  from public.ambassadors a
  where a.user_id = auth.uid()
    and a.status = 'approved'
    and a.deleted_at is null
  limit 1;

  if not found then
    raise exception 'No approved ambassador profile is linked to this account.' using errcode = '42501';
  end if;

  return query
  select
    r.id,
    r.full_name,
    r.user_email,
    r.phone,
    r.cnic,
    coalesce(nullif(r.event_name, ''), e.title, r.event_slug, 'CITE 2026 Event') as event_name,
    r.event_slug,
    r.status,
    r.created_at,
    r.ambassador_reviewed_at
  from public.registrations r
  left join public.events e on e.id = r.event_id
  where r.deleted_at is null
    and upper(r.referral_code) = upper(v_amb.referral_code)
  order by r.created_at desc
  limit 500;
end;
$$;

revoke all on function public.get_ambassador_referrals() from public;
grant execute on function public.get_ambassador_referrals() to authenticated;

notify pgrst, 'reload schema';

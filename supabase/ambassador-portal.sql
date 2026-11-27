-- CITE 2026 — Campus Ambassador portal
-- Run once in Supabase → SQL Editor after registration-form.sql and
-- registration-toggle.sql. Safe to re-run.

-- 1. Link ambassador rows to Supabase Auth users and track invite sends.
alter table public.ambassadors
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;

alter table public.ambassadors
  add column if not exists portal_invited_at timestamptz;

create index if not exists idx_ambassadors_user_id on public.ambassadors(user_id);

create index if not exists idx_reg_referral_code_upper
  on public.registrations(upper(referral_code))
  where deleted_at is null and referral_code is not null;

-- 2. Ambassadors may read only their own approved row.
drop policy if exists "Ambassadors can view own approved profile" on public.ambassadors;
create policy "Ambassadors can view own approved profile" on public.ambassadors
  for select to authenticated
  using (
    user_id = auth.uid()
    and status = 'approved'
    and deleted_at is null
  );

-- 3. Helper used by RLS-aware clients.
create or replace function public.is_ambassador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ambassadors a
    where a.user_id = auth.uid()
      and a.status = 'approved'
      and a.deleted_at is null
  );
$$;

revoke all on function public.is_ambassador() from public;
grant execute on function public.is_ambassador() to authenticated;

-- 4. First-login claim: link the authenticated user to the approved ambassador
-- row with the same email. Idempotent for the same user.
create or replace function public.claim_ambassador_profile()
returns table (
  id uuid,
  full_name text,
  email text,
  university text,
  referral_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.email(), ''));
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to access the ambassador portal.' using errcode = '42501';
  end if;

  if v_email = '' then
    raise exception 'Your session has no email address.' using errcode = '42501';
  end if;

  select a.id into v_id
  from public.ambassadors a
  where lower(a.email) = v_email
    and a.status = 'approved'
    and a.deleted_at is null
    and (a.user_id is null or a.user_id = auth.uid())
  order by (a.user_id = auth.uid()) desc, a.created_at asc
  limit 1;

  if v_id is null then
    raise exception 'No approved ambassador application was found for this email.' using errcode = '42501';
  end if;

  update public.ambassadors a
  set user_id = auth.uid(), updated_at = now()
  where a.id = v_id
    and (a.user_id is null or a.user_id = auth.uid());

  return query
  select a.id, a.full_name, a.email, a.university, a.referral_code
  from public.ambassadors a
  where a.id = v_id;
end;
$$;

revoke all on function public.claim_ambassador_profile() from public;
grant execute on function public.claim_ambassador_profile() to authenticated;

-- 5. Dashboard summary, scoped to the caller. Rank includes all approved
-- ambassadors so an ambassador with zero referrals still gets a position.
create or replace function public.get_ambassador_dashboard()
returns table (
  id uuid,
  full_name text,
  email text,
  university text,
  referral_code text,
  total_referrals bigint,
  pending_referrals bigint,
  approved_referrals bigint,
  rejected_referrals bigint,
  waitlisted_referrals bigint,
  rank_position integer
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
  with counts as (
    select
      upper(r.referral_code) as code,
      count(*)::bigint as total,
      count(*) filter (where r.status = 'pending')::bigint as pending,
      count(*) filter (where r.status = 'approved')::bigint as approved,
      count(*) filter (where r.status = 'rejected')::bigint as rejected,
      count(*) filter (where r.status = 'waitlisted')::bigint as waitlisted
    from public.registrations r
    where r.deleted_at is null
      and r.referral_code is not null
    group by upper(r.referral_code)
  ),
  ranked as (
    select
      a.id,
      (rank() over (
        order by coalesce(c.total, 0) desc, a.full_name asc
      ))::integer as rank_pos
    from public.ambassadors a
    left join counts c on c.code = upper(a.referral_code)
    where a.status = 'approved'
      and a.deleted_at is null
  )
  select
    v_amb.id,
    v_amb.full_name,
    v_amb.email,
    v_amb.university,
    v_amb.referral_code,
    coalesce(c.total, 0)::bigint,
    coalesce(c.pending, 0)::bigint,
    coalesce(c.approved, 0)::bigint,
    coalesce(c.rejected, 0)::bigint,
    coalesce(c.waitlisted, 0)::bigint,
    coalesce(rk.rank_pos, 0)
  from (select 1) one
  left join counts c on c.code = upper(v_amb.referral_code)
  left join ranked rk on rk.id = v_amb.id;
end;
$$;

revoke all on function public.get_ambassador_dashboard() from public;
grant execute on function public.get_ambassador_dashboard() to authenticated;

-- 6. Referred participant list. Full contact details are exposed only to the
-- authenticated, approved ambassador whose code is attached to the row.
create or replace function public.get_ambassador_referrals()
returns table (
  id uuid,
  full_name text,
  user_email text,
  phone text,
  cnic text,
  event_name text,
  event_slug text,
  status text,
  created_at timestamptz
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
    r.created_at
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

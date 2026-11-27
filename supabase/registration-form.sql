-- CITE 2026 — public event registration
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- The public Register Now form collects name, email, CNIC, phone and an
-- optional campus ambassador. Two SECURITY DEFINER functions keep the anon
-- key limited: it can list approved ambassadors and submit one validated
-- registration, but it still cannot read or write the tables directly.

-- ── 1. Columns the public form needs ────────────────────────────────────────
alter table public.registrations add column if not exists cnic text;
alter table public.registrations add column if not exists event_slug text;
alter table public.registrations add column if not exists event_name text;

-- The public form does not ask for university/roll number, so those legacy
-- required columns must accept null. Admins can fill them in later if needed.
alter table public.registrations alter column university drop not null;
alter table public.registrations alter column roll_number drop not null;

create index if not exists idx_reg_event_slug
  on public.registrations(event_slug)
  where deleted_at is null;

-- ── 2. Approved ambassadors for the dropdown ────────────────────────────────
-- Returns only public-safe fields. Phone and email stay private.
create or replace function public.list_public_ambassadors()
returns table (
  id uuid,
  full_name text,
  university text,
  referral_code text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.full_name, a.university, a.referral_code
  from public.ambassadors a
  where a.status = 'approved'
    and a.deleted_at is null
  order by a.full_name;
$$;

revoke all on function public.list_public_ambassadors() from public;
grant execute on function public.list_public_ambassadors() to anon, authenticated;

-- ── 3. Validated public registration ────────────────────────────────────────
create or replace function public.register_for_event(
  p_full_name text,
  p_user_email text,
  p_phone text,
  p_cnic text,
  p_referral_code text,
  p_event_slug text,
  p_event_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name  text := btrim(coalesce(p_full_name, ''));
  v_email text := lower(btrim(coalesce(p_user_email, '')));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_cnic  text := regexp_replace(coalesce(p_cnic, ''), '\D', '', 'g');
  v_code  text := nullif(upper(btrim(coalesce(p_referral_code, ''))), '');
  v_slug  text := nullif(btrim(coalesce(p_event_slug, '')), '');
  v_event text := nullif(btrim(coalesce(p_event_name, '')), '');
  v_id    uuid;
begin
  if length(v_name) < 3 then
    raise exception 'Please enter your full name.' using errcode = '22023';
  end if;

  if v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;

  -- Accept 03XXXXXXXXX, 923XXXXXXXXX or +92 3XX XXXXXXX.
  if length(v_phone) = 12 and v_phone like '92%' then
    v_phone := '0' || right(v_phone, 10);
  end if;

  if v_phone !~ '^03[0-9]{9}$' then
    raise exception 'Please enter a valid Pakistani mobile number (03XX-XXXXXXX).' using errcode = '22023';
  end if;

  if length(v_cnic) <> 13 then
    raise exception 'Please enter a valid 13-digit CNIC number.' using errcode = '22023';
  end if;

  if v_slug is null or v_event is null then
    raise exception 'Event information is missing.' using errcode = '22023';
  end if;

  -- Keep a referral code only when it belongs to an approved ambassador.
  if v_code is not null and not exists (
    select 1
    from public.ambassadors
    where upper(referral_code) = v_code
      and status = 'approved'
      and deleted_at is null
  ) then
    v_code := null;
  end if;

  if exists (
    select 1
    from public.registrations
    where lower(user_email) = v_email
      and event_slug = v_slug
      and deleted_at is null
  ) then
    raise exception 'This email is already registered for this event.' using errcode = '23505';
  end if;

  insert into public.registrations (
    full_name,
    user_email,
    phone,
    cnic,
    university,
    roll_number,
    event_slug,
    event_name,
    referral_code,
    status
  ) values (
    v_name,
    v_email,
    v_phone,
    v_cnic,
    null,
    null,
    v_slug,
    left(v_event, 160),
    v_code,
    'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.register_for_event(text, text, text, text, text, text, text) from public;
grant execute on function public.register_for_event(text, text, text, text, text, text, text) to anon, authenticated;

-- Make PostgREST pick up the new RPCs immediately.
notify pgrst, 'reload schema';

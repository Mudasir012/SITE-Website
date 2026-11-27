-- CITE 2026 — editable overrides for the public event-page tracks
-- Run once in Supabase → SQL Editor after registration-form.sql. Safe to re-run.
--
-- The 18 public competition tracks live in src/data/tracks.js. Admins can edit
-- the public-facing details (description, venue, dates, capacity, team size,
-- fees, prizes, rules) from the admin portal. Only the fields an admin actually
-- edits are stored here; the public pages merge each row over the static
-- defaults, so a track with no row keeps rendering exactly as before.

create table if not exists public.event_tracks (
  slug text primary key,
  title text,
  category text,
  description text,
  venue text,
  start_date timestamptz,
  end_date timestamptz,
  registration_deadline timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  min_team_size integer check (min_team_size is null or min_team_size > 0),
  max_team_size integer check (max_team_size is null or max_team_size > 0),
  team_size text,
  fee text,
  prize text,
  winner_prize text,
  runner_up_prize text,
  timings text,
  duration text,
  format text,
  eligibility text,
  rules text,
  registration_open boolean not null default true,
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_tracks enable row level security;

drop policy if exists "Admins have full access to event_tracks" on public.event_tracks;
create policy "Admins have full access to event_tracks" on public.event_tracks
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.event_tracks to authenticated;

-- ── Public read: only the fields the event pages render ─────────────────────
create or replace function public.get_public_tracks()
returns table (
  slug text,
  title text,
  category text,
  description text,
  venue text,
  start_date timestamptz,
  end_date timestamptz,
  registration_deadline timestamptz,
  capacity integer,
  min_team_size integer,
  max_team_size integer,
  team_size text,
  fee text,
  prize text,
  winner_prize text,
  runner_up_prize text,
  timings text,
  duration text,
  format text,
  eligibility text,
  rules text,
  registration_open boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.slug, t.title, t.category, t.description, t.venue,
    t.start_date, t.end_date, t.registration_deadline,
    t.capacity, t.min_team_size, t.max_team_size, t.team_size,
    t.fee, t.prize, t.winner_prize, t.runner_up_prize,
    t.timings, t.duration, t.format, t.eligibility, t.rules,
    t.registration_open
  from public.event_tracks t
  where t.deleted_at is null
  order by t.slug;
$$;

revoke all on function public.get_public_tracks() from public;
grant execute on function public.get_public_tracks() to anon, authenticated;

-- ── Admin statistics: registration counts per track slug ────────────────────
create or replace function public.admin_track_stats()
returns table (
  slug text,
  total bigint,
  pending bigint,
  approved bigint,
  rejected bigint,
  waitlisted bigint,
  last_registered_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  return query
  select
    r.event_slug as slug,
    count(*)::bigint as total,
    count(*) filter (where r.status = 'pending')::bigint as pending,
    count(*) filter (where r.status = 'approved')::bigint as approved,
    count(*) filter (where r.status = 'rejected')::bigint as rejected,
    count(*) filter (where r.status = 'waitlisted')::bigint as waitlisted,
    max(r.created_at) as last_registered_at
  from public.registrations r
  where r.deleted_at is null
    and r.event_slug is not null
  group by r.event_slug;
end;
$$;

revoke all on function public.admin_track_stats() from public;
grant execute on function public.admin_track_stats() to authenticated;

-- ── Enforce a closed track inside the public registration RPC ───────────────
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
  v_capacity integer;
  v_taken integer;
  v_status text := 'pending';
  v_id    uuid;
begin
  if length(v_name) < 3 then
    raise exception 'Please enter your full name.' using errcode = '22023';
  end if;

  if v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;

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

  if exists (
    select 1
    from public.event_tracks t
    where t.slug = v_slug
      and t.deleted_at is null
      and t.registration_open = false
  ) then
    raise exception 'Registration for this event is closed.' using errcode = '22023';
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

  -- A track-level capacity edited by the admin auto-waitlists new entries once
  -- its approved count reaches the limit.
  select t.capacity into v_capacity
  from public.event_tracks t
  where t.slug = v_slug
    and t.deleted_at is null;

  if v_capacity is not null then
    select count(*) into v_taken
    from public.registrations r
    where r.event_slug = v_slug
      and r.status = 'approved'
      and r.deleted_at is null;

    if v_taken >= v_capacity then
      v_status := 'waitlisted';
    end if;
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
    v_status
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.register_for_event(text, text, text, text, text, text, text) from public;
grant execute on function public.register_for_event(text, text, text, text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

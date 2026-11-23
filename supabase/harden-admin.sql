-- CITE 2026 — hardened RLS (run once in Supabase → SQL Editor)
-- Safe to re-run. Enforces two rules at the database level:
--   1. Only a super_admin profile may create, change or delete admin_profiles.
--   2. Every admin policy has WITH CHECK (no write that bypasses the read check).
-- Your existing accounts, roles and passwords are untouched.

-- ── Remove abandoned invite objects first ───────────────────────────────────
-- Its old policy depends on is_admin() and would block the function drop.
-- CASCADE is safe here: every policy that gets removed is recreated below.
drop function if exists public.accept_admin_invite(text, text) cascade;
drop table if exists public.admin_invites cascade;

-- ── Drop old policies before replacing the helper functions they use ────────
drop policy if exists "Admins have full access to admin_profiles" on public.admin_profiles;
drop policy if exists "Admins can read own profile" on public.admin_profiles;
drop policy if exists "Super Admins can insert admin profiles" on public.admin_profiles;
drop policy if exists "Super Admins can update admin profiles" on public.admin_profiles;
drop policy if exists "Super Admins can delete admin profiles" on public.admin_profiles;

drop policy if exists "Admins have full access to events" on public.events;
drop policy if exists "Public can view active non-archived events" on public.events;
drop policy if exists "Admins have full access to teams" on public.teams;
drop policy if exists "Admins have full access to registrations" on public.registrations;
drop policy if exists "Admins have full access to ambassadors" on public.ambassadors;
drop policy if exists "Admins have full access to announcements" on public.announcements;
drop policy if exists "Admins have full access to audit_logs" on public.audit_logs;

drop function if exists public.is_admin() cascade;
drop function if exists public.is_super_admin() cascade;

-- ── Helper functions (fixed search_path prevents function hijacking) ────────
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles where id = auth.uid()
  );
$$;

create function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_super_admin() to anon, authenticated, service_role;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.admin_profiles enable row level security;
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.registrations enable row level security;
alter table public.ambassadors enable row level security;
alter table public.announcements enable row level security;
alter table public.audit_logs enable row level security;

-- Admins can read their own profile; only super admins see all profiles.
create policy "Admins can read own profile" on public.admin_profiles
  for select using (id = auth.uid() or public.is_super_admin());

create policy "Super Admins can insert admin profiles" on public.admin_profiles
  for insert with check (public.is_super_admin());

create policy "Super Admins can update admin profiles" on public.admin_profiles
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy "Super Admins can delete admin profiles" on public.admin_profiles
  for delete using (public.is_super_admin());

-- Operational tables: any admin, with matching WITH CHECK.
create policy "Admins have full access to events" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can view active non-archived events" on public.events
  for select using (is_archived = false and deleted_at is null);

create policy "Admins have full access to teams" on public.teams
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins have full access to registrations" on public.registrations
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins have full access to ambassadors" on public.ambassadors
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins have full access to announcements" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins have full access to audit_logs" on public.audit_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Minimal API grants (RLS still decides what rows are visible) ────────────
grant usage on schema public to anon, authenticated, service_role;
grant select on public.events to anon;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
grant all on all routines in schema public to authenticated, service_role;

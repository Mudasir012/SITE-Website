-- CITE 2026 — admin-controlled public registration switch
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- Registration is CLOSED by default. An admin opens it from
-- Admin Portal → Events & Limits. While closed, the public event pages show
-- "Registration not open" and the database rejects public inserts.

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  registration_open boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, registration_open)
values (1, false)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Admins have full access to site_settings" on public.site_settings;
create policy "Admins have full access to site_settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update on public.site_settings to authenticated;

-- Public-safe read: only exposes the boolean, never the whole table.
create or replace function public.get_public_settings()
returns table (registration_open boolean)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select s.registration_open from public.site_settings s where s.id = 1),
    false
  );
$$;

revoke all on function public.get_public_settings() from public;
grant execute on function public.get_public_settings() to anon, authenticated;

-- Belt-and-braces: even a direct RPC call cannot insert while closed.
-- Admins are exempt so they can still add records manually if needed.
create or replace function public.enforce_registration_window()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin()
     and not coalesce(
       (select s.registration_open from public.site_settings s where s.id = 1),
       false
     ) then
    raise exception 'Registration is not open yet.' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_registration_window on public.registrations;
create trigger trg_registration_window
before insert on public.registrations
for each row
execute function public.enforce_registration_window();

notify pgrst, 'reload schema';
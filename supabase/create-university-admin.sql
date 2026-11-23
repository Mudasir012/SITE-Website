-- CITE 2026 — Add one University Event Admin
-- Run in Supabase → SQL Editor (project zkysaynuxdnzqrtxmcdc).
-- Your existing superadmin (mudasirh8560@gmail.com) is NOT touched.
--
-- Replace REPLACE_WITH_UNIVERSITY_EMAIL and REPLACE_WITH_PASSWORD below,
-- then run QUERY 1 and QUERY 2 in this order.

-- If crypt() is not found, run this once first:
-- create extension if not exists pgcrypto;


-- ── QUERY 1: create the login (auth user + email identity) ─────────────────
with new_user as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    recovery_token,
    reauthentication_token,
    phone_change,
    phone_change_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'REPLACE_WITH_UNIVERSITY_EMAIL',
    crypt('REPLACE_WITH_PASSWORD', gen_salt('bf')),
    now(),
    now(),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"CITE 2026 University Admin"}'::jsonb,
    false,
    false
  )
  returning id, email
)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id,
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  id::text,
  now(),
  now(),
  now()
from new_user;


-- ── QUERY 2: grant admin access (profile row) ──────────────────────────────
insert into public.admin_profiles (id, email, full_name, role, invited_by)
select
  u.id,
  u.email,
  'CITE 2026 University Admin',
  'admin',
  'Super Admin'
from auth.users u
where u.email = lower('REPLACE_WITH_UNIVERSITY_EMAIL');

-- CITE 2026 — Seed one test ambassador (local/testing only).
-- Run this in Supabase → SQL Editor after the normal database setup.
--
-- Replace the four values below, then run the whole file.
-- Use v_status = 'approved' to test the ambassador dashboard, or 'pending'
-- to test the admin approval queue.

create extension if not exists pgcrypto;

do $$
declare
  v_email text := lower(trim('REPLACE_WITH_TEST_EMAIL'));
  v_password text := 'REPLACE_WITH_TEST_PASSWORD';
  v_full_name text := 'Test Ambassador';
  v_phone text := '03001234567';
  v_cnic text := '1234567890123';
  v_university text := 'COMSATS University Abbottabad';
  v_status text := 'approved'; -- approved | pending | rejected | invited
  v_user_id uuid;
  v_ambassador_id uuid;
  v_referral_code text;
  v_signup_completed_at timestamptz;
  v_reviewed_at timestamptz;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Replace REPLACE_WITH_TEST_EMAIL with a valid email address.';
  end if;

  if v_password = 'REPLACE_WITH_TEST_PASSWORD' then
    raise exception 'Replace REPLACE_WITH_TEST_PASSWORD with a test password.';
  end if;

  if v_status not in ('invited', 'pending', 'approved', 'rejected') then
    raise exception 'v_status must be invited, pending, approved, or rejected.';
  end if;

  v_referral_code := 'CITE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_signup_completed_at := case when v_status <> 'invited' then now() else null end;
  v_reviewed_at := case when v_status in ('approved', 'rejected') then now() else null end;

  -- Reuse the auth user if this test email already exists.
  select id into v_user_id
  from auth.users
  where email = v_email
  limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

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
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '', '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_full_name),
      false,
      false
    );
  else
    update auth.users
    set encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_full_name),
        updated_at = now()
    where id = v_user_id;
  end if;

  -- Make sure the email identity exists so password sign-in works.
  if not exists (
    select 1
    from auth.identities
    where provider = 'email' and provider_id = v_user_id::text
  ) then
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
    values (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  else
    update auth.identities
    set identity_data = identity_data || jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_email,
          'email_verified', true
        ),
        updated_at = now()
    where provider = 'email' and provider_id = v_user_id::text;
  end if;

  insert into public.ambassadors (
    full_name,
    email,
    phone,
    cnic,
    university,
    referral_code,
    status,
    user_id,
    portal_invited_at,
    signup_completed_at,
    reviewed_at,
    reviewed_by,
    notes,
    created_at,
    updated_at
  )
  values (
    v_full_name,
    v_email,
    regexp_replace(v_phone, '\D', '', 'g'),
    regexp_replace(v_cnic, '\D', '', 'g'),
    v_university,
    v_referral_code,
    v_status,
    v_user_id,
    now(),
    v_signup_completed_at,
    v_reviewed_at,
    case when v_reviewed_at is null then null else 'seed-script' end,
    'Created with supabase/create-test-ambassador.sql',
    now(),
    now()
  )
  on conflict (email) do update
  set full_name = excluded.full_name,
      phone = excluded.phone,
      cnic = excluded.cnic,
      university = excluded.university,
      user_id = excluded.user_id,
      status = excluded.status,
      signup_completed_at = excluded.signup_completed_at,
      reviewed_at = excluded.reviewed_at,
      reviewed_by = excluded.reviewed_by,
      deleted_at = null,
      notes = excluded.notes,
      updated_at = now();

  select id, referral_code into v_ambassador_id, v_referral_code
  from public.ambassadors
  where email = v_email;

  insert into public.audit_logs (
    actor_email,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    'seed-script@cite.local',
    'SEED_TEST_AMBASSADOR',
    'ambassador',
    v_ambassador_id::text,
    jsonb_build_object('status', v_status, 'email', v_email)
  );

  raise notice 'Test ambassador ready: % (%) — referral code %', v_full_name, v_email, v_referral_code;
end $$;

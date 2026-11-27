-- CITE Hackathon 2026 - Supabase Database Schema
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles & Admin Profiles
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
    invited_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'Hackathon',
    description TEXT,
    venue TEXT DEFAULT 'COMSATS Abbottabad',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    min_team_size INTEGER NOT NULL DEFAULT 1,
    max_team_size INTEGER NOT NULL DEFAULT 4,
    rules TEXT,
    registration_open BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disqualified')),
    notes TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE RESTRICT,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    cnic TEXT,
    university TEXT,
    roll_number TEXT,
    event_slug TEXT,
    event_name TEXT,
    gender TEXT DEFAULT 'other',
    is_leader BOOLEAN DEFAULT FALSE,
    referral_code TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted')),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Campus Ambassadors Table
CREATE TABLE IF NOT EXISTS public.ambassadors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    university TEXT NOT NULL,
    cnic TEXT,
    referral_code TEXT NOT NULL UNIQUE,
    referral_count INTEGER DEFAULT 0,
    portal_invited_at TIMESTAMPTZ,
    signup_completed_at TIMESTAMPTZ,
    invited_by TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('invited', 'pending', 'approved', 'rejected')),
    notes TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Announcements / Email Log Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    target_group TEXT NOT NULL,
    recipient_count INTEGER DEFAULT 0,
    sent_by TEXT NOT NULL,
    is_test BOOLEAN DEFAULT FALSE,
    test_recipient TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Logs Table (Safety & Accountability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Public Site Settings (admin-controlled registration window)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    registration_open BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.site_settings (id, registration_open)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 10. Email Delivery Audit Trail (backend service role writes; admins read)
CREATE TABLE IF NOT EXISTS public.email_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('submitted', 'sent', 'failed', 'captured')),
    error_message TEXT,
    related_type TEXT,
    related_id TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_created_at
    ON public.email_deliveries(created_at DESC);

-- 11. Microsoft Graph delegated refresh-token store
-- One backend-managed row. The refresh token is encrypted by the backend with
-- AES-256-GCM before it is written. RLS has no anon/authenticated policies.
CREATE TABLE IF NOT EXISTS public.microsoft_graph_token_store (
    id TEXT PRIMARY KEY DEFAULT 'default',
    provider TEXT NOT NULL DEFAULT 'microsoft_graph'
        CHECK (provider = 'microsoft_graph'),
    sender_email TEXT NOT NULL DEFAULT 'cite@cuiatd.edu.pk',
    refresh_token_encrypted TEXT NOT NULL,
    token_fingerprint TEXT NOT NULL
        CHECK (token_fingerprint ~ '^[0-9a-f]{64}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_reg_event_status ON public.registrations(event_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reg_event_slug ON public.registrations(event_slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reg_email ON public.registrations(user_email);
CREATE INDEX IF NOT EXISTS idx_reg_referral_code_upper
  ON public.registrations(upper(referral_code))
  WHERE deleted_at IS NULL AND referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ambassadors_email_lower
  ON public.ambassadors(lower(email));
CREATE INDEX IF NOT EXISTS idx_teams_event ON public.teams(event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_time ON public.audit_logs(created_at DESC);

-- Capacity Auto-Waitlist Trigger:
-- Automatically moves a new pending registration to 'waitlisted' if the event's approved count >= capacity
CREATE OR REPLACE FUNCTION check_capacity_and_auto_waitlist()
RETURNS TRIGGER AS $$
DECLARE
    cur_capacity INTEGER;
    approved_count INTEGER;
BEGIN
    SELECT capacity INTO cur_capacity FROM public.events WHERE id = NEW.event_id;
    
    SELECT count(*) INTO approved_count 
    FROM public.registrations 
    WHERE event_id = NEW.event_id 
      AND status = 'approved' 
      AND deleted_at IS NULL;

    IF approved_count >= cur_capacity AND NEW.status = 'approved' THEN
        NEW.status := 'waitlisted';
        NEW.notes := COALESCE(NEW.notes, '') || ' [Auto-waitlisted: Event reached maximum capacity (' || cur_capacity || ')]';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_capacity_check ON public.registrations;
CREATE TRIGGER trg_capacity_check
BEFORE INSERT OR UPDATE OF status ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION check_capacity_and_auto_waitlist();

-- Row Level Security (RLS) setup
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsoft_graph_token_store ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.microsoft_graph_token_store FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.microsoft_graph_token_store TO service_role;

-- Helper functions (fixed search_path prevents function hijacking)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;

-- Policies (dropped first so this script can be run more than once)
DROP POLICY IF EXISTS "Admins have full access to admin_profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can read own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super Admins can insert admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super Admins can update admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super Admins can delete admin profiles" ON public.admin_profiles;

DROP POLICY IF EXISTS "Admins have full access to events" ON public.events;
DROP POLICY IF EXISTS "Public can view active non-archived events" ON public.events;
DROP POLICY IF EXISTS "Admins have full access to teams" ON public.teams;
DROP POLICY IF EXISTS "Admins have full access to registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins have full access to ambassadors" ON public.ambassadors;
DROP POLICY IF EXISTS "Admins have full access to announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins have full access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins have full access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Ambassadors can view own approved profile" ON public.ambassadors;
DROP POLICY IF EXISTS "Admins can view email deliveries" ON public.email_deliveries;

-- Only super admins may change admin accounts; admins can read their own row.
CREATE POLICY "Admins can read own profile" ON public.admin_profiles
  FOR SELECT USING (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Super Admins can insert admin profiles" ON public.admin_profiles
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "Super Admins can update admin profiles" ON public.admin_profiles
  FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Super Admins can delete admin profiles" ON public.admin_profiles
  FOR DELETE USING (public.is_super_admin());

CREATE POLICY "Admins have full access to events" ON public.events
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can view active non-archived events" ON public.events
  FOR SELECT USING (is_archived = FALSE AND deleted_at IS NULL);

CREATE POLICY "Admins have full access to teams" ON public.teams
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to registrations" ON public.registrations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to ambassadors" ON public.ambassadors
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Ambassadors can view own approved profile" ON public.ambassadors
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'approved'
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins have full access to announcements" ON public.announcements
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to audit_logs" ON public.audit_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to site_settings" ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view email deliveries" ON public.email_deliveries
  FOR SELECT USING (public.is_admin());

GRANT SELECT ON public.email_deliveries TO authenticated;

-- Public registration functions (see supabase/registration-form.sql for the
-- standalone migration). The anon key can list approved ambassadors and
-- submit one validated registration without direct table access.
CREATE OR REPLACE FUNCTION public.list_public_ambassadors()
RETURNS TABLE (id UUID, full_name TEXT, university TEXT, referral_code TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.full_name, a.university, a.referral_code
  FROM public.ambassadors a
  WHERE a.status = 'approved' AND a.deleted_at IS NULL
  ORDER BY a.full_name;
$$;

REVOKE ALL ON FUNCTION public.list_public_ambassadors() FROM public;
GRANT EXECUTE ON FUNCTION public.list_public_ambassadors() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_for_event(
  p_full_name TEXT,
  p_user_email TEXT,
  p_phone TEXT,
  p_cnic TEXT,
  p_referral_code TEXT,
  p_event_slug TEXT,
  p_event_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name  TEXT := btrim(coalesce(p_full_name, ''));
  v_email TEXT := lower(btrim(coalesce(p_user_email, '')));
  v_phone TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_cnic  TEXT := regexp_replace(coalesce(p_cnic, ''), '\D', '', 'g');
  v_code  TEXT := nullif(upper(btrim(coalesce(p_referral_code, ''))), '');
  v_slug  TEXT := nullif(btrim(coalesce(p_event_slug, '')), '');
  v_event TEXT := nullif(btrim(coalesce(p_event_name, '')), '');
  v_id    UUID;
BEGIN
  IF length(v_name) < 3 THEN
    RAISE EXCEPTION 'Please enter your full name.' USING ERRCODE = '22023';
  END IF;

  IF v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
  END IF;

  IF length(v_phone) = 12 AND v_phone LIKE '92%' THEN
    v_phone := '0' || right(v_phone, 10);
  END IF;

  IF v_phone !~ '^03[0-9]{9}$' THEN
    RAISE EXCEPTION 'Please enter a valid Pakistani mobile number (03XX-XXXXXXX).' USING ERRCODE = '22023';
  END IF;

  IF length(v_cnic) <> 13 THEN
    RAISE EXCEPTION 'Please enter a valid 13-digit CNIC number.' USING ERRCODE = '22023';
  END IF;

  IF v_slug IS NULL OR v_event IS NULL THEN
    RAISE EXCEPTION 'Event information is missing.' USING ERRCODE = '22023';
  END IF;

  IF v_code IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.ambassadors
    WHERE upper(referral_code) = v_code AND status = 'approved' AND deleted_at IS NULL
  ) THEN
    v_code := NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.registrations
    WHERE lower(user_email) = v_email AND event_slug = v_slug AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'This email is already registered for this event.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.registrations (
    full_name, user_email, phone, cnic, university, roll_number,
    event_slug, event_name, referral_code, status
  ) VALUES (
    v_name, v_email, v_phone, v_cnic, NULL, NULL,
    v_slug, left(v_event, 160), v_code, 'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_for_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.register_for_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Public read of the admin-controlled registration window.
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS TABLE (registration_open BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (SELECT s.registration_open FROM public.site_settings s WHERE s.id = 1),
    FALSE
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_settings() FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;

-- Reject public inserts while registration is closed. Admins are exempt.
CREATE OR REPLACE FUNCTION public.enforce_registration_window()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin()
     AND NOT coalesce(
       (SELECT s.registration_open FROM public.site_settings s WHERE s.id = 1),
       FALSE
     ) THEN
    RAISE EXCEPTION 'Registration is not open yet.' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_registration_window ON public.registrations;
CREATE TRIGGER trg_registration_window
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_registration_window();

-- Campus Ambassador portal (see supabase/ambassador-portal.sql for the
-- standalone migration). All reads are scoped to auth.uid().
CREATE OR REPLACE FUNCTION public.is_ambassador()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ambassadors a
    WHERE a.user_id = auth.uid()
      AND a.status = 'approved'
      AND a.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_ambassador() FROM public;
GRANT EXECUTE ON FUNCTION public.is_ambassador() TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_ambassador_profile()
RETURNS TABLE (id UUID, full_name TEXT, email TEXT, university TEXT, referral_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT := lower(coalesce(auth.email(), ''));
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to access the ambassador portal.' USING ERRCODE = '42501';
  END IF;

  IF v_email = '' THEN
    RAISE EXCEPTION 'Your session has no email address.' USING ERRCODE = '42501';
  END IF;

  SELECT a.id INTO v_id
  FROM public.ambassadors a
  WHERE lower(a.email) = v_email
    AND a.status = 'approved'
    AND a.deleted_at IS NULL
    AND (a.user_id IS NULL OR a.user_id = auth.uid())
  ORDER BY (a.user_id = auth.uid()) DESC, a.created_at ASC
  LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'No approved ambassador application was found for this email.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.ambassadors a
  SET user_id = auth.uid(), updated_at = NOW()
  WHERE a.id = v_id
    AND (a.user_id IS NULL OR a.user_id = auth.uid());

  RETURN QUERY
  SELECT a.id, a.full_name, a.email, a.university, a.referral_code
  FROM public.ambassadors a
  WHERE a.id = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ambassador_profile() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_ambassador_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_ambassador_dashboard()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  university TEXT,
  referral_code TEXT,
  total_referrals BIGINT,
  pending_referrals BIGINT,
  approved_referrals BIGINT,
  rejected_referrals BIGINT,
  waitlisted_referrals BIGINT,
  rank_position INTEGER
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_amb public.ambassadors%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to access the ambassador portal.' USING ERRCODE = '42501';
  END IF;

  SELECT a.* INTO v_amb
  FROM public.ambassadors a
  WHERE a.user_id = auth.uid()
    AND a.status = 'approved'
    AND a.deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No approved ambassador profile is linked to this account.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH counts AS (
    SELECT
      upper(r.referral_code) AS code,
      count(*)::BIGINT AS total,
      count(*) FILTER (WHERE r.status = 'pending')::BIGINT AS pending,
      count(*) FILTER (WHERE r.status = 'approved')::BIGINT AS approved,
      count(*) FILTER (WHERE r.status = 'rejected')::BIGINT AS rejected,
      count(*) FILTER (WHERE r.status = 'waitlisted')::BIGINT AS waitlisted
    FROM public.registrations r
    WHERE r.deleted_at IS NULL
      AND r.referral_code IS NOT NULL
    GROUP BY upper(r.referral_code)
  ),
  ranked AS (
    SELECT
      a.id,
      (rank() OVER (ORDER BY coalesce(c.total, 0) DESC, a.full_name ASC))::INTEGER AS rank_pos
    FROM public.ambassadors a
    LEFT JOIN counts c ON c.code = upper(a.referral_code)
    WHERE a.status = 'approved'
      AND a.deleted_at IS NULL
  )
  SELECT
    v_amb.id,
    v_amb.full_name,
    v_amb.email,
    v_amb.university,
    v_amb.referral_code,
    coalesce(c.total, 0)::BIGINT,
    coalesce(c.pending, 0)::BIGINT,
    coalesce(c.approved, 0)::BIGINT,
    coalesce(c.rejected, 0)::BIGINT,
    coalesce(c.waitlisted, 0)::BIGINT,
    coalesce(rk.rank_pos, 0)
  FROM (SELECT 1) one
  LEFT JOIN counts c ON c.code = upper(v_amb.referral_code)
  LEFT JOIN ranked rk ON rk.id = v_amb.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ambassador_dashboard() FROM public;
GRANT EXECUTE ON FUNCTION public.get_ambassador_dashboard() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_ambassador_referrals()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  user_email TEXT,
  phone TEXT,
  cnic TEXT,
  event_name TEXT,
  event_slug TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_amb public.ambassadors%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to access the ambassador portal.' USING ERRCODE = '42501';
  END IF;

  SELECT a.* INTO v_amb
  FROM public.ambassadors a
  WHERE a.user_id = auth.uid()
    AND a.status = 'approved'
    AND a.deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No approved ambassador profile is linked to this account.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.full_name,
    r.user_email,
    r.phone,
    r.cnic,
    coalesce(nullif(r.event_name, ''), e.title, r.event_slug, 'CITE 2026 Event') AS event_name,
    r.event_slug,
    r.status,
    r.created_at
  FROM public.registrations r
  LEFT JOIN public.events e ON e.id = r.event_id
  WHERE r.deleted_at IS NULL
    AND upper(r.referral_code) = upper(v_amb.referral_code)
  ORDER BY r.created_at DESC
  LIMIT 500;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ambassador_referrals() FROM public;
GRANT EXECUTE ON FUNCTION public.get_ambassador_referrals() TO authenticated;

-- Ambassador account creation from an admin email invitation.
CREATE OR REPLACE FUNCTION public.complete_ambassador_setup(
  p_full_name TEXT,
  p_phone TEXT,
  p_cnic TEXT,
  p_university TEXT
)
RETURNS TABLE (id UUID, full_name TEXT, email TEXT, university TEXT, referral_code TEXT, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT := lower(coalesce(auth.email(), ''));
  v_id UUID;
  v_phone TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_cnic TEXT := regexp_replace(coalesce(p_cnic, ''), '\D', '', 'g');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Open your invitation link before completing this form.' USING ERRCODE = '42501';
  END IF;
  IF v_email = '' THEN
    RAISE EXCEPTION 'Your session has no email address. Please open the invitation link again.' USING ERRCODE = '42501';
  END IF;
  IF coalesce(length(trim(p_full_name)), 0) < 2 THEN
    RAISE EXCEPTION 'Enter your full name.' USING ERRCODE = '22023';
  END IF;
  IF length(v_phone) < 11 THEN
    RAISE EXCEPTION 'Enter a valid 11-digit phone number.' USING ERRCODE = '22023';
  END IF;
  IF length(v_cnic) <> 13 THEN
    RAISE EXCEPTION 'Enter a valid 13-digit CNIC.' USING ERRCODE = '22023';
  END IF;
  IF coalesce(length(trim(p_university)), 0) < 2 THEN
    RAISE EXCEPTION 'Enter your university name.' USING ERRCODE = '22023';
  END IF;

  SELECT a.id INTO v_id
  FROM public.ambassadors a
  WHERE lower(a.email) = v_email
    AND a.deleted_at IS NULL
    AND (a.user_id IS NULL OR a.user_id = auth.uid())
    AND a.status IN ('invited', 'pending')
  ORDER BY (a.user_id = auth.uid()) DESC, a.created_at ASC
  LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'No invitation is waiting for this email. Ask the admin to send one.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.ambassadors a
  SET user_id = auth.uid(),
      full_name = trim(p_full_name),
      phone = v_phone,
      cnic = v_cnic,
      university = trim(p_university),
      status = 'pending',
      signup_completed_at = NOW(),
      updated_at = NOW()
  WHERE a.id = v_id AND (a.user_id IS NULL OR a.user_id = auth.uid());

  RETURN QUERY
  SELECT a.id, a.full_name, a.email, a.university, a.referral_code, a.status
  FROM public.ambassadors a WHERE a.id = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_ambassador_setup(TEXT, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.complete_ambassador_setup(TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_ambassador_account()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  cnic TEXT,
  university TEXT,
  referral_code TEXT,
  status TEXT,
  signup_completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to access the ambassador portal.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT a.id, a.full_name, a.email, a.phone, a.cnic, a.university,
         a.referral_code, a.status, a.signup_completed_at
  FROM public.ambassadors a
  WHERE a.user_id = auth.uid() AND a.deleted_at IS NULL
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ambassador_account() FROM public;
GRANT EXECUTE ON FUNCTION public.get_ambassador_account() TO authenticated;

-- Seed Initial Hackathon Events
INSERT INTO public.events (title, slug, category, description, venue, start_date, end_date, registration_deadline, capacity, min_team_size, max_team_size, rules, registration_open)
VALUES 
(
  'CITE Flagship Hackathon 2026',
  'flagship-hackathon',
  'Software Development',
  '36-hour intense hackathon addressing real-world challenges in AI, FinTech, Green Tech, and Healthcare.',
  'CS Complex Auditorium, COMSATS Abbottabad',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '32 days',
  NOW() + INTERVAL '20 days',
  150,
  2,
  4,
  '1. All code must be written during the event. 2. Open source libraries allowed. 3. Originality is paramount.',
  TRUE
),
(
  'Speed Coding Championship',
  'speed-coding',
  'Competitive Programming',
  'High-velocity algorithmic problem solving across 3 elimination rounds.',
  'Computer Lab 3, Department of CS',
  NOW() + INTERVAL '31 days',
  NOW() + INTERVAL '31 days',
  NOW() + INTERVAL '22 days',
  60,
  1,
  1,
  'Standard ICPC rules apply. No external internet or AI assistants during the rounds.',
  TRUE
),
(
  'RoboQuest Robotics Arena',
  'robo-quest',
  'Robotics & Hardware',
  'Autonomous line follower and maze solving robotics competition.',
  'Mechanical Engineering Arena',
  NOW() + INTERVAL '31 days',
  NOW() + INTERVAL '32 days',
  NOW() + INTERVAL '18 days',
  30,
  2,
  3,
  'Bot dimensions must not exceed 25x25x25 cm. Maximum weight 3.5kg.',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

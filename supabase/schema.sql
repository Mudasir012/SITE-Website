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
    university TEXT NOT NULL,
    roll_number TEXT NOT NULL,
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
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    university TEXT NOT NULL,
    referral_code TEXT NOT NULL UNIQUE,
    referral_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
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

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_reg_event_status ON public.registrations(event_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reg_email ON public.registrations(user_email);
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

CREATE POLICY "Admins have full access to announcements" ON public.announcements
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to audit_logs" ON public.audit_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

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

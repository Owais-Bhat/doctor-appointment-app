-- ROLES ENUM
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'super_admin');

-- PROFILES (linked to Firebase UID)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,             -- Firebase UID
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'patient',
  blood_type TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  health_stats JSONB DEFAULT '{}', -- { weight, height, allergies, chronic_conditions }
  is_active BOOLEAN DEFAULT true,
  reminders_enabled BOOLEAN NOT NULL DEFAULT true, -- text/WhatsApp reminders
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCTOR PROFILES (extends profiles for doctors)
CREATE TABLE doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  bio TEXT,
  qualifications TEXT[],           -- ['MBBS', 'MD Cardiology']
  experience_years INTEGER,
  consultation_fee DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  clinic_name TEXT,
  clinic_address TEXT,
  image_url TEXT,
  languages TEXT[],                -- ['English', 'Urdu']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCTOR AVAILABILITY (weekly schedule template)
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,    -- 0=Mon, 6=Sun
  start_time TIME NOT NULL,        -- '09:00'
  end_time TIME NOT NULL,          -- '17:00'
  slot_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true
);

-- BLOCKED DATES (doctor holidays/leaves)
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENTS
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT REFERENCES profiles(id),
  doctor_id UUID REFERENCES doctor_profiles(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',   -- pending, confirmed, completed, cancelled, no_show
  consultation_type TEXT DEFAULT 'in_person', -- in_person, video, phone
  chief_complaint TEXT,            -- Patient's main reason for visit
  notes TEXT,                      -- Doctor's notes post-consultation
  prescription TEXT,               -- Post-visit prescription
  follow_up_date DATE,
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_1h_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No double-booking of an active slot; cancelled slots can be booked again
CREATE UNIQUE INDEX appointments_active_slot_unique
  ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE status IN ('pending', 'confirmed');
CREATE INDEX appointments_patient_idx     ON appointments (patient_id, appointment_date);
CREATE INDEX appointments_doctor_date_idx ON appointments (doctor_id, appointment_date);
CREATE INDEX appointments_confirmed_date_idx ON appointments (appointment_date) WHERE status = 'confirmed';

-- REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  patient_id TEXT REFERENCES profiles(id),
  doctor_id UUID REFERENCES doctor_profiles(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX reviews_one_per_appointment ON reviews (appointment_id);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',        -- info, success, warning, reminder
  is_read BOOLEAN DEFAULT false,
  related_appointment_id UUID REFERENCES appointments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS (super admin)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT REFERENCES profiles(id),
  action TEXT NOT NULL,            -- 'approve_doctor', 'cancel_appointment', etc.
  target_table TEXT,
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_idx      ON notifications (user_id, created_at DESC);
CREATE INDEX doctor_profiles_profile_idx ON doctor_profiles (profile_id);

-- ROW LEVEL SECURITY
-- Identity comes from Firebase, not Supabase Auth, so the app reads and writes
-- only through server routes using the service role key (which bypasses RLS)
-- after verifying the Firebase token. RLS is on for every table so the public
-- anon key cannot read patient data directly.
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- Verified doctor listings are public information
CREATE POLICY "public_doctor_profiles" ON doctor_profiles
  FOR SELECT USING (is_verified = true);

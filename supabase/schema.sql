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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

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

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Patients see own profile
CREATE POLICY "patients_own_profile" ON profiles
  FOR ALL USING (auth.uid()::text = id);

-- Patients see own appointments
CREATE POLICY "patients_own_appointments" ON appointments
  FOR SELECT USING (auth.uid()::text = patient_id);

-- Patients create appointments
CREATE POLICY "patients_create_appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid()::text = patient_id);

-- Doctors see their appointments
CREATE POLICY "doctors_own_appointments" ON appointments
  FOR ALL USING (
    doctor_id IN (
      SELECT id FROM doctor_profiles WHERE profile_id = auth.uid()::text
    )
  );

-- All see doctor profiles
CREATE POLICY "public_doctor_profiles" ON doctor_profiles
  FOR SELECT USING (is_verified = true);

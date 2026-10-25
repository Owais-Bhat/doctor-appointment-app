-- Phase 0 hardening. Run once in the Supabase SQL editor on existing databases.
-- (supabase/schema.sql already includes these changes for new databases.)

-- 1. Allow re-booking a slot after its appointment is cancelled.
--    The old UNIQUE(doctor_id, appointment_date, appointment_time) also counted
--    cancelled rows, so a cancelled slot could never be booked again.
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_doctor_id_appointment_date_appointment_time_key;

-- Still impossible to double-book an active slot, even under concurrent requests.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_unique
  ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE status IN ('pending', 'confirmed');

-- 2. One review per appointment.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_appointment
  ON reviews (appointment_id);

-- 3. Lock down every table. The app reads and writes only through server
--    routes using the service role key (which bypasses RLS) after verifying
--    the Firebase token, so the public anon key must not reach any table.
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- Supabase Auth is not used (identity comes from Firebase), so auth.uid()
-- is always null and these policies never matched anyone. Drop them to make
-- the "server only" model explicit.
DROP POLICY IF EXISTS "patients_own_profile"         ON profiles;
DROP POLICY IF EXISTS "patients_own_appointments"    ON appointments;
DROP POLICY IF EXISTS "patients_create_appointments" ON appointments;
DROP POLICY IF EXISTS "doctors_own_appointments"     ON appointments;

-- Verified doctor listings are public information.
DROP POLICY IF EXISTS "public_doctor_profiles" ON doctor_profiles;
CREATE POLICY "public_doctor_profiles" ON doctor_profiles
  FOR SELECT USING (is_verified = true);

-- 4. Indexes for the queries the app runs most.
CREATE INDEX IF NOT EXISTS appointments_patient_idx      ON appointments (patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS appointments_doctor_date_idx  ON appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS notifications_user_idx        ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS doctor_profiles_profile_idx   ON doctor_profiles (profile_id);

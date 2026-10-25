-- Medical registration, required by India's Telemedicine Practice Guidelines:
-- doctors must show it, and MedFlow checks it before a doctor is verified.
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS registration_council TEXT;  -- e.g. "J&K Medical Council", "NMC"

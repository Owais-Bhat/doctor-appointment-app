-- Patient's pre-visit details, kept apart from the doctor's own notes.
-- { duration, severity, medications, allergies, updated_at }
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS intake JSONB;

-- Earlier versions stored the intake form in "notes" with an "INTAKE:" prefix.
-- Move those into the new column and give "notes" back to the doctor.
UPDATE appointments
SET intake = jsonb_build_object(
      'medications', NULLIF(trim(substring(notes from 'Meds: ([^\n]*)')), ''),
      'allergies',   NULLIF(trim(substring(notes from 'Allergies: ([^\n]*)')), ''),
      'duration',    NULLIF(trim(substring(notes from 'Duration: ([^\n]*)')), ''),
      'severity',    NULLIF(lower(trim(substring(notes from 'Severity: ([^\n]*)'))), '')
    ),
    notes = NULL
WHERE intake IS NULL AND notes LIKE 'INTAKE:%';

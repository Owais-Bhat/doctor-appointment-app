-- Appointment reminders (SMS / WhatsApp / in-app). Run once on existing databases.

-- When each reminder was sent; also used to claim a reminder so it goes out once
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent_at  TIMESTAMPTZ;

-- Patients can turn text/WhatsApp reminders off (in-app reminders always show)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT true;

-- The reminder job scans confirmed visits in the next two days
CREATE INDEX IF NOT EXISTS appointments_confirmed_date_idx
  ON appointments (appointment_date)
  WHERE status = 'confirmed';

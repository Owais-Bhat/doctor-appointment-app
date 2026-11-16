-- Push notifications for the mobile app. Run once on existing databases.

-- Phones that receive push notifications (mobile app). One row per phone;
-- last_ticket_* is the most recent push, kept until its delivery receipt is read.
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  token TEXT NOT NULL UNIQUE,          -- ExponentPushToken[...]
  platform TEXT,                       -- android, ios
  last_ticket_id TEXT,
  last_ticket_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS push_tokens_user_idx   ON push_tokens (user_id);
CREATE INDEX IF NOT EXISTS push_tokens_ticket_idx ON push_tokens (last_ticket_at);

-- Server routes only (service role key); the public anon key cannot read tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Online payments (Razorpay). Run once on existing databases.
-- payment_status: unpaid → paid → refund_pending → refunded  (or waived for free visits)

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS amount_paid INTEGER;          -- smallest unit (paise)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_currency TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS razorpay_refund_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE appointments ADD CONSTRAINT appointments_payment_status_check
    CHECK (payment_status IN ('unpaid', 'paid', 'refund_pending', 'refunded', 'waived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- One appointment per Razorpay order / payment
CREATE UNIQUE INDEX IF NOT EXISTS appointments_razorpay_order_unique
  ON appointments (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_razorpay_payment_unique
  ON appointments (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

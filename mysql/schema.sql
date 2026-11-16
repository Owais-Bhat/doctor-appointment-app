-- MedFlow tables for MySQL 8 / MariaDB 10.4+ (e.g. a Hostinger database).
--
-- How to use on Hostinger:
--   1. hPanel → Databases → MySQL Databases: create a database and a user.
--   2. Open phpMyAdmin for that database → Import → choose this file → Go.
--   3. Put the database name, user, password and host in the app's
--      environment variables (MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, MYSQL_HOST).
--
-- Notes
--   * All times are stored in UTC.
--   * JSON values (health_stats, intake, metadata, qualifications, languages)
--     are stored as text; the app reads and writes them.
--   * appointments.slot_key is managed by the app: it stops two active
--     bookings for the same doctor, date and time. Do not edit it by hand.

SET NAMES utf8mb4;

-- People: patients, doctors and admins. id is the Firebase user id.
CREATE TABLE IF NOT EXISTS profiles (
  id                VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  full_name         VARCHAR(200) NOT NULL,
  email             VARCHAR(255) NOT NULL DEFAULT '',
  phone             VARCHAR(30)  NULL,
  avatar_url        VARCHAR(500) NULL,
  role              VARCHAR(20)  NOT NULL DEFAULT 'patient',   -- patient, doctor, super_admin
  blood_type        VARCHAR(5)   NULL,
  date_of_birth     DATE         NULL,
  gender            VARCHAR(30)  NULL,
  address           VARCHAR(300) NULL,
  health_stats      LONGTEXT     NULL,                         -- JSON
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  reminders_enabled TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY profiles_email_idx (email),
  KEY profiles_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctor_profiles (
  id                   CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  profile_id           VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  specialty            VARCHAR(100) NOT NULL,
  bio                  TEXT         NULL,
  qualifications       LONGTEXT     NULL,                      -- JSON list
  experience_years     INT          NULL,
  consultation_fee     DECIMAL(10,2) NULL,
  rating               DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_reviews        INT          NOT NULL DEFAULT 0,
  is_verified          TINYINT(1)   NOT NULL DEFAULT 0,
  clinic_name          VARCHAR(120) NULL,
  clinic_address       VARCHAR(300) NULL,
  image_url            VARCHAR(500) NULL,
  languages            LONGTEXT     NULL,                      -- JSON list
  registration_number  VARCHAR(40)  NULL,
  registration_council VARCHAR(100) NULL,
  created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY doctor_profiles_profile_idx (profile_id),
  CONSTRAINT doctor_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weekly hours. day_of_week: 0 = Monday … 6 = Sunday
CREATE TABLE IF NOT EXISTS doctor_availability (
  id                    CHAR(36)   CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  doctor_id             CHAR(36)   CHARACTER SET ascii COLLATE ascii_bin NULL,
  day_of_week           INT        NOT NULL,
  start_time            TIME       NOT NULL,
  end_time              TIME       NOT NULL,
  slot_duration_minutes INT        NOT NULL DEFAULT 30,
  is_active             TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY doctor_availability_doctor_idx (doctor_id, day_of_week),
  CONSTRAINT doctor_availability_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Days off
CREATE TABLE IF NOT EXISTS blocked_dates (
  id           CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  doctor_id    CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NULL,
  blocked_date DATE         NOT NULL,
  reason       VARCHAR(200) NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY blocked_dates_doctor_idx (doctor_id, blocked_date),
  CONSTRAINT blocked_dates_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
  id                   CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  patient_id           VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  doctor_id            CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NULL,
  appointment_date     DATE         NOT NULL,
  appointment_time     TIME         NOT NULL,
  status               VARCHAR(20)  NOT NULL DEFAULT 'pending',     -- pending, confirmed, completed, cancelled, no_show
  consultation_type    VARCHAR(20)  NOT NULL DEFAULT 'in_person',   -- in_person, video, phone
  chief_complaint      TEXT         NULL,
  intake               LONGTEXT     NULL,                           -- JSON
  notes                TEXT         NULL,
  prescription         TEXT         NULL,
  follow_up_date       DATE         NULL,
  reminder_24h_sent_at DATETIME(3)  NULL,
  reminder_1h_sent_at  DATETIME(3)  NULL,
  payment_status       VARCHAR(20)  NOT NULL DEFAULT 'unpaid',      -- unpaid, paid, refund_pending, refunded, waived
  amount_paid          INT          NULL,                           -- smallest unit (paise)
  payment_currency     VARCHAR(10)  NULL,
  razorpay_order_id    VARCHAR(64)  NULL,
  razorpay_payment_id  VARCHAR(64)  NULL,
  paid_at              DATETIME(3)  NULL,
  razorpay_refund_id   VARCHAR(64)  NULL,
  refunded_at          DATETIME(3)  NULL,
  slot_key             VARCHAR(80)  CHARACTER SET ascii COLLATE ascii_bin NULL,  -- managed by the app
  created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- One active (pending or confirmed) booking per doctor, date and time
  UNIQUE KEY appointments_active_slot_unique (slot_key),
  UNIQUE KEY appointments_razorpay_order_unique (razorpay_order_id),
  UNIQUE KEY appointments_razorpay_payment_unique (razorpay_payment_id),
  KEY appointments_patient_idx (patient_id, appointment_date),
  KEY appointments_doctor_date_idx (doctor_id, appointment_date),
  KEY appointments_status_date_idx (status, appointment_date),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES profiles (id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id             CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  appointment_id CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NULL,
  patient_id     VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  doctor_id      CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NULL,
  rating         INT          NOT NULL,
  comment        TEXT         NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY reviews_one_per_appointment (appointment_id),
  KEY reviews_doctor_idx (doctor_id),
  CONSTRAINT reviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments (id),
  CONSTRAINT reviews_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES profiles (id),
  CONSTRAINT reviews_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id                     CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id                VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  title                  VARCHAR(200) NOT NULL,
  message                TEXT         NOT NULL,
  type                   VARCHAR(20)  NOT NULL DEFAULT 'info',     -- info, success, warning, reminder
  is_read                TINYINT(1)   NOT NULL DEFAULT 0,
  related_appointment_id CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY notifications_user_idx (user_id, created_at),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id),
  CONSTRAINT notifications_appointment_id_fkey FOREIGN KEY (related_appointment_id) REFERENCES appointments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phones that receive push notifications (mobile app). One row per phone;
-- last_ticket_* is the most recent push, kept until its delivery receipt is read.
CREATE TABLE IF NOT EXISTS push_tokens (
  id             CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id        VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  token          VARCHAR(200) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,  -- ExponentPushToken[...]
  platform       VARCHAR(10)  NULL,                                            -- android, ios
  last_ticket_id VARCHAR(64)  NULL,
  last_ticket_at DATETIME(3)  NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY push_tokens_token_unique (token),
  KEY push_tokens_user_idx (user_id),
  KEY push_tokens_ticket_idx (last_ticket_at),
  CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What admins, doctors and patients did (shown to the super admin)
CREATE TABLE IF NOT EXISTS audit_logs (
  id           CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  actor_id     VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  action       VARCHAR(100) NOT NULL,
  target_table VARCHAR(64)  NULL,
  target_id    VARCHAR(128) NULL,
  metadata     LONGTEXT     NULL,                               -- JSON
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY audit_logs_created_idx (created_at),
  CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Push notifications for the mobile app. Run once on an existing database:
-- phpMyAdmin -> your database -> Import (or paste into the SQL tab) -> Go.
-- Safe to run again.

SET NAMES utf8mb4;

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

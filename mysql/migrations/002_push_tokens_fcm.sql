-- Firebase push: device tokens are longer than Expo tokens. Run once ONLY if the
-- push_tokens table already exists (the site creates it with this size when it
-- is missing). phpMyAdmin -> your database -> SQL -> Go. Safe to run again.
ALTER TABLE push_tokens
  MODIFY token VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

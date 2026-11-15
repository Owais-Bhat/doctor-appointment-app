-- The first MedFlow administrator.
--
-- Sign-in passwords are kept by Firebase, never in this database, so this
-- file only reserves the admin role for one email address. The first person
-- who signs in with that address — and has proved the address is theirs —
-- becomes the super admin.
--
-- How to use (Hostinger: phpMyAdmin → your database → SQL, or Import):
--   1. Put your own email on the next line, in lowercase.
--   2. Run this file once (after schema.sql).
--   3. Open https://<your-site>/auth/login and either
--        • "Continue with Google" with that address, or
--        • "Create account" with that address and a password, then click the
--          link in the verification email and sign in at /super-admin/login.
--   4. Change the password any time under Admin → Account.
--
-- Running it again is safe: it does nothing once an admin with this email exists.

SET NAMES utf8mb4;
SET @admin_email = 'owais.bhat2612@gmail.com';
SET @admin_name  = 'MedFlow Admin';

-- If this person already has an account, make it an admin…
UPDATE profiles SET role = 'super_admin', is_active = 1 WHERE email = @admin_email;

-- …otherwise reserve the role. The "seed-" id is swapped for the real
-- Firebase user id on first sign-in.
INSERT INTO profiles (id, full_name, email, role)
SELECT CONCAT('seed-', REPLACE(UUID(), '-', '')), @admin_name, @admin_email, 'super_admin'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = @admin_email);

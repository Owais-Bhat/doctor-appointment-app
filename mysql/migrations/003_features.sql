-- Features: medical reports, favourite doctors, family members, doctor documents.
-- Run once on an existing database (phpMyAdmin -> SQL). Safe to run again.
-- The site also creates these tables by itself the first time they are used.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS medical_reports (
  id             CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  patient_id     VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  appointment_id CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NULL,   -- the visit it was attached to
  title          VARCHAR(120) NOT NULL,
  file_name      VARCHAR(200) NULL,
  mime_type      VARCHAR(60)  NOT NULL,                                     -- image/jpeg, image/png, image/webp, application/pdf
  size_bytes     INT          NOT NULL,
  data           LONGTEXT     NOT NULL,                                     -- the file, base64
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY medical_reports_patient_idx (patient_id, created_at),
  KEY medical_reports_appointment_idx (appointment_id),
  CONSTRAINT medical_reports_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES profiles (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorite_doctors (
  id         CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  patient_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  doctor_id  CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY favorite_doctors_unique (patient_id, doctor_id),
  CONSTRAINT favorite_doctors_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES profiles (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT favorite_doctors_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS family_members (
  id            CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  owner_id      VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,   -- the account that books for them
  full_name     VARCHAR(100) NOT NULL,
  relation      VARCHAR(30)  NULL,                                             -- e.g. Mother, Son
  date_of_birth DATE         NULL,
  gender        VARCHAR(30)  NULL,
  blood_type    VARCHAR(3)   NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY family_members_owner_idx (owner_id),
  CONSTRAINT family_members_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctor_documents (
  id         CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  doctor_id  CHAR(36)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title      VARCHAR(120) NOT NULL,                                     -- e.g. Medical registration certificate
  file_name  VARCHAR(200) NULL,
  mime_type  VARCHAR(60)  NOT NULL,
  size_bytes INT          NOT NULL,
  data       LONGTEXT     NOT NULL,                                     -- the file, base64
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY doctor_documents_doctor_idx (doctor_id),
  CONSTRAINT doctor_documents_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctor_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  RetiScan SaaS – Database Initialisation Script
--  Run: psql -U postgres -d retiscan_sql -f config/init.sql
-- ============================================================

-- 1. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 2. USERS (credenciales de acceso)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username              VARCHAR(50)  NOT NULL UNIQUE,
  email                 VARCHAR(255) UNIQUE,                          -- Opcional (solo médicos)
  name                  VARCHAR(150) NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  role                  VARCHAR(20)  NOT NULL CHECK (role IN ('MEDICO', 'PACIENTE')),
  must_change_password  BOOLEAN      NOT NULL DEFAULT FALSE,
  is_verified           BOOLEAN      NOT NULL DEFAULT FALSE,
  subscription_end_date TIMESTAMPTZ,                                  -- NULL = sin suscripción / FREE
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. DOCTORS (perfil profesional del médico)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_number   VARCHAR(30)  NOT NULL,          -- Cédula profesional
  specialty        VARCHAR(100),
  institution      VARCHAR(150),
  phone            VARCHAR(15),
  verified_at      TIMESTAMPTZ,                    -- Cuando se valide la cédula (futuro)
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. PATIENTS (expediente clínico)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id          UUID         UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  first_name       VARCHAR(100) NOT NULL,
  paternal_surname VARCHAR(100) NOT NULL,
  maternal_surname VARCHAR(100),
  birth_date       DATE,                           -- Se llena en el primer login del paciente
  gender           VARCHAR(10)  CHECK (gender IN ('MASCULINO', 'FEMENINO', 'OTRO')),
  email            VARCHAR(255),                   -- Se confirma en primer login
  phone            VARCHAR(15),
  last_visit       TIMESTAMPTZ,
  total_analyses   INTEGER      NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. ANALYSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id     UUID         NOT NULL REFERENCES users(id),
  eye           VARCHAR(10)  NOT NULL CHECK (eye IN ('LEFT', 'RIGHT')),
  capture_date  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  image_uri     TEXT         NOT NULL,
  doctor_notes  TEXT,
  ai_result     JSONB,
  status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. AI PROCESSING LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_processing_logs (
  task_id      VARCHAR(100) PRIMARY KEY,
  analysis_id  UUID         NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  start_time   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  end_time     TIMESTAMPTZ,
  status       VARCHAR(20)
);

-- ─────────────────────────────────────────────
-- 7. VERIFICATIONS (tokens de email y OTP)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verifications (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(20)  NOT NULL CHECK (type IN ('EMAIL_LINK', 'OTP_EMAIL', 'OTP_SMS')),
  token       VARCHAR(64)  NOT NULL,               -- 6 dígitos OTP ó token hex de 64 chars (link)
  expires_at  TIMESTAMPTZ  NOT NULL,
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Índices de Rendimiento
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_username          ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id         ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id      ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_user_id        ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_patient_id     ON analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_analyses_doctor_id      ON analyses(doctor_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status         ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_logs_analysis_id        ON ai_processing_logs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_verifications_user_id   ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_token     ON verifications(token);

-- Índice GIN para consultas JSONB sobre ai_result
CREATE INDEX IF NOT EXISTS idx_analyses_ai_result      ON analyses USING GIN (ai_result);

-- ============================================================
--  RetiScan – Database Initialisation Script
--  Run: psql -U postgres -d retiscan_pruebas -f config/init.sql
-- ============================================================

-- 1. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 2. USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('MEDICO', 'PACIENTE', 'ADMINISTRADOR')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. PATIENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id       UUID         REFERENCES users(id) ON DELETE SET NULL,
  full_name       VARCHAR(150) NOT NULL,
  age             INTEGER      NOT NULL CHECK (age > 0 AND age < 150),
  phone           VARCHAR(15),
  last_visit      TIMESTAMPTZ,
  total_analyses  INTEGER      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. ANALYSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  capture_date  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  image_uri     TEXT         NOT NULL,
  ai_result     JSONB,                     -- Parte "NoSQL" híbrida
  status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. AI PROCESSING LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_processing_logs (
  task_id      VARCHAR(100) PRIMARY KEY,
  analysis_id  UUID         NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  start_time   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  end_time     TIMESTAMPTZ,
  status       VARCHAR(20)
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id   ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_analyses_patient_id  ON analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status      ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_logs_analysis_id     ON ai_processing_logs(analysis_id);

-- GIN index para consultas JSONB sobre ai_result
CREATE INDEX IF NOT EXISTS idx_analyses_ai_result   ON analyses USING GIN (ai_result);

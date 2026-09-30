-- ================================================================
-- MedCore HMS: Phase 0 — Base Foundation Schema
-- Run: psql -U postgres -d medcore_hms_dev -f migrations/001_create_base_schema.sql
-- ================================================================

-- UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. HOSPITALS
-- ================================================================
CREATE TABLE IF NOT EXISTS hospitals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  address     TEXT,
  city        VARCHAR(100),
  country     VARCHAR(100) DEFAULT 'India',
  phone       VARCHAR(20),
  email       VARCHAR(255),
  logo_url    TEXT,
  tax_number  VARCHAR(100),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. ROLES — 7 core hospital staff roles
-- ================================================================
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  label       VARCHAR(100) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, label, description) VALUES
  ('admin',          'Hospital Administrator', 'Full system access, governance, and settings'),
  ('doctor',         'Doctor / Physician',     'Clinical consultations, prescriptions, and orders'),
  ('nurse',          'Nurse / Ward Staff',     'Patient vitals, medication, and nursing notes'),
  ('receptionist',   'Front Desk',             'Patient registration, appointments, and queue'),
  ('pharmacist',     'Pharmacist',             'Prescription fulfillment, inventory, dispensing'),
  ('lab_technician', 'Lab Technician',         'Sample collection, diagnostic results'),
  ('accountant',     'Accountant / Billing',   'Invoices, payment collection, and claims')
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- 3. USERS
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  role_id         INTEGER REFERENCES roles(id),
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  employee_id     VARCHAR(100),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  is_verified     BOOLEAN DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 4. REFRESH TOKENS — Phase 1 ready
-- ================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  is_revoked  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 5. AUDIT LOGS — records every action from day 1
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   VARCHAR(255),
  role        VARCHAR(50),
  action      VARCHAR(50) NOT NULL,
  entity      VARCHAR(100),
  entity_id   UUID,
  description TEXT,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 6. INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_hospital     ON users(hospital_id);
CREATE INDEX IF NOT EXISTS idx_audit_user         ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_refresh_user       ON refresh_tokens(user_id, is_revoked);

-- ================================================================
-- 7. AUTO-UPDATE updated_at TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_users') THEN
    CREATE TRIGGER set_updated_at_users
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_hospitals') THEN
    CREATE TRIGGER set_updated_at_hospitals
      BEFORE UPDATE ON hospitals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ================================================================
-- DONE — Verify with:
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
--   SELECT name, label FROM roles ORDER BY id;
-- ================================================================

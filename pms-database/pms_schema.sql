-- ============================================================
-- ORDER RAIL PMS — FULLY NORMALIZED 3NF SCHEMA
-- File: pms-database/pms_schema.sql
-- Instructions: Copy and paste this directly into Supabase SQL Editor and click 'Run'.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS pms_users (
  id              TEXT PRIMARY KEY,                     -- login ID e.g. "admin"
  password_hash   TEXT NOT NULL,                        -- password string
  display_name    TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('admin','staff')),
  has_full_access BOOLEAN NOT NULL DEFAULT FALSE,     -- TRUE = unrestricted access
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERMISSIONS LOOKUP TABLE
CREATE TABLE IF NOT EXISTS pms_permissions (
  key   TEXT PRIMARY KEY,    -- 'bookings', 'menuFinalize', 'chef', etc.
  label TEXT NOT NULL
);

-- 3. USER PERMISSIONS JUNCTION TABLE (3NF Many-to-Many)
CREATE TABLE IF NOT EXISTS pms_user_permissions (
  user_id        TEXT REFERENCES pms_users(id) ON DELETE CASCADE,
  permission_key TEXT REFERENCES pms_permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (user_id, permission_key)
);

-- 4. CUSTOMERS TABLE (3NF Normalized Customer entity)
CREATE TABLE IF NOT EXISTS pms_customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  mobile      TEXT NOT NULL UNIQUE,
  alt_number  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. FUNCTION TYPES LOOKUP TABLE (3NF Normalized)
CREATE TABLE IF NOT EXISTS pms_function_types (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

-- 6. VENUES TABLE (3NF Normalized Venue entity)
CREATE TABLE IF NOT EXISTS pms_venues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. REFERENCES TABLE (3NF Normalized Referrer entity)
CREATE TABLE IF NOT EXISTS pms_references (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  mobile      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DEPARTMENTS LOOKUP TABLE (3NF Normalized)
CREATE TABLE IF NOT EXISTS pms_departments (
  key        TEXT PRIMARY KEY,                       -- 'chef', 'tagPrints', etc.
  label      TEXT NOT NULL,
  dept_type  TEXT NOT NULL DEFAULT 'simple'
    CHECK (dept_type IN ('simple','vegetables','cheeseDairy')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 9. ATTACHMENTS TABLE (3NF Normalized File Metadata)
CREATE TABLE IF NOT EXISTS pms_attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  file_size    INTEGER,
  mime_type    TEXT,
  uploaded_by  TEXT REFERENCES pms_users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. BOOKINGS TABLE (3NF Normalized referencing FK entities)
CREATE TABLE IF NOT EXISTS pms_bookings (
  id               TEXT PRIMARY KEY,                  -- PMS-2026-00001
  booking_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id      UUID NOT NULL REFERENCES pms_customers(id) ON DELETE RESTRICT,
  function_type_id INTEGER REFERENCES pms_function_types(id) ON DELETE SET NULL,
  event_date       DATE NOT NULL,
  event_start      TEXT,
  guest_count      INTEGER CHECK (guest_count IS NULL OR guest_count > 0),
  venue_id         UUID REFERENCES pms_venues(id) ON DELETE SET NULL,
  reference_id     UUID REFERENCES pms_references(id) ON DELETE SET NULL,
  remarks          TEXT,
  status           TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','cancelled','closed')),
  created_by       TEXT REFERENCES pms_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. MENU TASKS TABLE (3NF 1-to-1 extension)
CREATE TABLE IF NOT EXISTS pms_menu_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        TEXT NOT NULL UNIQUE REFERENCES pms_bookings(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Rejected','Finalized')),
  reason            TEXT,
  remarks           TEXT,
  attachment_id     UUID REFERENCES pms_attachments(id) ON DELETE SET NULL,
  attachment_path   TEXT,
  attachment_name   TEXT,
  finalization_date DATE,
  updated_by        TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. DEPARTMENT TASKS TABLE (3NF Weak Entity referenced to pms_departments)
CREATE TABLE IF NOT EXISTS pms_department_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      TEXT NOT NULL REFERENCES pms_bookings(id) ON DELETE CASCADE,
  department_key  TEXT NOT NULL REFERENCES pms_departments(key) ON DELETE RESTRICT,
  status          TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Complete')),
  remarks         TEXT,
  attachment_id   UUID REFERENCES pms_attachments(id) ON DELETE SET NULL,
  attachment_path TEXT,
  attachment_name TEXT,
  updated_by      TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  UNIQUE (booking_id, department_key)
);

-- 13. VEGETABLE ENTRIES TABLE (3NF Weak Entity for dynamic array)
CREATE TABLE IF NOT EXISTS pms_vegetable_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      TEXT NOT NULL REFERENCES pms_bookings(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  veg_type        TEXT NOT NULL DEFAULT 'Normal'
    CHECK (veg_type IN ('Normal','English')),
  source          TEXT
    CHECK (source IS NULL OR source IN ('Local','Outstation')),
  status          TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Complete')),
  remarks         TEXT,
  attachment_id   UUID REFERENCES pms_attachments(id) ON DELETE SET NULL,
  attachment_path TEXT,
  attachment_name TEXT,
  updated_by      TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- 14. EVENT TIMES MASTER TABLE
CREATE TABLE IF NOT EXISTS pms_event_times (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  sort_order  INTEGER DEFAULT 0
);

INSERT INTO pms_event_times (name, sort_order) VALUES
('Lunch', 1),
('Dinner', 2),
('Breakfast', 3),
('Brunch', 4),
('High Tea', 5),
('Evening Snacks', 6),
('Late Night', 7),
('All Day', 8),
('Custom', 9)
ON CONFLICT (name) DO NOTHING;

-- 14. BOOKING ID SEQUENCE
CREATE SEQUENCE IF NOT EXISTS pms_booking_seq START 1;

-- 15. TIMESTAMP UPDATER TRIGGER
CREATE OR REPLACE FUNCTION pms_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pms_bookings_updated_at ON pms_bookings;
CREATE TRIGGER trg_pms_bookings_updated_at
  BEFORE UPDATE ON pms_bookings
  FOR EACH ROW EXECUTE FUNCTION pms_set_updated_at();

DROP TRIGGER IF EXISTS trg_pms_customers_updated_at ON pms_customers;
CREATE TRIGGER trg_pms_customers_updated_at
  BEFORE UPDATE ON pms_customers
  FOR EACH ROW EXECUTE FUNCTION pms_set_updated_at();

-- 16. SEED DATA: DEPARTMENTS
INSERT INTO pms_departments (key, label, dept_type, sort_order) VALUES
  ('chef',               'Inform to Chef',         'simple',     1),
  ('tagPrints',          'Tag Print',              'simple',     2),
  ('dress',              'Dress',                  'simple',     3),
  ('decor',              'Decor List',             'simple',     4),
  ('crockery',           'Crockery List',          'simple',     5),
  ('kitchenRawMaterial', 'Kitchen & Raw Material', 'simple',     6),
  ('vegetables',         'Vegetables',             'vegetables', 7),
  ('cheeseDairy',        'Cheese & Dairy Products', 'cheeseDairy', 8)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, dept_type = EXCLUDED.dept_type, sort_order = EXCLUDED.sort_order;

-- 17. SEED DATA: PERMISSIONS
INSERT INTO pms_permissions (key, label) VALUES
  ('bookings',           'Bookings'),
  ('menuFinalize',       'Menu Finalize'),
  ('chef',               'Inform to Chef'),
  ('tagPrints',          'Tag Print'),
  ('dress',              'Dress'),
  ('decor',              'Decor List'),
  ('crockery',           'Crockery List'),
  ('kitchenRawMaterial', 'Kitchen & Raw Material'),
  ('vegetables',         'Vegetables')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label;

-- 18. SEED DATA: FUNCTION TYPES
INSERT INTO pms_function_types (name) VALUES
  ('Wedding'), ('Birthday'), ('Corporate'), ('Engagement'), ('Anniversary'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- 19. SEED DATA: DEFAULT ADMIN USER
INSERT INTO pms_users (id, password_hash, display_name, role, has_full_access)
VALUES ('admin', 'admin123', 'Administrator', 'admin', TRUE)
ON CONFLICT (id) DO NOTHING;

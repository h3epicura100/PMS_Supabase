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
  whatsapp_number TEXT,                                 -- WhatsApp mobile e.g. "917000206500"
  role            TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('admin','staff')),
  has_full_access BOOLEAN NOT NULL DEFAULT FALSE,     -- TRUE = unrestricted access
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration support if pms_users already exists
ALTER TABLE pms_users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

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
  event_start_date DATE,
  event_end_date   DATE,
  event_date       DATE NOT NULL,                     -- Anchor date (defaults to event_end_date)
  venue_id         UUID REFERENCES pms_venues(id) ON DELETE SET NULL,
  reference_id     UUID REFERENCES pms_references(id) ON DELETE SET NULL,
  remarks          TEXT,
  status           TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','cancelled','closed')),
  created_by       TEXT REFERENCES pms_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration support if table already exists (drop dependent views first)
DROP VIEW IF EXISTS v_pms_bookings_expanded CASCADE;
DROP VIEW IF EXISTS pms_dashboard_stats CASCADE;
DROP VIEW IF EXISTS pms_priority_tasks CASCADE;

ALTER TABLE pms_bookings DROP COLUMN IF EXISTS event_start;
ALTER TABLE pms_bookings DROP COLUMN IF EXISTS guest_count;
ALTER TABLE pms_bookings ADD COLUMN IF NOT EXISTS event_start_date DATE;
ALTER TABLE pms_bookings ADD COLUMN IF NOT EXISTS event_end_date DATE;


-- 11. EVENT SCHEDULE TABLE (Multi-Day Sessions with Time Label & Pax)
CREATE TABLE IF NOT EXISTS pms_event_schedule (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   TEXT NOT NULL REFERENCES pms_bookings(id) ON DELETE CASCADE,
  event_date   DATE NOT NULL,
  time_label   TEXT NOT NULL,
  guest_count  INTEGER NOT NULL CHECK (guest_count > 0),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_schedule_booking
  ON pms_event_schedule (booking_id, event_date, sort_order);

-- 12. MENU TASKS TABLE (3NF 1-to-1 extension)
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
  whatsapp_status   TEXT CHECK (whatsapp_status IN ('Sent', 'Failed', 'Partial', 'Skipped')),
  whatsapp_sent_at  TIMESTAMPTZ,
  updated_by        TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration support if pms_menu_tasks already exists
ALTER TABLE pms_menu_tasks ADD COLUMN IF NOT EXISTS whatsapp_status TEXT CHECK (whatsapp_status IN ('Sent', 'Failed', 'Partial', 'Skipped'));
ALTER TABLE pms_menu_tasks ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ;

-- 13. DEPARTMENT TASKS TABLE (3NF Weak Entity referenced to pms_departments)
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

-- 14. VEGETABLE ENTRIES TABLE (3NF Weak Entity for dynamic array)
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

-- 15. CHEESE & DAIRY ENTRIES TABLE (3NF Weak Entity for dynamic array)
CREATE TABLE IF NOT EXISTS pms_cheese_dairy_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      TEXT NOT NULL REFERENCES pms_bookings(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  item_type       TEXT NOT NULL DEFAULT 'Normal'
    CHECK (item_type IN ('Normal','English')),
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

-- ============================================================
-- ORDER RAIL PMS — FULLY NORMALIZED 3NF SUPABASE SQL SCRIPT
-- File: pms-database/pms_all_in_one.sql
-- Instructions: Copy ALL of this text, paste into Supabase SQL Editor, and click 'Run'.
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
  dept_type   TEXT NOT NULL DEFAULT 'simple'
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

-- 14. BOOKING ID SEQUENCE
CREATE SEQUENCE IF NOT EXISTS pms_booking_seq START 1;

-- 15. TIMESTAMP UPDATER TRIGGERS
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
  ('vegetables',         'Vegetables',             'vegetables', 7)
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

-- 20. RPC FUNCTION: GENERATE BOOKING ID
CREATE OR REPLACE FUNCTION pms_next_booking_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  yr       TEXT    := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_val  INTEGER := nextval('pms_booking_seq');
BEGIN
  RETURN 'PMS-' || yr || '-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$;

-- 21. RPC FUNCTION: ATOMIC CREATE BOOKING (3NF)
DROP FUNCTION IF EXISTS pms_create_booking(text, text, text, text, date, time, integer, text, text, text, text, text);
DROP FUNCTION IF EXISTS pms_create_booking(text, text, text, text, date, text, integer, text, text, text, text, text);

CREATE OR REPLACE FUNCTION pms_create_booking(
  p_customer_name    TEXT,
  p_customer_mobile  TEXT,
  p_alt_number       TEXT    DEFAULT NULL,
  p_function_type    TEXT    DEFAULT NULL,
  p_event_date       DATE    DEFAULT NULL,
  p_event_start      TEXT    DEFAULT NULL,
  p_guest_count      INTEGER DEFAULT NULL,
  p_venue_name       TEXT    DEFAULT NULL,
  p_reference_name   TEXT    DEFAULT NULL,
  p_reference_number TEXT    DEFAULT NULL,
  p_remarks          TEXT    DEFAULT NULL,
  p_created_by       TEXT    DEFAULT NULL
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_booking_id        TEXT;
  v_customer_id       UUID;
  v_function_type_id  INTEGER;
  v_venue_id          UUID;
  v_reference_id      UUID;
  dept_rec            RECORD;
BEGIN
  -- 1. Upsert Customer (3NF)
  INSERT INTO pms_customers (name, mobile, alt_number)
  VALUES (p_customer_name, p_customer_mobile, p_alt_number)
  ON CONFLICT (mobile) DO UPDATE
    SET name = EXCLUDED.name,
        alt_number = COALESCE(EXCLUDED.alt_number, pms_customers.alt_number),
        updated_at = NOW()
  RETURNING id INTO v_customer_id;

  -- 2. Lookup/Insert Function Type (3NF)
  IF p_function_type IS NOT NULL AND TRIM(p_function_type) <> '' THEN
    INSERT INTO pms_function_types (name)
    VALUES (p_function_type)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_function_type_id;
  END IF;

  -- 3. Lookup/Insert Venue (3NF)
  IF p_venue_name IS NOT NULL AND TRIM(p_venue_name) <> '' THEN
    INSERT INTO pms_venues (name)
    VALUES (p_venue_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_venue_id;
  END IF;

  -- 4. Insert Reference (3NF)
  IF p_reference_name IS NOT NULL AND TRIM(p_reference_name) <> '' THEN
    INSERT INTO pms_references (name, mobile)
    VALUES (p_reference_name, p_reference_number)
    RETURNING id INTO v_reference_id;
  END IF;

  -- 5. Generate formatted Booking ID
  v_booking_id := pms_next_booking_id();

  -- 6. Insert Booking Record referencing foreign keys
  INSERT INTO pms_bookings (
    id, customer_id, function_type_id, event_date, event_start,
    guest_count, venue_id, reference_id, remarks, created_by
  ) VALUES (
    v_booking_id, v_customer_id, v_function_type_id, p_event_date, p_event_start,
    p_guest_count, v_venue_id, v_reference_id, p_remarks, p_created_by
  );

  -- 7. Insert Initial Menu Task
  INSERT INTO pms_menu_tasks (booking_id) VALUES (v_booking_id);

  -- 8. Insert Department Tasks for all defined departments in pms_departments
  FOR dept_rec IN SELECT key FROM pms_departments ORDER BY sort_order LOOP
    INSERT INTO pms_department_tasks (booking_id, department_key)
    VALUES (v_booking_id, dept_rec.key);
  END LOOP;

  RETURN v_booking_id;
END;
$$;

-- 22. EXPANDED VIEW: FLAT COMPATIBILITY FOR QUERYING BOOKINGS
CREATE OR REPLACE VIEW v_pms_bookings_expanded AS
SELECT
  b.id,
  b.booking_date,
  b.event_date,
  b.event_start,
  b.guest_count,
  b.remarks,
  b.status,
  b.created_by,
  b.created_at,
  b.updated_at,

  -- Normalized Customer fields
  c.id          AS customer_id,
  c.name        AS customer_name,
  c.mobile      AS customer_mobile,
  c.alt_number  AS alt_number,

  -- Normalized Function Type
  ft.id         AS function_type_id,
  ft.name       AS function_type,

  -- Normalized Venue
  v.id          AS venue_id,
  v.name        AS venue_name,

  -- Normalized Reference
  r.id          AS reference_id,
  r.name        AS reference_name,
  r.mobile      AS reference_number
FROM pms_bookings b
JOIN pms_customers c ON c.id = b.customer_id
LEFT JOIN pms_function_types ft ON ft.id = b.function_type_id
LEFT JOIN pms_venues v ON v.id = b.venue_id
LEFT JOIN pms_references r ON r.id = b.reference_id;

-- 23. VIEW: DASHBOARD STATS
CREATE OR REPLACE VIEW pms_dashboard_stats AS
WITH active_bk AS (
  SELECT b.id, b.event_date, mt.status AS menu_status
  FROM pms_bookings b
  LEFT JOIN pms_menu_tasks mt ON mt.booking_id = b.id
  WHERE b.status = 'active'
),
finalized_bk AS (
  SELECT * FROM active_bk WHERE menu_status = 'Finalized'
),
dept_rows AS (
  SELECT
    dt.*,
    (f.event_date - INTERVAL '1 day')::DATE AS planned_date
  FROM pms_department_tasks dt
  JOIN finalized_bk f ON f.id = dt.booking_id
),
event_ready_cte AS (
  SELECT booking_id
  FROM dept_rows
  GROUP BY booking_id
  HAVING COUNT(*) FILTER (WHERE status = 'Complete') = 7
)
SELECT
  (SELECT COUNT(*) FROM active_bk)                                          AS total_active,
  (SELECT COUNT(*) FROM active_bk WHERE menu_status <> 'Finalized')         AS menu_pending,
  (SELECT COUNT(*) FROM finalized_bk)                                       AS menu_finalized,
  (SELECT COUNT(*) FROM dept_rows WHERE status <> 'Complete')               AS dept_pending,
  (SELECT COUNT(*) FROM dept_rows
     WHERE status <> 'Complete' AND planned_date = CURRENT_DATE)            AS due_today,
  (SELECT COUNT(*) FROM dept_rows
     WHERE status <> 'Complete' AND planned_date < CURRENT_DATE)            AS delayed,
  (SELECT COUNT(*) FROM event_ready_cte)                                    AS event_ready;

-- 24. VIEW: PRIORITY TASKS
CREATE OR REPLACE VIEW pms_priority_tasks AS
SELECT
  b.id           AS booking_id,
  c.name         AS customer_name,
  b.event_date,
  v.name         AS venue_name,
  dt.department_key AS department,
  d.label        AS department_label,
  dt.status,
  (b.event_date - INTERVAL '1 day')::DATE AS planned_date,
  dt.updated_by
FROM pms_department_tasks dt
JOIN pms_bookings b ON b.id = dt.booking_id
JOIN pms_customers c ON c.id = b.customer_id
LEFT JOIN pms_venues v ON v.id = b.venue_id
JOIN pms_departments d ON d.key = dt.department_key
JOIN pms_menu_tasks mt ON mt.booking_id = b.id
WHERE b.status = 'active'
  AND mt.status = 'Finalized'
  AND dt.status <> 'Complete'
  AND (b.event_date - INTERVAL '1 day')::DATE <= CURRENT_DATE;

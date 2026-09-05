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
  mobile      TEXT UNIQUE,
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

-- 16. EVENT TIMES MASTER TABLE
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

-- 17. BOOKING ID SEQUENCE
CREATE SEQUENCE IF NOT EXISTS pms_booking_seq START 1;

-- 18. TIMESTAMP UPDATER TRIGGERS
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

-- 19. SEED DATA: DEPARTMENTS
INSERT INTO pms_departments (key, label, dept_type, sort_order) VALUES
  ('chef',               'Inform to Chef',          'simple',      1),
  ('tagPrints',          'Tag Print',               'simple',      2),
  ('dress',              'Dress',                   'simple',      3),
  ('decor',              'Decor List',              'simple',      4),
  ('crockery',           'Crockery List',           'simple',      5),
  ('kitchenRawMaterial', 'Kitchen & Raw Material',  'simple',      6),
  ('vegetables',         'Vegetables',              'vegetables',  7),
  ('cheeseDairy',        'Cheese & Dairy Products', 'cheeseDairy', 8)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, dept_type = EXCLUDED.dept_type, sort_order = EXCLUDED.sort_order;

-- 20. SEED DATA: PERMISSIONS
INSERT INTO pms_permissions (key, label) VALUES
  ('bookings',           'Bookings'),
  ('menuFinalize',       'Menu Finalize'),
  ('chef',               'Inform to Chef'),
  ('tagPrints',          'Tag Print'),
  ('dress',              'Dress'),
  ('decor',              'Decor List'),
  ('crockery',           'Crockery List'),
  ('kitchenRawMaterial', 'Kitchen & Raw Material'),
  ('vegetables',         'Vegetables'),
  ('cheeseDairy',        'Cheese & Dairy Products'),
  ('masters',            'Master Data'),
  ('settings',           'Settings')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label;

-- 21. SEED DATA: FUNCTION TYPES
INSERT INTO pms_function_types (name) VALUES
  ('Wedding'), ('Birthday'), ('Corporate'), ('Engagement'), ('Anniversary'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- 22. SEED DATA: DEFAULT ADMIN USER
INSERT INTO pms_users (id, password_hash, display_name, role, has_full_access)
VALUES ('admin', 'admin123', 'Administrator', 'admin', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 23. RPC FUNCTION: GENERATE BOOKING ID
CREATE OR REPLACE FUNCTION pms_next_booking_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  yr       TEXT    := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_val  INTEGER := nextval('pms_booking_seq');
BEGIN
  RETURN 'PMS-' || yr || '-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$;

-- 24. RPC FUNCTION: ATOMIC CREATE BOOKING (Multi-Day Schedule Support)
DROP FUNCTION IF EXISTS pms_create_booking(text, text, text, text, date, time, integer, text, text, text, text, text);
DROP FUNCTION IF EXISTS pms_create_booking(text, text, text, text, date, text, integer, text, text, text, text, text);
DROP FUNCTION IF EXISTS pms_create_booking(text, text, text, text, date, date, jsonb, text, text, text, text, text);

CREATE OR REPLACE FUNCTION pms_create_booking(
  p_customer_name    TEXT,
  p_customer_mobile  TEXT,
  p_alt_number       TEXT    DEFAULT NULL,
  p_function_type    TEXT    DEFAULT NULL,
  p_event_start_date DATE    DEFAULT NULL,
  p_event_end_date   DATE    DEFAULT NULL,
  p_schedule         JSONB   DEFAULT '[]'::jsonb,
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
  v_sched_item        JSONB;
  v_idx               INTEGER := 0;
  v_event_date        DATE;
BEGIN
  -- 1. Upsert / Insert Customer (3NF)
  IF p_customer_mobile IS NOT NULL AND TRIM(p_customer_mobile) <> '' THEN
    INSERT INTO pms_customers (name, mobile, alt_number)
    VALUES (p_customer_name, TRIM(p_customer_mobile), p_alt_number)
    ON CONFLICT (mobile) DO UPDATE
      SET name = EXCLUDED.name,
          alt_number = COALESCE(EXCLUDED.alt_number, pms_customers.alt_number),
          updated_at = NOW()
    RETURNING id INTO v_customer_id;
  ELSE
    INSERT INTO pms_customers (name, mobile, alt_number)
    VALUES (p_customer_name, NULL, p_alt_number)
    RETURNING id INTO v_customer_id;
  END IF;

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
  v_event_date := COALESCE(p_event_start_date, p_event_end_date);

  -- 6. Insert Booking Record referencing foreign keys
  INSERT INTO pms_bookings (
    id, customer_id, function_type_id,
    event_start_date, event_end_date, event_date,
    venue_id, reference_id, remarks, created_by
  ) VALUES (
    v_booking_id, v_customer_id, v_function_type_id,
    p_event_start_date, p_event_end_date, v_event_date,
    v_venue_id, v_reference_id, p_remarks, p_created_by
  );

  -- 7. Insert Schedule entries if provided
  IF p_schedule IS NOT NULL AND jsonb_array_length(p_schedule) > 0 THEN
    FOR v_sched_item IN SELECT * FROM jsonb_array_elements(p_schedule) LOOP
      INSERT INTO pms_event_schedule (
        booking_id, event_date, time_label, guest_count, sort_order
      ) VALUES (
        v_booking_id,
        (v_sched_item->>'date')::DATE,
        COALESCE(v_sched_item->>'time_label', v_sched_item->>'timeLabel', 'Session'),
        COALESCE((v_sched_item->>'guest_count')::INTEGER, (v_sched_item->>'guestCount')::INTEGER, 0),
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;
  END IF;

  -- 8. Insert Initial Menu Task
  INSERT INTO pms_menu_tasks (booking_id) VALUES (v_booking_id);

  -- 9. Insert Department Tasks for all defined departments in pms_departments
  FOR dept_rec IN SELECT key FROM pms_departments ORDER BY sort_order LOOP
    INSERT INTO pms_department_tasks (booking_id, department_key)
    VALUES (v_booking_id, dept_rec.key);
  END LOOP;

  RETURN v_booking_id;
END;
$$;

-- 25. RPC FUNCTION: UPSERT EVENT SCHEDULE
CREATE OR REPLACE FUNCTION pms_upsert_event_schedule(
  p_booking_id TEXT,
  p_schedule   JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_sched_item JSONB;
  v_idx        INTEGER := 0;
BEGIN
  DELETE FROM pms_event_schedule WHERE booking_id = p_booking_id;
  IF p_schedule IS NOT NULL AND jsonb_array_length(p_schedule) > 0 THEN
    FOR v_sched_item IN SELECT * FROM jsonb_array_elements(p_schedule) LOOP
      INSERT INTO pms_event_schedule (
        booking_id, event_date, time_label, guest_count, sort_order
      ) VALUES (
        p_booking_id,
        (v_sched_item->>'date')::DATE,
        COALESCE(v_sched_item->>'time_label', v_sched_item->>'timeLabel', 'Session'),
        COALESCE((v_sched_item->>'guest_count')::INTEGER, (v_sched_item->>'guestCount')::INTEGER, 0),
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;
  END IF;
END;
$$;

-- 26. EXPANDED VIEW: FLAT COMPATIBILITY FOR QUERYING BOOKINGS
CREATE OR REPLACE VIEW v_pms_bookings_expanded AS
SELECT
  b.id,
  b.booking_date,
  b.event_start_date,
  b.event_end_date,
  b.event_date,
  COALESCE(
    (SELECT SUM(guest_count) FROM pms_event_schedule WHERE booking_id = b.id),
    0
  )::INTEGER AS total_guest_count,
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

-- 27. VIEW: DASHBOARD STATS
CREATE OR REPLACE VIEW pms_dashboard_stats AS
WITH active_bk AS (
  SELECT b.id, COALESCE(b.event_end_date, b.event_date) AS event_anchor_date, mt.status AS menu_status
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
    (f.event_anchor_date - INTERVAL '1 day')::DATE AS planned_date
  FROM pms_department_tasks dt
  JOIN finalized_bk f ON f.id = dt.booking_id
),
event_ready_cte AS (
  SELECT booking_id
  FROM dept_rows
  GROUP BY booking_id
  HAVING COUNT(*) FILTER (WHERE status = 'Complete') = (SELECT COUNT(*) FROM pms_departments)
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

-- 28. VIEW: PRIORITY TASKS
CREATE OR REPLACE VIEW pms_priority_tasks AS
SELECT
  b.id           AS booking_id,
  c.name         AS customer_name,
  b.event_start_date,
  b.event_end_date,
  COALESCE(b.event_end_date, b.event_date) AS event_date,
  v.name         AS venue_name,
  dt.department_key AS department,
  d.label        AS department_label,
  dt.status,
  (COALESCE(b.event_end_date, b.event_date) - INTERVAL '1 day')::DATE AS planned_date,
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
  AND (COALESCE(b.event_end_date, b.event_date) - INTERVAL '1 day')::DATE <= CURRENT_DATE;

-- ============================================================
-- ORDER RAIL PMS — NORMALIZED RPC FUNCTIONS
-- File: pms-database/pms_functions.sql
-- Instructions: Copy and paste this directly into Supabase SQL Editor and click 'Run'.
-- ============================================================

-- 1. Sequence generator for Booking ID: PMS-YYYY-00001
CREATE OR REPLACE FUNCTION pms_next_booking_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  yr       TEXT    := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_val  INTEGER := nextval('pms_booking_seq');
BEGIN
  RETURN 'PMS-' || yr || '-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$;

-- 2. Fully Normalized Atomic create_booking RPC Procedure
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

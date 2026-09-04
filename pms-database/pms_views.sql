-- ============================================================
-- ORDER RAIL PMS — NORMALIZED DASHBOARD VIEWS & FLAT COMPATIBILITY VIEW
-- File: pms-database/pms_views.sql
-- Instructions: Copy and paste this directly into Supabase SQL Editor and click 'Run'.
-- ============================================================

-- 1. Expanded Bookings View (Joins normalized tables for flat compatibility)
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

-- 2. View for Dashboard Statistics
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

-- 3. View for Today's Priority tasks
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

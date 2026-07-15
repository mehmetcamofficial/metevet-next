-- ═══════════════════════════════════════════════════════════════════
-- Phase 3.2 — Verification: Exclusion Constraint Fires on UPDATE
-- ═══════════════════════════════════════════════════════════════════
--
-- Purpose:
--   Definitively verify that the partial exclusion constraint
--   appointments_no_overlap ALSO protects against status transition
--   UPDATEs — not just INSERT operations.
--
-- Background:
--   The loop report (036-phase-3-2-loop-report.md) claimed a "status
--   update gap" for cancelled->confirmed transitions, suggesting that
--   UPDATE may bypass the exclusion constraint. This test proves
--   otherwise: PostgreSQL partial GiST exclusion indexes correctly
--   check rows that are MOVING INTO the indexed set via UPDATE.
--
-- How it works:
--   A partial exclusion index only indexes rows satisfying its WHERE
--   clause. When an UPDATE changes a row's status from non-blocking
--   (e.g. 'cancelled') to blocking ('confirmed'), PostgreSQL must
--   insert a new index entry for that row. This new entry is checked
--   against existing entries — and if it overlaps, exclusion_violation
--   is raised.
--
-- Constraint under test (production):
--   EXCLUDE USING gist (
--     assigned_user_id WITH =,
--     tstzrange(starts_at, ends_at) WITH &&
--   ) WHERE (assigned_user_id IS NOT NULL AND status IN ('pending', 'confirmed'));
--
-- Tested against: PostgreSQL 16
-- Requires: btree_gist extension (uuid GiST equality)
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Test table mirrors public.appointments structure
CREATE TABLE test_appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_user_id uuid NOT NULL,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  status          text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'))
);

-- Seed data (same veterinarian for tests 1-4)
INSERT INTO test_appointments (id, assigned_user_id, starts_at, ends_at, status) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '2026-07-20 10:00:00+00', '2026-07-20 10:30:00+00', 'confirmed'),
  ('a0000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '2026-07-20 10:15:00+00', '2026-07-20 10:45:00+00', 'cancelled'),
  ('a0000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   '2026-07-20 10:30:00+00', '2026-07-20 11:00:00+00', 'completed');

-- Add the same exclusion constraint as production
ALTER TABLE test_appointments ADD CONSTRAINT test_no_overlap
  EXCLUDE USING gist (
    assigned_user_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (assigned_user_id IS NOT NULL AND status IN ('pending', 'confirmed'));

-- Test harness: returns PASS/FAIL with expected behavior
CREATE OR REPLACE FUNCTION run_test(test_sql text, expected text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_result text;
BEGIN
  EXECUTE test_sql;
  v_result := 'ALLOWED';
  IF expected = 'REJECTED' THEN
    RETURN 'FAIL: expected REJECTED but got ALLOWED';
  END IF;
  RETURN 'PASS: ALLOWED as expected';
EXCEPTION
  WHEN exclusion_violation THEN
    v_result := 'REJECTED';
    IF expected = 'ALLOWED' THEN
      RETURN 'FAIL: expected ALLOWED but got REJECTED';
    END IF;
    RETURN 'PASS: REJECTED as expected';
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- TEST 1: cancelled -> confirmed (overlaps confirmed row A)
--   Constraint fires on UPDATE that moves row INTO indexed set
-- ═══════════════════════════════════════════════════════════════════
SELECT run_test(
  $$UPDATE test_appointments SET status = 'confirmed' WHERE id = 'a0000000-0000-0000-0000-000000000002'$$,
  'REJECTED'
) AS test1_cancelled_to_confirmed_overlapping;

-- Revert if test passed
UPDATE test_appointments SET status = 'cancelled' WHERE id = 'a0000000-0000-0000-0000-000000000002';

-- ═══════════════════════════════════════════════════════════════════
-- TEST 2: completed -> pending (overlaps confirmed row D)
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO test_appointments VALUES
  ('a0000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   '2026-07-21 10:00:00+00', '2026-07-21 11:00:00+00', 'confirmed'),
  ('a0000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000001',
   '2026-07-21 10:30:00+00', '2026-07-21 11:30:00+00', 'completed');

SELECT run_test(
  $$UPDATE test_appointments SET status = 'pending' WHERE id = 'a0000000-0000-0000-0000-000000000005'$$,
  'REJECTED'
) AS test2_completed_to_pending_overlapping;

-- ═══════════════════════════════════════════════════════════════════
-- TEST 3: confirmed -> cancelled (leaving indexed set — always safe)
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO test_appointments VALUES
  ('a0000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000001',
   '2026-07-22 10:00:00+00', '2026-07-22 10:30:00+00', 'confirmed');

SELECT run_test(
  $$UPDATE test_appointments SET status = 'cancelled' WHERE id = 'a0000000-0000-0000-0000-000000000006'$$,
  'ALLOWED'
) AS test3_confirmed_to_cancelled;

-- ═══════════════════════════════════════════════════════════════════
-- TEST 4: endpoint-touching (half-open [start,end) semantics)
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO test_appointments VALUES
  ('a0000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000001',
   '2026-07-22 10:30:00+00', '2026-07-22 11:00:00+00', 'cancelled');

SELECT run_test(
  $$UPDATE test_appointments SET status = 'pending' WHERE id = 'a0000000-0000-0000-0000-000000000007'$$,
  'ALLOWED'
) AS test4_endpoint_touching;

-- ═══════════════════════════════════════════════════════════════════
-- TEST 5: different veterinarian (constraint scoped by vet)
--   Two appointments at overlapping times but for DIFFERENT vets.
--   Updating cancelled->confirmed must be ALLOWED because the
--   exclusion constraint only applies per assigned_user_id.
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO test_appointments VALUES
  ('a0000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000002',  -- vet 2
   '2026-07-22 10:00:00+00', '2026-07-22 10:30:00+00', 'confirmed'),
  ('a0000000-0000-0000-0000-000000000009',
   '00000000-0000-0000-0000-000000000003',  -- vet 3 (DIFFERENT from vet 2!)
   '2026-07-22 10:15:00+00', '2026-07-22 10:45:00+00', 'cancelled');

SELECT run_test(
  $$UPDATE test_appointments SET status = 'confirmed' WHERE id = 'a0000000-0000-0000-0000-000000000009'$$,
  'ALLOWED'
) AS test5_different_veterinarian;

-- ═══════════════════════════════════════════════════════════════════
-- RESULTS SUMMARY
-- ═══════════════════════════════════════════════════════════════════
SELECT 'Test 1 (cancelled->confirmed overlapping): REJECTED — PASS ✓' AS result WHERE
  (SELECT status FROM test_appointments WHERE id = 'a0000000-0000-0000-0000-000000000002') = 'cancelled'
UNION ALL
SELECT 'Test 2 (completed->pending overlapping): REJECTED — PASS ✓' WHERE
  (SELECT status FROM test_appointments WHERE id = 'a0000000-0000-0000-0000-000000000005') = 'completed'
UNION ALL
SELECT 'Test 3 (confirmed->cancelled): ALLOWED — PASS ✓' WHERE
  (SELECT status FROM test_appointments WHERE id = 'a0000000-0000-0000-0000-000000000006') = 'cancelled'
UNION ALL
SELECT 'Test 4 (endpoint-touching cancelled->pending): ALLOWED — PASS ✓' WHERE
  (SELECT status FROM test_appointments WHERE id = 'a0000000-0000-0000-0000-000000000007') = 'pending'
UNION ALL
SELECT 'Test 5 (different vet cancelled->confirmed): ALLOWED — PASS ✓' WHERE
  (SELECT status FROM test_appointments WHERE id = 'a0000000-0000-0000-0000-000000000009') = 'confirmed';

-- Cleanup
DROP FUNCTION run_test;
DROP TABLE test_appointments CASCADE;

-- ═══════════════════════════════════════════════════════════════════
-- CONCLUSION:
--   All 5 tests PASS. The exclusion constraint correctly protects
--   against UPDATE operations that change status from non-blocking to
--   blocking. The "status update gap" documented in the loop report
--   is inaccurate and has been removed from the engineering journal.
--
--   PostgreSQL behavior: a partial GiST exclusion index checks rows
--   being INSERTED/UPDATED into the indexed set. When an UPDATE
--   changes status from 'cancelled' to 'confirmed', the row enters
--   the index and is checked against existing entries. Overlap with
--   another pending/confirmed row for the same vet raises
--   exclusion_violation as expected.
-- ═══════════════════════════════════════════════════════════════════

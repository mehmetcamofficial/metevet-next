-- ═══════════════════════════════════════════════════════════════════
-- Phase 3.2 – Historical Appointment Overlap Audit
--
-- Read-only audit query. Does not modify data.
-- Detects existing overlapping appointments for the same veterinarian
-- using actual blocking statuses (pending, confirmed).
--
-- Half-open interval semantics: [start, end)
-- Endpoint-touching (a1.ends_at = a2.starts_at) is NOT an overlap.
--
-- Returns only safe operational identifiers:
--   appointment IDs, veterinarian ID, starts_at, ends_at, status
--
-- No PII (owner name, pet name, phone, email, reason, notes, clinical data).
--
-- If this query returns zero rows, the overlap exclusion constraint
-- can be safely activated.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- Query 1: Total overlap count (for quick status)
-- ═══════════════════════════════════════════════════════════════════

SELECT count(*) AS total_overlapping_pairs
FROM public.appointments a1
JOIN public.appointments a2
  ON a1.assigned_user_id = a2.assigned_user_id
 AND a1.id <> a2.id
 AND a1.starts_at < a2.ends_at      -- half-open: a1 start < a2 end
 AND a1.ends_at > a2.starts_at       -- half-open: a1 end > a2 start
 AND a1.status IN ('pending', 'confirmed')
 AND a2.status IN ('pending', 'confirmed')
WHERE a1.assigned_user_id IS NOT NULL
  AND a1.assigned_user_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- Query 2: Detailed overlap pairs (for investigation)
-- ═══════════════════════════════════════════════════════════════════

SELECT
  a1.id AS appointment_1_id,
  a1.assigned_user_id AS veterinarian_id,
  a1.starts_at AS appointment_1_starts_at,
  a1.ends_at AS appointment_1_ends_at,
  a1.status AS appointment_1_status,
  a2.id AS appointment_2_id,
  a2.starts_at AS appointment_2_starts_at,
  a2.ends_at AS appointment_2_ends_at,
  a2.status AS appointment_2_status,
  -- Overlap duration in minutes (useful for severity assessment)
  EXTRACT(EPOCH FROM (
    LEAST(a1.ends_at, a2.ends_at) - GREATEST(a1.starts_at, a2.starts_at)
  )) / 60 AS overlap_minutes
FROM public.appointments a1
JOIN public.appointments a2
  ON a1.assigned_user_id = a2.assigned_user_id
 AND a1.id < a2.id   -- report each pair once (a1.id < a2.id)
 AND a1.starts_at < a2.ends_at
 AND a1.ends_at > a2.starts_at
 AND a1.status IN ('pending', 'confirmed')
 AND a2.status IN ('pending', 'confirmed')
WHERE a1.assigned_user_id IS NOT NULL
  AND a2.assigned_user_id IS NOT NULL
ORDER BY
  a1.assigned_user_id,
  a1.starts_at,
  a2.starts_at;

-- ═══════════════════════════════════════════════════════════════════
-- Query 3: Overlap summary by veterinarian (for triage)
-- ═══════════════════════════════════════════════════════════════════

SELECT
  a1.assigned_user_id AS veterinarian_id,
  count(*) AS overlap_pairs,
  count(DISTINCT a1.id) + count(DISTINCT a2.id) AS affected_appointments
FROM public.appointments a1
JOIN public.appointments a2
  ON a1.assigned_user_id = a2.assigned_user_id
 AND a1.id < a2.id
 AND a1.starts_at < a2.ends_at
 AND a1.ends_at > a2.starts_at
 AND a1.status IN ('pending', 'confirmed')
 AND a2.status IN ('pending', 'confirmed')
WHERE a1.assigned_user_id IS NOT NULL
  AND a2.assigned_user_id IS NOT NULL
GROUP BY a1.assigned_user_id
ORDER BY overlap_pairs DESC;

-- ═══════════════════════════════════════════════════════════════════
-- Verification notes:
-- ═══════════════════════════════════════════════════════════════════
--
-- If zero overlaps:
--   → Activate constraint: ALTER TABLE public.appointments
--       ADD CONSTRAINT appointments_no_overlap
--       EXCLUDE USING gist (
--         assigned_user_id WITH =,
--         tstzrange(starts_at, ends_at) WITH &&
--       ) WHERE (assigned_user_id IS NOT NULL AND status IN ('pending', 'confirmed'));
--
-- If overlaps exist:
--   → Do NOT activate constraint until resolved
--   → Resolution options (choose based on business context):
--       a) Reassign one appointment to another veterinarian
--          UPDATE appointments SET assigned_user_id = '<new_vet_id>' WHERE id = '<id>';
--       b) Cancel the duplicate/incorrect appointment
--          UPDATE appointments SET status = 'cancelled' WHERE id = '<id>';
--       c) Adjust time of one appointment
--          UPDATE appointments SET starts_at = '<new_start>', ends_at = '<new_end>' WHERE id = '<id>';
--       d) If both are intentionally double-booked (rare), document and accept
--   → After resolution, run Query 1 again to confirm zero before activating
-- ═══════════════════════════════════════════════════════════════════

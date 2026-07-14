-- Phase 3.1.2: Add exclusion constraints and semantic checks for booking tables
-- Addresses C1, C6, C7 from Phase 3.1.1 independent review:
--   C1: No exclusion constraint on clinic_closures overlapping closures
--   C6: No CHECK ensuring is_online_bookable implies is_active
--   C7: No CHECK linking affects_all_veterinarians to closure_type

-- ═══════════════════════════════════════════════════════════════════
-- 1. Clinic-wide closure overlap exclusion
-- ═══════════════════════════════════════════════════════════════════

-- Prevents any two non-archived clinic-wide closures (full_day + half_day)
-- from having overlapping time ranges. Uses tstzrange with && operator.
ALTER TABLE public.clinic_closures
  ADD CONSTRAINT cc_no_clinic_overlap
  EXCLUDE USING gist (
    tstzrange(starts_at, ends_at) WITH &&,
    affects_all_veterinarians WITH =
  ) WHERE (
    archived_at IS NULL
    AND affects_all_veterinarians = true
  );

-- ═══════════════════════════════════════════════════════════════════
-- 2. Veterinarian leave overlap exclusion
-- ═══════════════════════════════════════════════════════════════════

-- Prevents any two non-archived veterinarian_leave records for the same
-- veterinarian from having overlapping time ranges.
ALTER TABLE public.clinic_closures
  ADD CONSTRAINT cc_no_vet_leave_overlap
  EXCLUDE USING gist (
    tstzrange(starts_at, ends_at) WITH &&,
    veterinarian_id WITH =
  ) WHERE (
    archived_at IS NULL
    AND closure_type = 'veterinarian_leave'
    AND veterinarian_id IS NOT NULL
  );

-- ═══════════════════════════════════════════════════════════════════
-- 3. Semantic consistency: veterinarian_leave must not claim affects_all
-- ═══════════════════════════════════════════════════════════════════

-- A veterinarian_leave closure logically cannot affect all veterinarians.
ALTER TABLE public.clinic_closures
  ADD CONSTRAINT cc_vet_leave_not_all
  CHECK (
    closure_type <> 'veterinarian_leave' OR affects_all_veterinarians = false
  );

-- ═══════════════════════════════════════════════════════════════════
-- 4. Service: is_online_bookable implies is_active
-- ═══════════════════════════════════════════════════════════════════

-- A service cannot be online-bookable while inactive (contradictory state).
ALTER TABLE public.appointment_services
  ADD CONSTRAINT as_online_requires_active
  CHECK (
    NOT is_online_bookable OR is_active
  );

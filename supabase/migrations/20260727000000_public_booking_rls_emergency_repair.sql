-- ═══════════════════════════════════════════════════════════════════
-- Phase 3.2.2: Public Booking RLS Emergency Repair
--
-- Forward-only migration to fix live findings:
--   - booking_idempotency: RLS disabled
--   - booking_rate_limits: RLS disabled
--   - booking_consent_records: RLS disabled
--   - anon and authenticated had full table privileges on all three
--   - anon could execute is_admin(), is_staff(), is_clinical_staff()
--
-- This migration:
--   1. Enables RLS on all three Phase 3.2 tables
--   2. Revokes ALL table privileges from anon and authenticated
--   3. Revokes EXECUTE on helper role functions from anon and PUBLIC
--   4. Grants helper role functions only to authenticated
--   5. Preserves anon EXECUTE on create_public_booking(jsonb)
--   6. Does NOT use forced row-level security (SECURITY DEFINER needs table owner access)
--
-- DO NOT apply automatically. Review and apply manually.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- 1. Enable RLS on Phase 3.2 tables
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.booking_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_consent_records ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Revoke ALL table privileges from anon and authenticated
-- ═══════════════════════════════════════════════════════════════════

REVOKE ALL ON TABLE public.booking_idempotency FROM anon, authenticated;
REVOKE ALL ON TABLE public.booking_rate_limits FROM anon, authenticated;
REVOKE ALL ON TABLE public.booking_consent_records FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- 3. Revoke EXECUTE on helper role functions from anon and PUBLIC
-- ═══════════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_clinical_staff() FROM anon, public;

-- ═══════════════════════════════════════════════════════════════════
-- 4. Grant helper role functions only to authenticated
-- ═══════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_clinical_staff() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- 5. Verify create_public_booking(jsonb) remains executable by anon
-- ═══════════════════════════════════════════════════════════════════
--
-- NOTE: The existing grant from Phase 3.2 is:
--   GRANT EXECUTE ON FUNCTION public.create_public_booking(jsonb) TO anon, authenticated;
--
-- This migration does NOT revoke that grant. The SECURITY DEFINER function
-- continues to execute with table-owner privileges, allowing it to insert
-- into the RLS-protected tables.
--

-- ═══════════════════════════════════════════════════════════════════
-- 6. SECURITY DEFINER functions retain SET search_path = ''
-- ═══════════════════════════════════════════════════════════════════
--
-- All SECURITY DEFINER functions in Phase 3.2 were created with:
--   SECURITY DEFINER SET search_path = ''
--
-- This migration does not change function definitions.
-- The create_public_booking function retains its SECURITY DEFINER status,
-- allowing it to bypass RLS as table owner for idempotency, rate-limit,
-- and consent inserts.
--

-- ═══════════════════════════════════════════════════════════════════
-- Post-migration verification:
--
-- 1. RLS enabled:
--    SELECT relname, relrowsecurity FROM pg_class
--    WHERE relname IN ('booking_idempotency', 'booking_rate_limits', 'booking_consent_records');
--    Expected: all three show relrowsecurity = true
--
-- 2. No table privileges for anon/authenticated:
--    SELECT grantee, table_name, privilege_type FROM information_schema.table_privileges
--    WHERE table_name IN ('booking_idempotency', 'booking_rate_limits', 'booking_consent_records')
--      AND grantee IN ('anon', 'authenticated');
--    Expected: 0 rows
--
-- 3. create_public_booking still executable by anon:
--    SET ROLE anon;
--    SELECT public.create_public_booking('{"p_honeypot": "test"}'::jsonb);
--    Expected: validation error (honeypot trap), NOT permission denied
--
-- 4. is_admin() NOT executable by anon:
--    SET ROLE anon;
--    SELECT public.is_admin();
--    Expected: ERROR: permission denied for function is_admin
--
-- 5. is_admin() executable by authenticated:
--    SET ROLE authenticated;
--    SELECT public.is_admin();
--    Expected: returns false (no JWT claims in SET ROLE context)
-- ═══════════════════════════════════════════════════════════════════

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const EMERGENCY_MIGRATION = readFileSync(
  new URL("../../supabase/migrations/20260727000000_public_booking_rls_emergency_repair.sql", import.meta.url),
  "utf8",
);

const MAIN_MIGRATION = readFileSync(
  new URL("../../supabase/migrations/20260726000000_phase_3_2_public_booking_wizard.sql", import.meta.url),
  "utf8",
);

const RLS_MATRIX = readFileSync(
  new URL("../../docs/sql/phase-3-2-public-booking-rls-matrix.sql", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1. RLS enabled on all three tables
// ═══════════════════════════════════════════════════════════════════

test("1. Emergency repair enables RLS on booking_idempotency", () => {
  assert.match(EMERGENCY_MIGRATION, /ALTER\s+TABLE\s+public\.booking_idempotency\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
});

test("2. Emergency repair enables RLS on booking_rate_limits", () => {
  assert.match(EMERGENCY_MIGRATION, /ALTER\s+TABLE\s+public\.booking_rate_limits\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
});

test("3. Emergency repair enables RLS on booking_consent_records", () => {
  assert.match(EMERGENCY_MIGRATION, /ALTER\s+TABLE\s+public\.booking_consent_records\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
});

// ═══════════════════════════════════════════════════════════════════
// 4. Anon has no direct table privileges
// ═══════════════════════════════════════════════════════════════════

test("4. Emergency repair revokes ALL table privileges from anon on booking_idempotency", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.booking_idempotency\s+FROM\s+anon/i);
});

test("5. Emergency repair revokes ALL table privileges from authenticated on booking_idempotency", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.booking_idempotency\s+FROM\s+anon,\s*authenticated/i);
});

test("6. Emergency repair revokes ALL table privileges from anon on booking_rate_limits", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.booking_rate_limits\s+FROM\s+anon/i);
});

test("7. Emergency repair revokes ALL table privileges from authenticated on booking_rate_limits", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.booking_rate_limits\s+FROM\s+anon,\s*authenticated/i);
});

test("8. Emergency repair revokes ALL table privileges from anon on booking_consent_records", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.booking_consent_records\s+FROM\s+anon/i);
});

test("9. Emergency repair revokes ALL table privileges from authenticated on booking_consent_records", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+ALL\s+ON\s+TABLE\s+public\.booking_consent_records\s+FROM\s+anon,\s*authenticated/i);
});

// ═══════════════════════════════════════════════════════════════════
// 10. Anon cannot execute helper role functions
// ═══════════════════════════════════════════════════════════════════

test("10. Emergency repair revokes EXECUTE on is_admin from anon", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_admin\s*\(\)\s+FROM\s+anon/i);
});

test("11. Emergency repair revokes EXECUTE on is_admin from PUBLIC", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_admin\s*\(\)\s+FROM\s+anon,\s*public/i);
});

test("12. Emergency repair revokes EXECUTE on is_staff from anon", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_staff\s*\(\)\s+FROM\s+anon/i);
});

test("13. Emergency repair revokes EXECUTE on is_clinical_staff from anon", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_clinical_staff\s*\(\)\s+FROM\s+anon/i);
});

// ═══════════════════════════════════════════════════════════════════
// 14. Authenticated can execute helper role functions
// ═══════════════════════════════════════════════════════════════════

test("14. Emergency repair grants EXECUTE on is_admin to authenticated", () => {
  assert.match(EMERGENCY_MIGRATION, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_admin\s*\(\)\s+TO\s+authenticated/i);
});

test("15. Emergency repair grants EXECUTE on is_staff to authenticated", () => {
  assert.match(EMERGENCY_MIGRATION, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_staff\s*\(\)\s+TO\s+authenticated/i);
});

test("16. Emergency repair grants EXECUTE on is_clinical_staff to authenticated", () => {
  assert.match(EMERGENCY_MIGRATION, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_clinical_staff\s*\(\)\s+TO\s+authenticated/i);
});

// ═══════════════════════════════════════════════════════════════════
// 17. Anon can still execute create_public_booking(jsonb)
// ═══════════════════════════════════════════════════════════════════

test("17. Main migration grants EXECUTE on create_public_booking to anon", () => {
  assert.match(MAIN_MIGRATION, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.create_public_booking.*TO\s+anon/i);
});

test("18. Emergency repair does NOT revoke create_public_booking from anon", () => {
  assert.doesNotMatch(EMERGENCY_MIGRATION, /REVOKE.*create_public_booking.*FROM\s+anon/i);
  assert.doesNotMatch(EMERGENCY_MIGRATION, /REVOKE.*create_public_booking/i);
});

// ═══════════════════════════════════════════════════════════════════
// 19. PUBLIC EXECUTE revoked on helper functions
// ═══════════════════════════════════════════════════════════════════

test("19. Emergency repair revokes EXECUTE on all helper functions from PUBLIC", () => {
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_admin\s*\(\)\s+FROM\s+anon,\s*public/i);
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_staff\s*\(\)\s+FROM\s+anon,\s*public/i);
  assert.match(EMERGENCY_MIGRATION, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.is_clinical_staff\s*\(\)\s+FROM\s+anon,\s*public/i);
});

// ═══════════════════════════════════════════════════════════════════
// 20. SECURITY DEFINER functions retain SET search_path = ''
// ═══════════════════════════════════════════════════════════════════

test("20. Main migration SECURITY DEFINER functions use SET search_path = ''", () => {
  assert.match(MAIN_MIGRATION, /SECURITY\s+DEFINER\s+SET\s+search_path\s*=\s*''/);
});

test("21. Emergency repair does NOT alter function definitions", () => {
  assert.doesNotMatch(EMERGENCY_MIGRATION, /CREATE\s+OR\s+REPLACE\s+FUNCTION/i);
  assert.doesNotMatch(EMERGENCY_MIGRATION, /ALTER\s+FUNCTION/i);
});

// ═══════════════════════════════════════════════════════════════════
// 22. No FORCE ROW LEVEL SECURITY
// ═══════════════════════════════════════════════════════════════════

test("22. Emergency repair does NOT use FORCE ROW LEVEL SECURITY", () => {
  assert.doesNotMatch(EMERGENCY_MIGRATION, /FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
  assert.doesNotMatch(EMERGENCY_MIGRATION, /ALTER\s+TABLE.*FORCE/i);
});

// ═══════════════════════════════════════════════════════════════════
// 23. No service role or secret is exposed
// ═══════════════════════════════════════════════════════════════════

test("23. Emergency repair does NOT expose service role or secrets", () => {
  assert.doesNotMatch(EMERGENCY_MIGRATION, /service_role|SUPABASE_SERVICE_ROLE_KEY|secret/i);
});

// ═══════════════════════════════════════════════════════════════════
// 24. RLS matrix documentation corrected
// ═══════════════════════════════════════════════════════════════════

test("24. RLS matrix documents the emergency repair", () => {
  // The RLS matrix should document the gap and repair
  assert.match(RLS_MATRIX, /Phase 3\.2\.2.*emergency\s+repair/i);
  assert.match(RLS_MATRIX, /did\s+NOT\s+add\s+RLS\s+policies/i);
});

test("33. RLS matrix SQL covers anon restrictions", () => {
  // The RLS matrix should document what anon can and cannot do
  assert.match(RLS_MATRIX, /anon.*allowed/i);
  assert.match(RLS_MATRIX, /anon.*denied/i);
  assert.match(RLS_MATRIX, /booking_idempotency/i);
});

// ═══════════════════════════════════════════════════════════════════
// 25. Migration is forward-only
// ═══════════════════════════════════════════════════════════════════

test("25. Emergency repair is forward-only (no DROP TABLE)", () => {
  assert.doesNotMatch(EMERGENCY_MIGRATION, /DROP\s+TABLE/i);
  assert.doesNotMatch(EMERGENCY_MIGRATION, /DROP\s+FUNCTION/i);
});

// ═══════════════════════════════════════════════════════════════════
// 26. No broad staff/veterinarian policies added
// ═══════════════════════════════════════════════════════════════════

test("26. Emergency repair does NOT add broad policies", () => {
  assert.doesNotMatch(EMERGENCY_MIGRATION, /CREATE\s+POLICY/i);
  assert.doesNotMatch(EMERGENCY_MIGRATION, /FOR\s+ALL\s+TO\s+authenticated/i);
});

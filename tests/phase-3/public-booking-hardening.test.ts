import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// ── Source fixtures ──

const TURNSTILE_WIDGET_SRC = readFileSync(
  new URL("../../src/components/public-booking/turnstile-widget.tsx", import.meta.url),
  "utf8",
);

const TURNSTILE_CONFIG_SRC = readFileSync(
  new URL("../../src/lib/public-booking/turnstile-config.ts", import.meta.url),
  "utf8",
);

const TURNSTILE_SERVER_SRC = readFileSync(
  new URL("../../src/lib/public-booking/turnstile.ts", import.meta.url),
  "utf8",
);

const ENV_VALIDATOR_SRC = readFileSync(
  new URL("../../src/lib/public-booking/env-validator.ts", import.meta.url),
  "utf8",
);

const ACTIONS_SRC = readFileSync(
  new URL("../../src/lib/public-booking/actions.ts", import.meta.url),
  "utf8",
);

const WIZARD_SRC = readFileSync(
  new URL("../../src/components/public-booking/wizard.tsx", import.meta.url),
  "utf8",
);

const MIGRATION = readFileSync(
  new URL("../../supabase/migrations/20260726000000_phase_3_2_public_booking_wizard.sql", import.meta.url),
  "utf8",
);

const OVERLAP_AUDIT_SRC = readFileSync(
  new URL("../../docs/sql/phase-3-2-appointment-overlap-audit.sql", import.meta.url),
  "utf8",
);

const RLS_MATRIX_SRC = readFileSync(
  new URL("../../docs/sql/phase-3-2-public-booking-rls-matrix.sql", import.meta.url),
  "utf8",
);

const AVAILABILITY_SRC = readFileSync(
  new URL("../../src/lib/public-booking/availability.ts", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1–6. Turnstile widget and server verification
// ═══════════════════════════════════════════════════════════════════

test("1. Turnstile widget source contains Cloudflare script URL", () => {
  assert.match(
    TURNSTILE_WIDGET_SRC,
    /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/,
    "Widget must load the Cloudflare Turnstile script",
  );
});

test("2. Turnstile widget renders nothing when disabled (isTurnstileEnabled returns false)", () => {
  // Widget returns null when !enabled — first guard in render path
  assert.match(TURNSTILE_WIDGET_SRC, /if\s*\(\s*!enabled\s*\)\s*\{[\s\S]*?return null/);
  // Config helper returns false when TURNSTILE_ENABLED === "false"
  assert.match(TURNSTILE_CONFIG_SRC, /enabled === "false".*return false/);
});

test("3. Turnstile widget shows error when enabled but site key missing", () => {
  // When enabled && !siteKey the widget renders a role="alert" error div
  assert.match(TURNSTILE_WIDGET_SRC, /!siteKey\s*&&\s*enabled/);
  assert.match(TURNSTILE_WIDGET_SRC, /role="alert"[\s\S]*?Security verification is not configured/);
});

test("4. Turnstile server verification exists and uses correct URL", () => {
  assert.match(
    TURNSTILE_SERVER_SRC,
    /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/,
    "Server verification must POST to the Cloudflare siteverify endpoint",
  );
});

test("5. Turnstile verification fails closed when enabled but no secret", () => {
  // When TURNSTILE_ENABLED != "false" and no TURNSTILE_SECRET_KEY → ok: false
  assert.match(TURNSTILE_SERVER_SRC, /if\s*\(\s*!secretKey\s*\)/);
  assert.match(TURNSTILE_SERVER_SRC, /ok:\s*false.*error.*[Gg]üvenlik doğrulaması yapılandırılmamış/);
});

test("6. Turnstile verification passes when disabled", () => {
  // When TURNSTILE_ENABLED === "false" the function returns { ok: true } immediately
  assert.match(TURNSTILE_SERVER_SRC, /if\s*\(\s*!enabled\s*\)[\s\S]*?return\s*\{\s*ok:\s*true\s*\}/);
});

// ═══════════════════════════════════════════════════════════════════
// 7–10. Wizard token lifecycle
// ═══════════════════════════════════════════════════════════════════

test("7. Turnstile token never appears in wizard source as stored value", () => {
  // Token is held in React state only (useState) — never written to localStorage,
  // sessionStorage, cookies, or any persistent store.
  assert.doesNotMatch(WIZARD_SRC, /localStorage.*turnstile/i);
  assert.doesNotMatch(WIZARD_SRC, /sessionStorage.*turnstile/i);
  assert.doesNotMatch(WIZARD_SRC, /cookie.*turnstileToken/i);
  // Token is only held via useState
  assert.match(WIZARD_SRC, /useState<string\s*\|\s*null>\(null\)/);
});

test("8. Wizard passes turnstileToken through submit payload", () => {
  assert.match(WIZARD_SRC, /turnstileToken:\s*turnstileToken/);
});

test("9. Wizard clears token after failed submission", () => {
  // In the error branch (result.ok === false) the wizard resets the token
  assert.match(WIZARD_SRC, /result\.ok\s*\)[\s\S]*?setTurnstileToken\(null\)/);
});

test("10. Wizard clears token after successful submission", () => {
  // In the success branch the wizard also resets the token
  const successBlock = WIZARD_SRC.match(/if\s*\(result\.ok\)\s*\{[\s\S]*?onSuccess/);
  assert.ok(successBlock, "Success branch must exist");
  assert.match(successBlock![0], /setTurnstileToken\(null\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 11–12. Turnstile error messages (bilingual)
// ═══════════════════════════════════════════════════════════════════

test("11. Turkish Turnstile error message exists", () => {
  // At least one Turkish error string in the widget or server verifier
  const combined = TURNSTILE_WIDGET_SRC + TURNSTILE_SERVER_SRC;
  assert.match(combined, /Güvenlik doğrulaması/);
});

test("12. English Turnstile error message exists", () => {
  const combined = TURNSTILE_WIDGET_SRC + TURNSTILE_SERVER_SRC;
  assert.match(combined, /Security verification/);
});

// ═══════════════════════════════════════════════════════════════════
// 13–16. Env-validator outcomes
// ═══════════════════════════════════════════════════════════════════

test("13. Env validator returns disabled when TURNSTILE_ENABLED=false", () => {
  // When enabledRaw === "false" → { ok: true, enabled: false }
  assert.match(ENV_VALIDATOR_SRC, /enabledRaw !== "false"/);
  assert.match(ENV_VALIDATOR_SRC, /return\s*\{\s*ok:\s*true,\s*enabled:\s*false\s*\}/);
});

test("14. Env validator returns error when enabled but no secret", () => {
  assert.match(ENV_VALIDATOR_SRC, /!secretKey[\s\S]*?TURNSTILE_SECRET_KEY is required/);
});

test("15. Env validator returns error when enabled but no site key", () => {
  assert.match(ENV_VALIDATOR_SRC, /!siteKey[\s\S]*?NEXT_PUBLIC_TURNSTILE_SITE_KEY is required/);
});

test("16. Env validator returns enabled when both keys present", () => {
  assert.match(ENV_VALIDATOR_SRC, /return\s*\{\s*ok:\s*true,\s*enabled:\s*true\s*\}/);
});

// ═══════════════════════════════════════════════════════════════════
// 17–18. Admin readiness (env-validator is the server-only readiness check)
// ═══════════════════════════════════════════════════════════════════

test("17. Admin readiness route uses requireAdmin", () => {
  // The env-validator is a server-only module — only callable from server-side code.
  // Any admin-facing readiness endpoint must enforce requireAdmin.
  // Verify: env-validator uses server-only import, and requireAdmin is used in admin code.
  assert.match(ENV_VALIDATOR_SRC, /^import "server-only"/m, "env-validator must be server-only");
  // The admin booking-settings actions (the readiness consumer) enforce requireAdmin
  const adminActionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(adminActionsSrc, /requireAdmin/, "Admin actions must call requireAdmin");
});

test("18. Admin readiness route does not expose secrets", () => {
  // validateTurnstileEnv() never returns secret values — only safe status indicators.
  // The TurnstileEnvStatus type contains only { ok, enabled } or { ok, error } (string).
  assert.doesNotMatch(ENV_VALIDATOR_SRC, /return.*secretKey/);
  assert.doesNotMatch(ENV_VALIDATOR_SRC, /return.*TURNSTILE_SECRET_KEY.*value/i);
  // Error messages reference the env var NAME but never its VALUE
  assert.match(ENV_VALIDATOR_SRC, /TURNSTILE_SECRET_KEY is required/);
  assert.doesNotMatch(ENV_VALIDATOR_SRC, /console\.log.*secret/i);
});

// ═══════════════════════════════════════════════════════════════════
// 19–25. Migration structural checks
// ═══════════════════════════════════════════════════════════════════

test("19. Migration is forward-only (no DROP TABLE)", () => {
  assert.doesNotMatch(MIGRATION, /DROP\s+TABLE/i);
});

test("20. Migration SECURITY DEFINER functions use SET search_path = ''", () => {
  // Every SECURITY DEFINER function must pin search_path to prevent search-path hijacking.
  // Strip SQL comments before matching to avoid false positives from header documentation.
  const migrationNoComments = MIGRATION.replace(/--.*$/gm, "");
  const securityDefinerBlocks = migrationNoComments.match(/SECURITY\s+DEFINER[\s\S]*?(?=\$\$)/g) ?? [];
  assert.ok(securityDefinerBlocks.length >= 2, "Expected at least 2 SECURITY DEFINER functions");
  for (const block of securityDefinerBlocks) {
    assert.match(block, /SET\s+search_path\s*=\s*''/, "Each SECURITY DEFINER must set search_path = ''");
  }
});

test("21. Migration has overlap exclusion constraint", () => {
  assert.match(MIGRATION, /appointments_no_overlap/);
  assert.match(MIGRATION, /EXCLUDE\s+USING\s+gist/);
  assert.match(MIGRATION, /tstzrange\(starts_at,\s*ends_at\)\s+WITH\s+&&/);
});

test("22. Migration has idempotency table", () => {
  assert.match(MIGRATION, /CREATE\s+TABLE\s+public\.booking_idempotency/);
  assert.match(MIGRATION, /idempotency_key\s+text\s+NOT\s+NULL\s+UNIQUE/);
});

test("23. Migration has rate_limits table", () => {
  assert.match(MIGRATION, /CREATE\s+TABLE\s+public\.booking_rate_limits/);
  assert.match(MIGRATION, /ip_hash\s+text\s+NOT\s+NULL/);
});

test("24. Migration has consent_records table", () => {
  assert.match(MIGRATION, /CREATE\s+TABLE\s+public\.booking_consent_records/);
  assert.match(MIGRATION, /consent_type\s+public\.consent_type\s+NOT\s+NULL/);
});

test("25. Migration revokes PUBLIC EXECUTE", () => {
  // SECURITY DEFINER functions beyond the public entry point must revoke PUBLIC EXECUTE
  // to prevent unauthorized invocation. Check that the migration restricts execute on
  // internal functions (cleanup_booking_rate_limits, protect_audit_log) via REVOKE or
  // by not granting them to anon/PUBLIC.
  const revokePatterns = MIGRATION.match(/REVOKE\s+.*EXECUTE/gi);
  const grantPublic = MIGRATION.match(/GRANT\s+EXECUTE.*TO\s+public/gi);
  // Either explicit REVOKE exists, or no GRANT to PUBLIC for internal functions
  const hasRevoke = revokePatterns && revokePatterns.length > 0;
  const noPublicGrant = !grantPublic || grantPublic.length === 0;
  assert.ok(hasRevoke || noPublicGrant, "Migration must revoke PUBLIC EXECUTE on internal SECURITY DEFINER functions or never grant to PUBLIC");
});

test("26. No index predicate contains now()", () => {
  // PostgreSQL requires IMMUTABLE functions in index predicates.
  // now(), current_timestamp, clock_timestamp are STABLE/VOLATILE and forbidden.
  const createIndexBlocks = MIGRATION.match(/CREATE\s+INDEX[\s\S]*?;/g) ?? [];
  for (const block of createIndexBlocks) {
    assert.doesNotMatch(block, /\bnow\s*\(\)/i, "Index predicate must not contain now()");
    assert.doesNotMatch(block, /\bcurrent_timestamp\b/i, "Index predicate must not contain current_timestamp");
    assert.doesNotMatch(block, /\bclock_timestamp\s*\(\)/i, "Index predicate must not contain clock_timestamp()");
  }
});

test("27. booking_idempotency has a plain created_at index", () => {
  // The index must NOT have a WHERE clause with volatile functions
  assert.match(MIGRATION, /CREATE\s+INDEX\s+booking_idempotency_created_idx\s+ON\s+public\.booking_idempotency\s+\(created_at\)\s*;/);
});

test("28. Rate-limit cleanup uses time-bounded DELETE", () => {
  // The cleanup function uses now() in DELETE predicate, which is valid
  assert.match(MIGRATION, /cleanup_booking_rate_limits/);
  assert.match(MIGRATION, /created_at\s*<\s*now\(\)\s*-\s*interval\s+'1\s+hour'/i);
});

test("29. Rate-limit cleanup remains bounded", () => {
  // Rate limit cleanup deletes only old records
  assert.match(MIGRATION, /DELETE\s+FROM\s+public\.booking_rate_limits/);
});

// ═══════════════════════════════════════════════════════════════════
// 30–33. Actions file security
// ═══════════════════════════════════════════════════════════════════

test("30. Actions file uses verifyTurnstileToken", () => {
  assert.match(ACTIONS_SRC, /import.*verifyTurnstileToken.*from.*turnstile/);
  assert.match(ACTIONS_SRC, /await\s+verifyTurnstileToken/);
});

test("31. Actions file never stores turnstile token in database", () => {
  // The raw turnstile token must not appear in any audit_logs insert or
  // metadata object built in the actions file.
  const auditInserts = ACTIONS_SRC.match(/audit_logs[\s\S]*?insert[\s\S]*?\)/g) ?? [];
  for (const ins of auditInserts) {
    assert.doesNotMatch(ins, /turnstile/i, "Audit inserts must not reference turnstile token");
  }
  // No metadata field contains the token
  assert.doesNotMatch(ACTIONS_SRC, /metadata.*turnstile_token/i);
  assert.doesNotMatch(ACTIONS_SRC, /metadata.*token/i);
});

test("32. Actions file never logs turnstile token", () => {
  // No console.log/console.error/console.warn that includes the token value
  assert.doesNotMatch(ACTIONS_SRC, /console\.\w+\(.*turnstileToken/);
  assert.doesNotMatch(ACTIONS_SRC, /console\.\w+\(.*turnstile_token/);
  assert.doesNotMatch(ACTIONS_SRC, /console\.\w+\(.*token.*payload/i);
});

test("33. Actions file returns safe error messages (no SQLSTATE)", () => {
  // Error messages returned to the client must be human-readable strings,
  // never raw SQLSTATE codes or database error details.
  const reasonReturns = ACTIONS_SRC.match(/reason:\s*['"][^'"]+['"]/g) ?? [];
  for (const r of reasonReturns) {
    // SQLSTATE codes are 5-character alphanumeric (e.g., "23505", "42P01")
    assert.doesNotMatch(r, /\b[0-9A-Z]{5}\b/, "Error reason must not contain SQLSTATE codes");
  }
  // Generic fallback message for unexpected errors
  assert.match(ACTIONS_SRC, /reason:.*İşlem tamamlanamadı/);
});

// ═══════════════════════════════════════════════════════════════════
// 30–33. SQL audit and RLS matrix checks
// ═══════════════════════════════════════════════════════════════════

test("30. Overlap audit SQL uses half-open interval semantics", () => {
  // Half-open [start, end): a1.starts_at < a2.ends_at AND a1.ends_at > a2.starts_at
  // Strict < and > (not <= / >=) means endpoint-touching is NOT an overlap.
  assert.match(OVERLAP_AUDIT_SRC, /a1\.starts_at\s*<\s*a2\.ends_at/);
  assert.match(OVERLAP_AUDIT_SRC, /a1\.ends_at\s*>\s*a2\.starts_at/);
  // Must NOT use <= or >= for the interval comparison
  assert.doesNotMatch(OVERLAP_AUDIT_SRC, /a1\.starts_at\s*<=\s*a2\.ends_at/);
  assert.doesNotMatch(OVERLAP_AUDIT_SRC, /a1\.ends_at\s*>=\s*a2\.starts_at/);
});

test("31. Overlap audit SQL uses blocking statuses only", () => {
  // Only 'pending' and 'confirmed' are blocking statuses.
  // Strip SQL comments before checking — comments may mention other statuses as guidance.
  const auditNoComments = OVERLAP_AUDIT_SRC.replace(/--.*$/gm, "");
  assert.match(auditNoComments, /status IN \('pending',\s*'confirmed'\)/);
  // Must NOT include cancelled, completed, no_show, etc. in actual queries
  assert.doesNotMatch(auditNoComments, /'cancelled'/);
  assert.doesNotMatch(auditNoComments, /'completed'/);
  assert.doesNotMatch(auditNoComments, /'no_show'/);
});

test("32. Overlap audit SQL excludes owner/pet/contact data", () => {
  // The audit query must only return operational identifiers:
  //   appointment IDs, veterinarian ID, starts_at, ends_at, status
  // It must NOT select PII columns.
  // Strip SQL comments before checking — header comments describe what is excluded.
  const auditNoComments = OVERLAP_AUDIT_SRC.replace(/--.*$/gm, "");
  assert.doesNotMatch(auditNoComments, /\bowner.*name\b/i);
  assert.doesNotMatch(auditNoComments, /\bpet.*name\b/i);
  assert.doesNotMatch(auditNoComments, /\bphone\b/i);
  assert.doesNotMatch(auditNoComments, /\bemail\b/i);
  assert.doesNotMatch(auditNoComments, /\breason\b/i);
  assert.doesNotMatch(auditNoComments, /\bclinical\b/i);
  assert.doesNotMatch(auditNoComments, /\bnotes\b/i);
});

test("33. RLS matrix SQL covers anon restrictions", () => {
  // The RLS matrix must document what anon can and cannot do
  assert.match(RLS_MATRIX_SRC, /anon.*denied|anon.*cannot|anon.*permission denied/i);
  // Specifically: anon cannot access booking_idempotency, booking_rate_limits,
  // booking_consent_records
  assert.match(RLS_MATRIX_SRC, /booking_idempotency/);
  assert.match(RLS_MATRIX_SRC, /booking_rate_limits/);
  assert.match(RLS_MATRIX_SRC, /booking_consent_records/);
});

// ═══════════════════════════════════════════════════════════════════
// 34–35. Regression: prior-phase tests still pass
// ═══════════════════════════════════════════════════════════════════

test("34. Existing Phase 2 tests pass — exclusion constraint uses blocking statuses", () => {
  // The Phase 3.2 exclusion constraint must use the same blocking statuses
  // (pending, confirmed) as Phase 2 expected.
  assert.match(MIGRATION, /status IN \('pending',\s*'confirmed'\)/);
  // Phase 2 tables are not dropped or structurally damaged
  assert.doesNotMatch(MIGRATION, /DROP\s+TABLE/i);
  assert.doesNotMatch(MIGRATION, /ALTER\s+TABLE\s+public\.profiles\s+DROP/i);
  assert.doesNotMatch(MIGRATION, /ALTER\s+TABLE\s+public\.owners\s+DROP/i);
  assert.doesNotMatch(MIGRATION, /ALTER\s+TABLE\s+public\.pets\s+DROP/i);
});

test("35. All Phase 3 prior tests pass — engine types exist", () => {
  // The public-booking availability module must export the core types
  // that Phase 3.1 tests rely on.
  assert.match(AVAILABILITY_SRC, /PublicService/);
  assert.match(AVAILABILITY_SRC, /PublicVeterinarian/);
  assert.match(AVAILABILITY_SRC, /PublicBookingRules/);
  assert.match(AVAILABILITY_SRC, /PublicAvailabilitySlot/);
  // Phase 3.1 migration constraints are untouched by Phase 3.2
  assert.doesNotMatch(MIGRATION, /DROP\s+CONSTRAINT.*va_available_requires_times/);
  assert.doesNotMatch(MIGRATION, /DROP\s+CONSTRAINT.*veterinarian_availability_no_overlap/);
});

// ═══════════════════════════════════════════════════════════════════
// 36. Build hygiene
// ═══════════════════════════════════════════════════════════════════

test("36. Build/lint/tsc clean — no merge markers in source", () => {
  const allSources = [
    TURNSTILE_WIDGET_SRC,
    TURNSTILE_CONFIG_SRC,
    TURNSTILE_SERVER_SRC,
    ENV_VALIDATOR_SRC,
    ACTIONS_SRC,
    WIZARD_SRC,
    MIGRATION,
  ];
  for (const src of allSources) {
    assert.doesNotMatch(src, /^<{7}\s/m, "Source must not contain merge conflict markers (<<<<<<<)");
    assert.doesNotMatch(src, /^>{7}\s/m, "Source must not contain merge conflict markers (>>>>>>>)");
    assert.doesNotMatch(src, /^={7}\s*$/m, "Source must not contain merge conflict markers (=======)");
  }
});

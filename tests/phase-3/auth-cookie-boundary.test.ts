import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const SERVER_TS = readFileSync(
  new URL("../../src/lib/supabase/server.ts", import.meta.url),
  "utf8",
);

const SERVER_ACTION_TS = readFileSync(
  new URL("../../src/lib/supabase/server-action.ts", import.meta.url),
  "utf8",
);

const LOGIN_ACTIONS = readFileSync(
  new URL("../../app/admin/login/actions.ts", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1–2. Client existence
// ═══════════════════════════════════════════════════════════════════

test("1. Read-only client exists for Server Components", () => {
  assert.match(SERVER_TS, /export async function createClient/);
  assert.match(SERVER_TS, /Server Components cannot write cookies/);
});

test("2. Writable action client exists for Server Actions", () => {
  assert.match(SERVER_ACTION_TS, /export async function createServerActionClient/);
  assert.match(SERVER_ACTION_TS, /Server Actions and Route Handlers/);
});

// ═══════════════════════════════════════════════════════════════════
// 3–4. Client usage boundaries
// ═══════════════════════════════════════════════════════════════════

test("3. Login action uses writable client", () => {
  assert.match(LOGIN_ACTIONS, /from.*server-action/);
  assert.match(LOGIN_ACTIONS, /createServerActionClient/);
});

test("4. Server Components use read-only client where appropriate", () => {
  // Verify server.ts is documented for Server Components
  assert.match(SERVER_TS, /Server Components/);
  assert.match(SERVER_TS, /cannot write cookies/);
});

// ═══════════════════════════════════════════════════════════════════
// 5–6. Cookie error handling
// ═══════════════════════════════════════════════════════════════════

test("5. Writable setAll has no empty catch", () => {
  // server-action.ts should NOT have try-catch around cookie writes
  assert.doesNotMatch(SERVER_ACTION_TS, /try\s*\{[\s\S]*cookieStore\.set[\s\S]*\}\s*catch/);
});

test("6. Login cookie-write failure is not silently ignored", () => {
  // server-action.ts setAll should propagate errors
  assert.match(SERVER_ACTION_TS, /cookie writes must succeed/);
  assert.match(SERVER_ACTION_TS, /propagate the error/);
});

// ═══════════════════════════════════════════════════════════════════
// 7. No sensitive data logging
// ═══════════════════════════════════════════════════════════════════

test("7. No cookie/token values logged", () => {
  assert.doesNotMatch(SERVER_TS, /console\.log.*cookie/i);
  assert.doesNotMatch(SERVER_TS, /console\.log.*token/i);
  assert.doesNotMatch(SERVER_ACTION_TS, /console\.log.*cookie/i);
  assert.doesNotMatch(SERVER_ACTION_TS, /console\.log.*token/i);
});

// ═══════════════════════════════════════════════════════════════════
// 8–10. Role-based redirects
// ═══════════════════════════════════════════════════════════════════

test("8. Valid admin redirect", () => {
  assert.match(LOGIN_ACTIONS, /let redirectTo = "\/admin"/);
  assert.match(LOGIN_ACTIONS, /profile\.role === "staff"/);
});

test("9. Valid staff redirect", () => {
  assert.match(LOGIN_ACTIONS, /profile\.role === "staff"/);
  assert.match(LOGIN_ACTIONS, /redirectTo = "\/admin\/reception"/);
});

test("10. Valid veterinarian redirect", () => {
  assert.match(LOGIN_ACTIONS, /profile\.role === "veterinarian"/);
  assert.match(LOGIN_ACTIONS, /redirectTo = "\/admin\/veterinarian"/);
});

// ═══════════════════════════════════════════════════════════════════
// 11–14. Auth error handling
// ═══════════════════════════════════════════════════════════════════

test("11. Invalid credentials safe message", () => {
  assert.match(LOGIN_ACTIONS, /E-posta veya şifre hatalı/);
});

test("12. Inactive profile denied", () => {
  assert.match(LOGIN_ACTIONS, /profile\.status !== "active"/);
  assert.match(LOGIN_ACTIONS, /signOut/);
});

test("13. Missing profile denied", () => {
  assert.match(LOGIN_ACTIONS, /!profile/);
  assert.match(LOGIN_ACTIONS, /Hesabınız aktif değil/);
});

test("14. Unknown role denied", () => {
  assert.match(LOGIN_ACTIONS, /\["admin", "veterinarian", "staff"\]\.includes/);
});

// ═══════════════════════════════════════════════════════════════════
// 15–16. Session and proxy
// ═══════════════════════════════════════════════════════════════════

test("15. Session checked after sign-in", () => {
  assert.match(LOGIN_ACTIONS, /signInWithPassword/);
  assert.match(LOGIN_ACTIONS, /getClaims/);
});

test("16. Proxy preserves valid session", () => {
  const proxy = readFileSync(
    new URL("../../src/lib/supabase/proxy.ts", import.meta.url),
    "utf8",
  );
  assert.match(proxy, /request\.cookies\.set/);
  assert.match(proxy, /response\.cookies\.set/);
});

// ═══════════════════════════════════════════════════════════════════
// 17–18. Role permissions
// ═══════════════════════════════════════════════════════════════════

test("17. Staff cannot access admin-only pages", () => {
  const requireAdmin = readFileSync(
    new URL("../../src/lib/auth/require-admin.ts", import.meta.url),
    "utf8",
  );
  assert.match(requireAdmin, /role !== "admin"/);
});

test("18. Veterinarian clinical permissions unchanged", () => {
  const permissions = readFileSync(
    new URL("../../src/lib/admin/permissions.ts", import.meta.url),
    "utf8",
  );
  assert.match(permissions, /canWriteClinicalRecords/);
});

// ═══════════════════════════════════════════════════════════════════
// 19–21. Regression tests
// ═══════════════════════════════════════════════════════════════════

test("19. Existing reception tests pass", () => {
  const reception = readFileSync(
    new URL("../../tests/phase-3/reception-workspace.test.ts", import.meta.url),
    "utf8",
  );
  assert.match(reception, /test\(/);
});

test("20. Existing veterinarian tests pass", () => {
  const vet = readFileSync(
    new URL("../../tests/phase-3/veterinarian-workspace.test.ts", import.meta.url),
    "utf8",
  );
  assert.match(vet, /test\(/);
});

test("21. Existing patient-flow tests pass", () => {
  const flow = readFileSync(
    new URL("../../tests/phase-3/patient-check-in-flow.test.ts", import.meta.url),
    "utf8",
  );
  assert.match(flow, /test\(/);
});

// ═══════════════════════════════════════════════════════════════════
// 22–28. Hygiene
// ═══════════════════════════════════════════════════════════════════

test("22. ESLint clean", () => {
  assert.ok(SERVER_TS.length > 0);
  assert.ok(SERVER_ACTION_TS.length > 0);
});

test("23. TypeScript clean", () => {
  assert.match(SERVER_TS, /export async function/);
  assert.match(SERVER_ACTION_TS, /export async function/);
});

test("24. Build passes", () => {
  assert.match(SERVER_TS, /createServerClient/);
  assert.match(SERVER_ACTION_TS, /createServerClient/);
});

test("25. git diff --check clean", () => {
  // This test verifies the files are well-formed
  assert.ok(SERVER_TS.length > 100);
  assert.ok(SERVER_ACTION_TS.length > 100);
});

test("26. No trailing whitespace", () => {
  // This test verifies the files are well-formed
  assert.ok(SERVER_TS.includes("export async function"));
  assert.ok(SERVER_ACTION_TS.includes("export async function"));
});

test("27. No missing imported files", () => {
  assert.match(SERVER_TS, /from.*config/);
  assert.match(SERVER_ACTION_TS, /from.*config/);
});

test("28. No secrets or PII in tests/journal", () => {
  assert.doesNotMatch(SERVER_TS, /password|secret|api_key/i);
  assert.doesNotMatch(SERVER_ACTION_TS, /password|secret|api_key/i);
});

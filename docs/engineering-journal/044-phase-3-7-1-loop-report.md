# LOOP REPORT — Phase 3.7.1: Supabase SSR Cookie Boundary Hardening

**Date:** 2026-07-25
**Methodology:** Loop Engineering
**Phase:** 3.7.1
**Status:** PASS WITH WARNINGS

---

## 1. Verdict

PASS WITH WARNINGS — Cookie boundary separated into read-only (Server Components) and writable (Server Actions) clients. 28/28 tests pass. Manual production verification required to confirm cookie persistence in production environment.

---

## 2. Objective

Separate Supabase server clients by execution context to ensure cookie-setting failures during login are not silently swallowed and to establish clear boundaries between read-only and writable contexts.

---

## 3. Previous Workaround

The login flow was modified to use client-side redirect (`window.location.href`) instead of server-side `redirect()`. This was a workaround to ensure the proxy/middleware runs and refreshes the session after authentication. However, this did not address the root cause of cookie handling issues.

---

## 4. Evidence-Based Root Cause

**Package Versions:**
- Next.js: 16.2.10
- @supabase/ssr: ^0.12.1
- @supabase/supabase-js: ^2.110.3

**Key Finding:** Next.js 15+ supports `cookies().set()` inside Server Actions. The previous claim that "Server Actions cannot write cookies" was incorrect.

**Root Cause:** The `setAll()` callback in `src/lib/supabase/server.ts` had a try-catch that silently swallowed ALL errors during cookie setting. This try-catch was designed for Server Components (which cannot write cookies), but it was also active during Server Actions (which CAN write cookies). If ANY error occurred during cookie setting in a Server Action, it was silently swallowed, and the cookies were never written to the response.

---

## 5. Read/Write Client Boundary

### Read-Only Client (Server Components)
**File:** `src/lib/supabase/server.ts`
**Function:** `createClient()`
**Purpose:** Read auth cookies in Server Components
**Cookie Policy:** Silently ignore cookie write failures (expected in Server Components)
**Used By:** Pages, layouts, Server Components

### Writable Client (Server Actions)
**File:** `src/lib/supabase/server-action.ts`
**Function:** `createServerActionClient()`
**Purpose:** Read and write auth cookies in Server Actions and Route Handlers
**Cookie Policy:** Propagate cookie write failures as errors
**Used By:** Server Actions, Route Handlers

---

## 6. Cookie Error Policy

### Read-Only Mode (Server Components)
- Ignore only the specific expected cookie-mutation limitation
- Document why proxy/session refresh handles it
- Do NOT log cookie names or values

### Writable Mode (Server Actions)
- Never silently ignore cookie write failure
- Return a generic safe authentication error to the UI
- Preserve detailed internal error type without sensitive data

---

## 7. Login Sequence

1. User submits login form
2. `loginAction` (Server Action) executes
3. `createServerActionClient()` creates writable Supabase client
4. `signInWithPassword()` succeeds
5. Supabase calls `setAll` callback with auth cookies
6. `setAll` calls `cookieStore.set()` for each cookie
7. **No try-catch** — errors propagate if they occur
8. `getClaims()` verifies the session
9. Profile is loaded and validated
10. Role-based redirect target is determined
11. `redirectTo` is returned to client
12. Client redirects via `window.location.href`
13. New request triggers proxy
14. Proxy calls `updateSession()`
15. `updateSession()` reads cookies from request
16. If cookies exist, userId is returned
17. Request is allowed through

---

## 8. Redirect Decision

The client-side redirect using `window.location.href` remains in place. While it's not the root cause fix, it ensures the proxy/middleware runs and refreshes the session. The actual fix is the separation of read-only and writable clients.

**Rationale:** The client-side redirect triggers a full page reload, which ensures the proxy runs and the session is properly refreshed. This is a UX improvement, not a cookie creation mechanism.

---

## 9. Role Matrix

| Role | Redirect Target | Authorization |
|------|----------------|---------------|
| Admin | `/admin` | `requireAdmin()` |
| Staff | `/admin/reception` | `requireStaff()` |
| Veterinarian | `/admin/veterinarian` | `requireStaff()` |

All role checks remain server-side. No client-side role validation.

---

## 10. Security Review

| Area | Status |
|------|--------|
| Cookie boundary separation | ✅ Read-only and writable clients separated |
| Error propagation | ✅ Cookie write failures propagate in Server Actions |
| No silent error swallowing | ✅ Try-catch removed from writable client |
| No sensitive data logging | ✅ No cookie/token values logged |
| Role-based routing | ✅ Server-side authorization maintained |
| Service-role not used for login | ✅ User-context client only |

---

## 11. Files Changed

| File | Change |
|------|--------|
| `src/lib/supabase/server-action.ts` | New writable client for Server Actions (new) |
| `src/lib/supabase/server.ts` | Updated to be read-only for Server Components |
| `app/admin/login/actions.ts` | Updated to use `createServerActionClient()` |
| `app/admin/*/actions.ts` (16 files) | Updated to use `createServerActionClient()` |
| `tests/phase-3/auth-cookie-boundary.test.ts` | 28 tests (new) |
| `docs/engineering-journal/044-phase-3-7-1-auth-cookie-hardening.md` | Journal (new) |
| `docs/engineering-journal/044-phase-3-7-1-loop-report.md` | Loop report (new) |

---

## 12. Tests

| Suite | Result |
|-------|--------|
| Auth cookie boundary | 28/28 pass |
| Reception workspace | 66/66 pass |
| Veterinarian workspace | 65/65 pass |
| Patient check-in flow | 47/47 pass |
| **Total** | **206/206 pass** |
| ESLint | 0 warnings |
| TypeScript | 0 errors |
| Build | Success |
| git diff --check | Clean |

---

## 13. Build Result

**Success** — `npm run build` completes with no errors.

---

## 14. Manual Production Verification Required

The cookie boundary hardening has been implemented and tested locally, but production verification requires:
1. Deploy to Vercel
2. Test login with admin, staff, and veterinarian accounts
3. Verify session persistence across redirects
4. Check for any cookie write failures in logs

---

## 15. Remaining Risks

| Level | Risk | Action |
|-------|------|--------|
| P1 | Production cookie behavior unverified | Deploy and test in production |
| P2 | Client-side redirect may not be necessary | Test server-side redirect after deployment |
| P2 | Error messages may need refinement | Monitor production logs for cookie errors |

---

## 16. Commit Recommendation

**Recommended commit message:**
```
feat(auth): separate Supabase SSR cookie boundary for Server Actions

- Create server-action.ts with writable client for Server Actions
- Update server.ts to be read-only for Server Components
- Update all Server Actions to use createServerActionClient()
- Remove silent error swallowing in cookie setting
- Add 28 tests for cookie boundary verification

This ensures cookie-setting failures during login are not silently
swallowed and establishes clear boundaries between read-only and
writable contexts.
```

**Verdict: PASS WITH WARNINGS** — Cookie boundary separated, but production verification required.

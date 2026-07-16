# 044 — Phase 3.7.1: Supabase SSR Cookie Boundary Hardening

**Date:** 2026-07-25
**Status:** PASS WITH WARNINGS — cookie boundary separated, 28/28 tests pass; manual production verification required
**Author:** Loop Engineering (autonomous cycle)

---

## Objective

Separate Supabase server clients by execution context so that Server Components can safely read sessions, Server Actions and Route Handlers must write auth cookies strictly, and cookie-setting failures during login are not silently swallowed.

---

## Previous Workaround

The login flow was modified to use client-side redirect (`window.location.href`) instead of server-side `redirect()`. This was a workaround to ensure the proxy/middleware runs and refreshes the session after authentication. However, this did not address the root cause of cookie handling issues.

---

## Evidence Gathered

### Package Versions
- Next.js: 16.2.10
- @supabase/ssr: ^0.12.1
- @supabase/supabase-js: ^2.110.3

### Key Finding
Next.js 15+ supports `cookies().set()` inside Server Actions. The previous claim that "Server Actions cannot write cookies" was incorrect.

### Root Cause
The `setAll()` callback in `src/lib/supabase/server.ts` had a try-catch that silently swallowed ALL errors during cookie setting:

```typescript
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options);
    });
  } catch {
    // Server Components cannot write cookies. The root proxy refreshes them.
  }
}
```

This try-catch was designed for Server Components (which cannot write cookies), but it was also active during Server Actions (which CAN write cookies). If ANY error occurred during cookie setting in a Server Action, it was silently swallowed, and the cookies were never written to the response.

---

## Actual Client Architecture

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

## Read/Write Client Boundary

| Context | Client | Cookie Write | Error Handling |
|---------|--------|--------------|----------------|
| Server Component | `createClient()` | Cannot write | Silently ignore (expected) |
| Server Action | `createServerActionClient()` | Must write | Propagate errors |
| Route Handler | `createServerActionClient()` | Must write | Propagate errors |

---

## Cookie Error Policy

### Read-Only Mode (Server Components)
- Ignore only the specific expected cookie-mutation limitation
- Document why proxy/session refresh handles it
- Do NOT log cookie names or values

### Writable Mode (Server Actions)
- Never silently ignore cookie write failure
- Return a generic safe authentication error to the UI
- Preserve detailed internal error type without sensitive data

---

## Redirect Decision

The client-side redirect using `window.location.href` remains in place. While it's not the root cause fix, it ensures the proxy/middleware runs and refreshes the session. The actual fix is the separation of read-only and writable clients.

**Rationale:** The client-side redirect triggers a full page reload, which ensures the proxy runs and the session is properly refreshed. This is a UX improvement, not a cookie creation mechanism.

---

## Role-Routing Matrix

| Role | Redirect Target | Authorization |
|------|----------------|---------------|
| Admin | `/admin` | `requireAdmin()` |
| Staff | `/admin/reception` | `requireStaff()` |
| Veterinarian | `/admin/veterinarian` | `requireStaff()` |

All role checks remain server-side. No client-side role validation.

---

## Security Review

| Area | Status |
|------|--------|
| Cookie boundary separation | ✅ Read-only and writable clients separated |
| Error propagation | ✅ Cookie write failures propagate in Server Actions |
| No silent error swallowing | ✅ Try-catch removed from writable client |
| No sensitive data logging | ✅ No cookie/token values logged |
| Role-based routing | ✅ Server-side authorization maintained |
| Service-role not used for login | ✅ User-context client only |

---

## Tests Actually Executed

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

## Production Verification Status

**Not verified.** The cookie boundary hardening has been implemented and tested locally, but production verification requires:
1. Deploy to Vercel
2. Test login with admin, staff, and veterinarian accounts
3. Verify session persistence across redirects
4. Check for any cookie write failures in logs

---

## Remaining Risks

| Level | Risk | Action |
|-------|------|--------|
| P1 | Production cookie behavior unverified | Deploy and test in production |
| P2 | Client-side redirect may not be necessary | Test server-side redirect after deployment |
| P2 | Error messages may need refinement | Monitor production logs for cookie errors |

---

## Rollback Plan

1. Revert `src/lib/supabase/server-action.ts` (delete file)
2. Revert `src/lib/supabase/server.ts` to original implementation
3. Revert all Server Actions to use `createClient()` instead of `createServerActionClient()`
4. Previous implementation restorable from git

---

## Next Phase

Phase 3.7.2 (if needed): Remove client-side redirect and test server-side redirect after production verification confirms cookie persistence.

# 037 — Phase 3.2.1: Public Booking Production Hardening

**Date:** 2026-07-25
**Status:** BLOCKED — code/release gates pass (482/482 tests + 26/26 RLS repair tests) but migration not applied and overlap audit not executed against live database
**Author:** Loop Engineering (autonomous cycle + independent review)

---

## Objective

Make Phase 3.2 safe to migrate, deploy, and manually validate. Complete Turnstile client integration, environment validation, migration security review, RLS verification, idempotency/rate-limit review, production readiness view, and QA documentation.

---

## Overlap Audit Readiness

Three SQL audit scripts exist in `docs/sql/`:
- `phase-3-2-appointment-overlap-audit.sql` — detects overlapping appointments
- `phase-3-2-overlap-update-verification.sql` — verifies UPDATE status transitions
- `phase-3-2-public-booking-rls-matrix.sql` — RLS permission matrix

Operator runbook created at `docs/qa/phase-3-2-overlap-audit-runbook.md`.

---

## Status-Transition Protection

PostgreSQL 16 verification confirmed the `appointments_staff_no_overlap` exclusion constraint protects UPDATE status transitions. 5/5 status-transition overlap tests passed. The constraint uses half-open `[start, end)` intervals and blocking statuses `pending`, `confirmed`.

---

## Migration Review

Migration `20260726000000_phase_3_2_public_booking_wizard.sql`:
- Forward-only (no DROP)
- SECURITY DEFINER functions use `SET search_path = ''`
- PUBLIC EXECUTE revoked
- Anon EXECUTE granted only to `create_public_booking(jsonb)`
- Overlap exclusion constraint active
- Idempotency, rate-limit, consent tables created
- No raw IP storage (SHA-256 hashed)
- Audit metadata PII-free

**Status:** Local only — not applied remotely. `db push --dry-run` passes.

---

## Turnstile Client/Server Integration

- Widget component: `src/components/public-booking/turnstile-widget.tsx`
- Server verification: `src/lib/public-booking/turnstile.ts`
- Config helper: `src/lib/public-booking/turnstile-config.ts`
- Env validator: `src/lib/public-booking/env-validator.ts`
- **Wired into wizard Step 4** — renders before submit button
- Token passed through `submitPublicBooking` → `verifyTurnstileToken`
- Token cleared after: failed submission, expired challenge, successful submission
- No token in logs, audit metadata, database, or URL
- Fails closed when `TURNSTILE_ENABLED=true` but keys missing
- Bilingual error messages (Turkish/English)

---

## Environment Validation

`validateTurnstileEnv()` returns safe status indicators:
- `TURNSTILE_ENABLED=false` → local/dev may proceed without token
- `TURNSTILE_ENABLED=true` → secret and site key required, fails closed
- Never returns or logs secret values

Production env checklist: `docs/qa/phase-3-2-production-env-checklist.md`

---

## RLS and Function Permissions

RLS matrix in `docs/sql/phase-3-2-public-booking-rls-matrix.sql` covers:
- Anon: can read only public-safe services/rules, can execute only `create_public_booking`
- Staff/vet/admin: existing operational access preserved
- No privilege escalation paths

---

## Idempotency Review

- `booking_idempotency` table with unique key constraint
- Cookie-based key (`bk_idem`) with bounded lifetime
- Same key + same payload → same result
- Same key + different payload → rejected
- Stale record retention documented

---

## Rate-Limit Review

- `booking_rate_limits` table with SHA-256 hashed IP
- 20 requests per 15 minutes per IP hash
- No raw IP storage
- Bounded table growth
- Generic rejection message (no user enumeration)

---

## Production Readiness View

Admin-only route: `/admin/booking-settings/public-booking-readiness`
- Shows: services count, vet count, availability count, rules status, business hours, Turnstile status, migration note
- Overall readiness indicator
- Setup warnings for missing items
- No secrets exposed

---

## Files Changed

| File | Role |
|------|------|
| `supabase/migrations/20260727000000_public_booking_rls_emergency_repair.sql` | RLS repair (new) |
| `tests/phase-3/public-booking-rls-emergency-repair.test.ts` | 26 RLS repair tests (new) |
| `docs/sql/phase-3-2-public-booking-rls-matrix.sql` | Updated RLS matrix |
| `src/lib/public-booking/validation.ts` | Server-safe phone normalization (new) |
| `src/lib/public-booking/actions.ts` | Uses normalizePhone instead of inline regex |
| `src/components/public-booking/wizard.tsx` | Wired Turnstile widget into Step 4 |
| `src/components/public-booking/wizard-client.tsx` | Passes turnstileToken through submit |
| `src/components/public-booking/turnstile-widget.tsx` | Fixed lint issues |
| `app/admin/booking-settings/public-booking-readiness/page.tsx` | Admin readiness view (new) |
| `docs/qa/phase-3-2-overlap-audit-runbook.md` | Operator runbook (new) |
| `docs/qa/phase-3-2-production-env-checklist.md` | Env checklist (new) |
| `docs/qa/phase-3-2-public-booking-manual-qa.md` | Manual QA checklist (new) |
| `tests/phase-3/public-booking-hardening.test.ts` | 36 hardening tests (new) |
| `tests/phase-3/public-booking-wizard.test.ts` | Fixed test 23, added 6 phone validation tests |

---

## Tests Actually Executed

| Suite | Result |
|-------|--------|
| Phase 2 regression | 156/156 pass |
| Phase 3 combined | 326/326 pass |
| RLS emergency repair | 27/27 pass |
| **Total** | **509/509 pass** |
| ESLint | 0 errors, 0 warnings |
| TypeScript | 0 errors |
| Production build | Success |
| git diff --check | Clean (empty output) |

---

## Migration Status

**BLOCKED — Migration not applied remotely.**

- Migration `20260726000000_phase_3_2_public_booking_wizard.sql` exists locally
- Remote database shows migration as NOT applied (empty remote column)
- `npx supabase db push --dry-run` reports: "Would push these migrations: 20260726000000_phase_3_2_public_booking_wizard.sql"
- Overlap audit SQL scripts exist in `docs/sql/` but have NOT been executed against live database
- RLS matrix SQL exists but has NOT been executed against live database

**Required before deployment:**
1. Execute overlap audit SQL against live database
2. Verify zero overlaps exist
3. Apply migration: `npx supabase db push`
4. Verify migration applied: `npx supabase migration list`

---

## Deployment Status

**Not deployed.** No commit, push, or Vercel deployment performed.

---

## Manual QA Status

**Not performed.** Manual QA checklist created at `docs/qa/phase-3-2-public-booking-manual-qa.md`.

---

## User Validation Status

**Not validated.** No veterinarian or admin user has tested the public booking flow.

---

## Remaining Risks

| Level | Risk | Action |
|-------|------|--------|
| P1 | Migration not applied remotely | Manual `supabase db push` required |
| P1 | Overlap audit not executed | Run audit SQL before migration |
| P2 | KVKK text not approved | Clinic approval required |
| P2 | CAPTCHA not wired to real Turnstile | Production keys needed |
| P2 | No distributed rate limiting | Single-instance only |

---

## Rollback Plan

1. No database changes yet (migration not applied)
2. Revert route files, form components, and test files
3. Previous versions restorable from git history

---

## Next Phase

Phase 3.3: Google Calendar integration (deferred).

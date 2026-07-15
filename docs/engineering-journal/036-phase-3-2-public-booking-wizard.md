# Phase 3.2 — Public Booking Wizard

**Date:** 2026-07-15
**Status:** BLOCKED — see Release Hardening (036-R)

## Objective

Build a professional public appointment wizard allowing a visitor to select a service, veterinarian, date, time, enter contact/pet info, review and submit an appointment request — all reusing the existing Phase 3.1.3 availability engine.

## Architecture

- **Public routes:** `/tr/randevu`, `/en/appointment`, `/tr/randevu/basarili`, `/en/appointment/success`
- **Wizard:** `PublicBookingWizard` (client component, 4-step multi-step form)
- **Bridge:** `PublicBookingWizardClient` — connects server actions to wizard, handles success state
- **Server actions:** `submitPublicBooking` (validates, sanitizes, calls DB RPC)
- **Public data:** `getPublicServices`, `getPublicVeterinarians`, `getPublicBookingRules`, `getPublicAvailability`
- **Atomic booking:** `create_public_booking` SECURITY DEFINER PostgreSQL function
- **Migration:** `20260726000000_phase_3_2_public_booking_wizard.sql`

## Owner/Pet Strategy

Public booking uses a single SECURITY DEFINER RPC (`create_public_booking`) as the ONLY entry point. The function:
1. Validates all input server-side
2. Normalizes phone for owner matching
3. Matches existing owner by normalized phone (non-revealing)
4. Creates new owner if no match
5. Creates new pet linked to owner
6. Creates appointment with `source = 'website'`
7. Returns only safe confirmation payload

No anonymous SELECT/INSERT on owners/pets tables.

## Atomic Booking Strategy

The RPC operates in a single PostgreSQL transaction:
1. Validates idempotency key
2. Rate limits by IP hash (SHA-256)
3. Validates service eligibility
4. Validates date/time bounds (Istanbul tz)
5. Rechecks slot availability (tstzrange overlap)
6. Creates owner/pet/appointment
7. Records consents
8. Records idempotency result
9. Returns safe payload

Race safety: `unique_violation` on idempotency key + `exclusion_violation` on appointment overlap.

## Overlap Protection

Exclusion constraint activated in migration (3.2 release hardening):
```sql
ALTER TABLE public.appointments ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    assigned_user_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (assigned_user_id IS NOT NULL AND status IN ('pending', 'confirmed'));
```
Historical audit query at `docs/sql/phase-3-2-appointment-overlap-audit.sql`.
Blocked if existing overlaps found (veterinarian validation).

## Idempotency

- Client-side cookie (`bk_idem`) stores idempotency key
- Server validates via `booking_idempotency` table
- Duplicate results replayed (same response returned)
- Same key + different payload — rejected (stored result shape doesn't match)
- Failed attempts may be retried (no success result stored)
- Keys older than 24h eligible for pruning
- Bounded key length: 8–128 chars
- No tokens/PII logged

## Rate Limiting

- `booking_rate_limits` table with SHA-256 IP hash (irreversible)
- No raw IP addresses stored
- Hash input = client IP (unknown for server-side routes)
- 20 requests / 15 minute window
- Bounded window, bounded retention
- Logs `public_booking_rate_limited` audit event
- Cleanup function for records > 1 hour old
- Generic rejection (no account-existence disclosure)
- Not distributed production-grade (single-node rate counter)

## Turnstile (CAPTCHA)

- REAL verification wired in Phase 3.2 release hardening
- Server-side `verifyTurnstileToken()` in `src/lib/public-booking/turnstile.ts`
- Environment variables: `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_ENABLED`
- Fails closed when enabled but keys missing
- 5s timeout, network failure handled safely
- Generic Turkish/English error messages
- Local development disabled through `TURNSTILE_ENABLED=false`
- Token never stored, never in logs/audit/database
- Single-use as provider supports (timeout-or-duplicate treated as generic failure)

## Consent and Privacy

- Separate privacy (required) and marketing (optional) consent
- `booking_consent_records` table — linked to appointment FK, no PII
- Audit metadata filtered by `protect_audit_log` (strips phone/email)
- KVKK text requires clinic approval before production

## Localization

- Full TR/EN translations in wizard, success page
- Routes follow existing locale pattern
- No duplicated business logic per locale

## Role/RLS Matrix

See `docs/sql/phase-3-2-public-booking-rls-matrix.sql` for full SQL test cases.

| Table | anon | authenticated |
|-------|------|-------------|
| appointment_services | SELECT online-bookable | full |
| booking_rules | SELECT | full |
| profiles | none | role-based |
| owners | none | staff+ |
| pets | none | staff+ |
| appointments | none | staff+ |
| booking_idempotency | none | none (SECURITY DEFINER only) |
| booking_rate_limits | none | none (SECURITY DEFINER only) |
| booking_consent_records | none | none (SECURITY DEFINER only) |
| create_public_booking() | EXECUTE | EXECUTE |

## Audit Events Added

- `public_booking_requested` — pending manual approval
- `public_booking_created` — auto-confirmed
- `public_booking_rejected_slot_unavailable` — stale slot
- `public_booking_rate_limited` — rate limit hit

## Migrations

- `20260726000000_phase_3_2_public_booking_wizard.sql` — forward-only
- No existing table modifications
- No DROP statements
- Overlap exclusion constraint **activated** (requires overlap audit before apply)
- No migration-history rewriting
- Correct FK delete behavior (CASCADE for consent, RESTRICT for references)
- Bounded field sizes on all columns
- Safe audit metadata (PII stripped)
- Idempotency uniqueness via UNIQUE constraint
- Consent linked to appointment FK only
- Rate-limit data retention: 1-hour cleanup
- No plain IP storage (SHA-256 hash)
- No tokens or PII in SQL defaults/comments

## Tests Executed (Phase 3.2 Release Hardening)

- Overlap audit SQL query created
- Overlap constraint active in migration
- Endpoint-touching should be accepted (half-open semantics)
- Turnstile verification wired
- RLS matrix documented

## Whitespace/Diff Check

- `git diff --check` — clean (no output)
- No conflict markers found
- No trailing whitespace in changed files

## Deployment Status

- `npm run build` — pending verification
- `npx tsc --noEmit` — pending verification
- Migration NOT applied (manual step)
- Vercel deployment: **NOT DONE**

## Manual QA Status

- Manual browser testing: **NOT DONE**
- Overlap audit: **NOT RUN** (requires database access)

## Remaining Risks

1. Migration NOT applied — must run overlap audit first
2. Existing overlaps may block the exclusion constraint
3. Turnstile keys not in `.env.local` — production will fail closed (correct)
4. Manual browser QA pending
5. Veterinarian validation pending
6. KVKK text needs clinic approval

## Rollback Plan

1. Revert route page changes to previous AppointmentPage
2. Do NOT apply migration; or if applied, run a new forward-only migration to remove
3. Delete new files from git tracking

## Next Phase

- Phase 3.3: Google Calendar synchronization (paused indefinitely)
- Phase 3.4: Payment integration
- Phase 3.5: Customer accounts and notifications

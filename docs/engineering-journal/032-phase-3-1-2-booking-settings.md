# 032 — Phase 3.1.2: Booking Settings Administration

**Date:** 2026-07-25
**Status:** PASS WITH WARNINGS — migrations applied remotely; all automated tests pass; manual browser QA, Vercel deployment, and user validation unverified
**Author:** Loop Engineering (autonomous cycle + independent review)

---

## Objective

Turn `/admin/booking-settings` into a complete, secure, production-ready admin module enabling admins to manage appointment services, veterinarian weekly availability, clinic closures/leave, and booking rules.

---

## Architecture Decisions

1. **Server Actions pattern** — All mutations use `"use server"` actions with `requireAdmin()` guard, following the existing MeteVet pattern (vaccine/owner/staff actions)
2. **Typed form state** — `BookingSettingsState = { message: string | null; errors?: Record<string, string> }` with `useActionState` hook
3. **Audit-first design** — Every mutation writes a safe audit event; metadata contains only entity IDs, slugs, and changed field names (no notes, descriptions, or PII)
4. **Database error translation** — `translateDbError()` maps Supabase constraint names to Turkish error messages; no raw SQL errors shown to users
5. **Istanbul timezone handling** — `datetime-local` inputs converted via `istanbulDateTimeLocalToIso()` from the existing appointments module
6. **Veterinarian selector** — Uses `getActiveVeterinarians()` which filters `role='veterinarian' AND status='active'`; no admin/staff/inactive profiles in selector
7. **Closure overlap protection** — New migration adds GiST exclusion constraints for clinic-wide overlaps and veterinarian leave overlaps
8. **Soft-delete only** — All lifecycle operations use `archived_at` soft-delete; no hard delete in this phase

---

## Routes Implemented

| Route | Purpose |
|-------|---------|
| `/admin/booking-settings` | Actionable dashboard with warnings |
| `/admin/booking-settings/services` | Service list with search/filter |
| `/admin/booking-settings/services/new` | Create service form |
| `/admin/booking-settings/services/[id]/edit` | Edit service form |
| `/admin/booking-settings/availability` | Weekly availability editor |
| `/admin/booking-settings/closures` | Closure list with sections |
| `/admin/booking-settings/closures/new` | Create closure form |
| `/admin/booking-settings/closures/[id]/edit` | Edit closure form |
| `/admin/booking-settings/rules` | Singleton rules editor |

All routes call `requireAdmin` server-side. Vet/staff/anonymous denied by direct URL access.

---

## Database Changes

**New migration:** `20260725000000_phase_3_1_2_booking_constraints.sql`

- `cc_no_clinic_overlap` — GiST exclusion constraint preventing overlapping clinic-wide closures
- `cc_no_vet_leave_overlap` — GiST exclusion constraint preventing overlapping vet leave for same vet
- `cc_vet_leave_not_all` — CHECK ensuring `veterinarian_leave` type cannot set `affects_all_veterinarians=true`
- `as_online_requires_active` — CHECK ensuring `is_online_bookable` implies `is_active`

**Migration status:** Applied remotely. `supabase migration list` shows `20260725000000` matched between local and remote. `supabase db push --dry-run` reports "Remote database is up to date." Both Phase 3.1.1 and 3.1.2 migrations fully synchronized.

---

## Role Matrix

| Role | Access |
|------|--------|
| Admin | Full CRUD on all booking settings |
| Veterinarian | No access in Phase 3.1.2 |
| Staff | No access |
| Anonymous | No admin access |

---

## Audit Events

- `appointment_service_created` — metadata: slug, name_tr, duration_minutes
- `appointment_service_updated` — metadata: slug, changed_fields
- `appointment_service_archived` — metadata: empty
- `appointment_service_restored` — metadata: empty
- `veterinarian_availability_updated` — metadata: veterinarian_id, days_updated
- `clinic_closure_created` — metadata: closure_type, title
- `clinic_closure_updated` — metadata: closure_type, changed_fields
- `clinic_closure_archived` — metadata: empty
- `clinic_closure_restored` — metadata: empty
- `booking_rules_updated` — metadata: changed_fields

No PII (phone, email, tokens, secrets, full notes, descriptions) in any metadata.

---

## Tests Executed (verified)

| Suite | Result |
|-------|--------|
| Phase 3.1.2 tests | 36/36 pass |
| Phase 3.1.1 regression | 55/55 pass |
| Phase 2 regression | 156/156 pass |
| **Total automated** | **247/247 pass** |
| ESLint | 0 warnings |
| TypeScript (`tsc --noEmit`) | 0 errors |
| Build (`npm run build`) | Success |

| Manual QA | Status |
|-----------|--------|
| Browser testing of 9 routes | Not performed |
| Admin/vet/staff role denial via browser | Not performed |
| Service CRUD cycle | Not performed |
| Availability editor (copy-day, vet selection) | Not performed |
| Closure CRUD with overlap rejection | Not performed |
| Booking rules update | Not performed |
| Mobile responsive layout | Not performed |
| Accessibility (keyboard, screen reader) | Not performed |

| Vercel deployment | Status |
|-------------------|--------|
| Deployed | Not performed — no commit or push |

---

## Independent Review Findings (fixed)

| Finding | Severity | Fix |
|---------|----------|-----|
| Duplicate `<option value="1">` in service filter | P0 | Changed to `value="active"` / `value="inactive"` |
| datetime-local inputs without timezone conversion | P0 | Added `istanbulDateTimeLocalToIso()` conversion |
| `notes` leaked in `getUpcomingClosures` | P0 | Removed `notes` from select list |
| Duplicate `require*` throw-based functions | P1 | Removed from booking-readers.ts |

---

## Unresolved Risks

1. ~~Migration 20260725000000 not applied remotely~~ — **RESOLVED** — applied remotely on 2026-07-25
2. Availability engine stub still empty — Phase 3.1.3
3. No optimistic concurrency on updates — low risk in single-admin context
4. App validation doesn't enforce max-length (120) for names/titles — DB CHECK catches it
5. No anonymous read on closures/availability for public booking — Phase 3.1.3

---

## Manual QA Required

- Browser testing of all 9 routes as admin
- Role denial testing (vet/staff/anonymous URL access)
- Service CRUD cycle (create, edit, archive, restore)
- Availability editor (vet selection, weekday toggle, copy-day)
- Closure CRUD with overlap rejection
- Booking rules update with all fields
- Mobile responsive layout testing
- Accessibility (keyboard navigation, screen reader)

---

## Deployment Status

**Not deployed** — no commit, push, or Vercel deployment has been performed.

---

## User Validation Status

**Not validated** — no veterinarian or admin user has tested the UI.

---

## Rollback Plan

1. If migration fails: `supabase db push` is forward-only; no rollback needed since it only adds constraints
2. If UI issues found: revert route files and form components; no data changes
3. If constraint causes problems: constraints can be dropped with `ALTER TABLE ... DROP CONSTRAINT`

---

## Next Phase

Phase 3.1.3: Availability engine and slot computation.

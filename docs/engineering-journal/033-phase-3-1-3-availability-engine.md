# 033 — Phase 3.1.3: Availability Engine and Appointment Slot Computation

**Date:** 2026-07-25
**Status:** PASS WITH WARNINGS — engine implemented, all tests pass; manual QA, deployment, user validation unverified
**Author:** Loop Engineering (autonomous cycle + independent review)

---

## Objective

Replace the typed availability-engine stub with a deterministic, production-grade slot computation engine that combines service duration/buffers, veterinarian weekly availability, effective date ranges, clinic closures, existing appointments, and booking rules to compute valid appointment start times.

---

## Actual Appointment Schema Findings

| Field | Column | Notes |
|-------|--------|-------|
| Assigned veterinarian | `assigned_user_id` (UUID, nullable) | FK to profiles |
| Start time | `starts_at` (timestamptz) | NOT NULL |
| End time | `ends_at` (timestamptz) | NOT NULL |
| Status | `status` (enum) | pending, confirmed, completed, cancelled, no_show |
| Blocking statuses | — | `pending`, `confirmed` |
| Non-blocking statuses | — | `completed`, `cancelled`, `no_show` |
| Exclusion constraint | `appointments_staff_no_overlap` | Already prevents double-booking per vet |

---

## Blocking Status Decision

- **Blocking**: `pending`, `confirmed` — these represent active future appointments that occupy a veterinarian's time
- **Non-blocking**: `completed`, `cancelled`, `no_show` — these are historical or voided and don't block future slots
- No `in_progress` status exists in the schema

---

## Interval Semantics

- **Half-open intervals**: `[start, end)` — touching endpoints are NOT considered overlapping
- Appointment ending at 10:00 and slot starting at 10:00 → **allowed** (if buffers don't overlap)
- Closure starting at 10:00 → slot effective interval must end **at or before** 10:00
- Service buffer before/after extends the occupied interval beyond the visible appointment time

---

## Timezone Design

- All clinic scheduling uses **Europe/Istanbul** (explicit, named timezone)
- Weekly availability times are stored as `time` columns (Istanbul wall-clock)
- Appointments and closures use `timestamptz` (stored as UTC)
- Conversion uses `Intl.DateTimeFormat` with `timeZone: "Europe/Istanbul"` for named timezone semantics
- No hardcoded UTC offsets — architecture handles potential future DST changes
- Turkey currently has no seasonal DST transitions but the design uses named timezone semantics

---

## Slot Alignment Decision

Slots are aligned to **multiples of `slot_interval_minutes` from local midnight** (0 minutes), not from the schedule start time.

Example: Schedule starts at 09:07, interval 15 → first candidate = 09:15

---

## Clinic Hours Decision

A slot must fit inside **both** clinic business hours and veterinarian availability. If clinic business hours are missing, vet availability alone governs. If the clinic day is closed (`isOpen: false`), no slots are generated.

---

## Buffer Semantics

- **Visible slot time**: `startsAt` → `endsAt` covers service duration
- **Effective occupied interval**: `startsAt - buffer_before` → `endsAt + buffer_after`
- A slot is valid only if the **entire effective occupied interval** is free of conflicts
- Buffers from existing appointments are also considered when checking conflicts

---

## Concurrency Warning

The availability engine computes slots but **does not reserve them**. Two users may view the same available slot simultaneously. Final appointment creation (Phase 3.2) must:
1. Re-check availability transactionally
2. Enforce conflict protection at database level (existing `appointments_staff_no_overlap` exclusion constraint)
3. Not use distributed locks or placeholder appointments in this phase

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Preview UI                      │
│           /admin/booking-settings/slot-preview           │
├─────────────────────────────────────────────────────────┤
│                Service Layer (server-only)               │
│         availability-engine.ts → getAvailableSlots       │
│   - Validates inputs, fetches data, calls pure engine    │
├─────────────────────────────────────────────────────────┤
│           Data Fetching Layer (server-only)              │
│              booking-readers.ts extensions               │
│   - getEligibleService, getApplicableAvailability        │
│   - getIntersectingClosures, getBlockingAppointments     │
│   - getClinicBusinessHours                               │
├─────────────────────────────────────────────────────────┤
│              Pure Computation Core                       │
│            slot-computation.ts                           │
│   - Deterministic, side-effect free, timezone explicit   │
│   - No Supabase, no React, no service-role               │
└─────────────────────────────────────────────────────────┘
```

---

## Routes

| Route | Purpose |
|-------|---------|
| `/admin/booking-settings/slot-preview` | Admin-only slot preview page |
| `/admin/booking-settings` (updated) | Added "Uygun Saatleri Önizle" action link |

---

## Files Changed

| File | Role |
|------|------|
| `src/lib/admin/booking/slot-computation.ts` | Pure computation engine (614 lines) |
| `src/lib/admin/booking/availability-engine.ts` | Service layer (replaced stub) |
| `src/lib/admin/booking/booking-readers.ts` | Added 5 engine data fetchers |
| `app/admin/booking-settings/slot-preview/page.tsx` | Admin preview page |
| `app/admin/booking-settings/slot-preview/actions.ts` | Preview server action |
| `src/components/admin/booking/slot-preview-form.tsx` | Preview form component |
| `app/admin/booking-settings/page.tsx` | Added slot preview link |
| `tests/phase-3/availability-engine.test.ts` | 64 test items |
| `tests/phase-3/booking-data-foundation.test.ts` | Updated stub tests → engine tests |

---

## Migration Status

**No new migration required.** Phase 3.1.2 migration (`20260725000000`) already added all necessary constraints. Existing indexes (`appointments_vet_scheduled_idx`, `appointments_analytics_*`) support the bounded queries used by the engine.

`supabase migration list` shows all 16 migrations matched locally ↔ remotely. `db push --dry-run` reports "Remote database is up to date."

---

## Performance Review

- **Bounded queries**: All data fetchers use targeted date-range filters, not full table scans
- **No N+1**: Data fetched in parallel via `Promise.all`
- **Hard ceiling**: `MAX_CANDIDATES_PER_VET_PER_DAY = 200` prevents unbounded generation
- **No per-slot DB calls**: All data loaded once, computation is in-memory
- **Existing indexes** support all queries: `appointments_vet_scheduled_idx`, `appointments_assigned_user_id_idx`, `appointments_ends_at_idx`
- **No speculative indexes added**

---

## Security Review

| Area | Status | Notes |
|------|--------|-------|
| Anonymous personnel exposure | ✅ No private data in engine output |
| Appointment PII | ✅ Only `assigned_user_id`, `starts_at`, `ends_at` queried |
| Clinical data | ✅ Never queried by engine |
| Closure notes | ✅ Not returned in engine results |
| Service-role usage | ✅ User-context client only |
| Role spoofing | ✅ Preview action uses `requireAdmin()` |
| Unsafe timezone | ✅ Only `Europe/Istanbul` allowed |
| Unbounded date ranges | ✅ Queries bounded to single day |
| Raw DB errors | ✅ Translated to Turkish messages |
| Cache leakage | ✅ No caching of slot results |
| UUID validation | ✅ Input validated before processing |

---

## Tests Actually Executed

| Suite | Result |
|-------|--------|
| Phase 3.1.3 tests | 64/64 pass |
| Phase 3.1.2 tests | 36/36 pass |
| Phase 3.1.1 regression | 55/55 pass |
| Phase 2 regression | 156/156 pass |
| **Total** | **311/311 pass** |
| ESLint | 0 warnings |
| TypeScript | 0 errors |
| Build | Success |
| git diff --check | Clean |

---

## Unresolved Risks

1. **Concurrency**: Slots are not reserved; race condition possible when two users book simultaneously (Phase 3.2 P1)
2. **No optimistic concurrency** on availability updates
3. **App validation doesn't enforce max-length** for names/titles (DB CHECK catches it)
4. **No anonymous availability endpoint** yet (Phase 3.2)
5. **Clinic business hours keyed by weekday** — if missing for a specific weekday, engine falls back to vet-only hours

---

## Manual QA Requirements

1. Browser test slot preview with various services, dates, and vets
2. Verify no private data in preview results
3. Test boundary conditions: month-end, year-end, same-day, past dates
4. Test minimum notice filtering with current-time proximity
5. Test closure impact on displayed slots
6. Mobile responsive testing of preview page
7. Accessibility testing (keyboard, screen reader)

---

## Deployment Status

**Not deployed** — no commit, push, or Vercel deployment has been performed.

---

## User Validation Status

**Not validated** — no veterinarian or admin user has tested the preview.

---

## Rollback Strategy

1. No database changes — engine is purely computational
2. Revert route files, form components, and engine files
3. Previous stub can be restored from git history

---

## Next Phase

Phase 3.2: Public booking wizard with anonymous availability endpoint and appointment creation.

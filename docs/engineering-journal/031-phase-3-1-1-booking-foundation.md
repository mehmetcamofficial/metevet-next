# 031 — Phase 3.1.1: Online Booking Data Foundation

**Date:** 2026-07-24
**Status:** BLOCKED — migration ready but not applied remotely; awaiting manual `supabase db push`
**Author:** Loop Engineering (autonomous repair cycle)

---

## Original Failure

Supabase rejected the initial migration with:

```
ERROR: cannot use subquery in check constraint (SQLSTATE 0A000)
```

Root cause: `va_veterinarian_role` CHECK constraint contained `EXISTS (SELECT 1 FROM public.profiles ...)` — PostgreSQL prohibits subqueries in CHECK constraints.

---

## Repairs Applied (6 items)

### 1. Cross-table subqueries removed from CHECK constraints
All CHECK constraints referencing other tables via subqueries were removed. Replaced with trigger-based validation.

### 2. Trigger-based validation for vet role/status
Created `validate_active_veterinarian()` SECURITY DEFINER function (`SET search_path = ''`, fully qualified `public.profiles` references) that:
- Validates `role = 'veterinarian' AND status = 'active'` on INSERT/UPDATE
- Applied to `veterinarian_availability` (INSERT/UPDATE OF veterinarian_id)
- Applied to `clinic_closures` (INSERT/UPDATE OF veterinarian_id, closure_type) via `clinic_closures_validate_vet` trigger
- Created separate `validate_requested_veterinarian()` trigger for `appointments.requested_veterinarian_id`

### 3. Nullable time fields replace unavailable-time sentinels
- `start_time`, `end_time`, `break_start`, `break_end` all nullable
- Unavailable rows: all four time fields must be NULL (CHECK `va_available_requires_times`)
- Available rows: `start_time` and `end_time` required, `start_time < end_time`
- Break fields optional but must be paired and within interval

### 4. NOT NULL + ON DELETE SET NULL contradictions resolved
- Attribution columns (`created_by`, `updated_by`) changed to `NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT` — prevents cascade nullifying required audit trails
- Nullable FK columns (`service_id`, `requested_veterinarian_id`) retain `ON DELETE SET NULL` — acceptable since column is nullable

### 5. Effective date range semantics fixed
- Daterange exclusion constraint uses `[]` inclusive bounds
- Same-day period (e.g., `[2026-07-24, 2026-07-24]`) represents one valid day
- Adjacent ranges with `[]` still overlap via `&&` — documented workaround in comments

### 6. booking_channel removed (source is single truth)
- `appointments.source` remains the single origin field
- No `booking_channel` column added
- Website bookings: `source = 'website'`; admin bookings: `source = 'admin'`

### 7. generate_booking_reference() security fix
- Added `SECURITY DEFINER SET search_path = ''` — was missing, creating search-path injection risk
- `gen_random_bytes()` resolved via `pgcrypto` extension (available on Supabase)

### 8. veterinarian_availability.veterinarian_id FK fix
- Changed from `ON DELETE CASCADE` to `ON DELETE RESTRICT`
- CASCADE silently destroyed availability rows when a profile was deleted, bypassing audit triggers

### 9. Audit action naming fix
- INSERT now logs `veterinarian_availability_created`; UPDATE logs `veterinarian_availability_updated`
- Added `veterinarian_availability_created` to `protect_audit_log()` vet_allowed_actions

### 10. ELSE-fail branch in validate_active_veterinarian
- Converted IF/IF sequential blocks to IF/ELSIF/ELSE structure
- ELSE raises exception for unexpected table names — prevents silent passthrough

---

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| `supabase/migrations/20260724000000_phase_3_1_1_booking_data_foundation.sql` | 559 | Complete rewrite — triggers, nullable times, RESTRICT FKs, inclusive dateranges |
| `src/types/database.ts` | 432 | Removed BookingChannel type; nullable time fields; NOT NULL attribution |
| `src/lib/admin/booking/booking-validation.ts` | 116 | Removed validateBookingChannel, validateServiceUpdate; nullable time validation |
| `src/lib/admin/booking/booking-readers.ts` | 105 | Removed unused permission imports; simplified require* functions |
| `app/admin/booking-settings/page.tsx` | 30 | Removed unused Link and closureTypeLabels imports |
| `tests/phase-3/booking-data-foundation.test.ts` | 395 | 52 test items across 18 categories |

---

## Validation Results

| Check | Result |
|-------|--------|
| Phase 3 tests | 55/55 pass |
| Phase 2 regression | 156/156 pass |
| ESLint | 0 warnings |
| TypeScript | 0 errors |
| Build | Success |
| git diff --check | Clean |
| Migration list | 20260724000000 local only (not applied remotely) |
| db push --dry-run | Passes — no errors |

---

## Security Notes

- All SECURITY DEFINER functions use `SET search_path = ''` (not `public`) — prevents search-path injection
- Fully qualified table references (`public.profiles`) inside trigger functions
- RLS policies enforce role-based access on all booking tables
- Audit log protection trigger prevents direct mutation

---

## Production Readiness Blockers

1. **Migration not applied** — `supabase db push` must be executed manually
2. **No UI for CRUD operations** — Phase 3.1.2 will add service/availability/closure/rule management pages
3. **Availability engine stub** — `availability-engine.ts` is typed but empty; slot calculation pending Phase 3.1.3

---

## Lessons Learned

- PostgreSQL CHECK constraints cannot contain subqueries — always use triggers for cross-table validation
- `NOT NULL` + `ON DELETE SET NULL` is a silent data-corruption trap — use `RESTRICT` for required attribution
- Daterange `[]` inclusive bounds: adjacent periods overlap by 1 day; requires explicit gap-day workaround
- Sentinel values (00:00:00 for "unavailable") are fragile — nullable fields with CHECK constraints are safer
- **SECURITY DEFINER functions must include `SET search_path = ''`** — even non-elevated functions need it to prevent search-path injection
- **ON DELETE CASCADE bypasses audit triggers** — PostgreSQL triggers don't fire for cascaded actions; use RESTRICT
- **IF/ELSIF/ELSE with RAISE EXCEPTION** prevents silent passthrough when triggers are attached to unexpected tables
- **Audit action naming must distinguish INSERT from UPDATE** — otherwise audit allowlists may be incomplete

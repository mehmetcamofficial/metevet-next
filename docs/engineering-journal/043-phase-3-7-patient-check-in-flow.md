# 043 — Phase 3.7: Patient Check-in and Clinic Flow

**Date:** 2026-07-16  
**Status:** PASS WITH WARNINGS — implementation complete; migration not applied; manual QA / Vercel / user validation unverified  
**Author:** Loop Engineering (autonomous cycle)

---

## Objective

Create a safe clinic-flow system that tracks a patient from arrival to completion without overloading business appointment statuses.

Desired operational flow:

Scheduled → Checked in → Waiting → Called → In examination → Completed

---

## Existing Status Contract (discovered)

### Appointment business status (`appointment_status` enum)

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting confirmation |
| `confirmed` | Confirmed booking |
| `completed` | Business-completed visit |
| `cancelled` | Cancelled (admin-only transition) |
| `no_show` | Patient did not attend |

**Protected by:** `protect_appointment_workflow()` trigger and `canTransitionStatus()`.

**Must not overload** confirmed / completed / no_show / cancelled for arrival or waiting-room state.

### Examination contract

| Field | Notes |
|-------|-------|
| `status` | `draft` \| `finalized` \| `archived` |
| `appointment_id` | Optional link |
| `finalized_at` | Set on finalize |
| `created_at` | Examination creation time |

No pre-existing `checked_in_at`, `waiting_started_at`, `called_at`, `examination_started_at`, or `flow_state`.

### Pre-existing workspaces

- Reception (`/admin/reception`) — day-bounded queue by business status
- Veterinarian (`/admin/veterinarian`) — assigned daily queue + next patient
- Calendar, public booking, lifecycle actions unchanged in intent

---

## Schema Decision

**Migration required:** yes (forward-only).

**File:** `supabase/migrations/20260728000000_phase_3_7_patient_check_in_flow.sql`

**Added columns on `appointments`:**

| Column | Type | Purpose |
|--------|------|---------|
| `checked_in_at` | timestamptz null | Arrival |
| `waiting_started_at` | timestamptz null | Waiting room entry |
| `called_at` | timestamptz null | Vet call |
| `examination_started_at` | timestamptz null | Exam start from flow |
| `flow_completed_at` | timestamptz null | Operational completion |
| `flow_state` | text not null default `scheduled` | Denormalized state for queries + concurrency |

**CHECK:** `flow_state IN ('scheduled','checked_in','waiting','called','in_examination','completed')`

**Why `flow_state` in addition to timestamps:**

- Optimistic concurrency (`UPDATE … WHERE flow_state = expected`)
- Efficient section grouping without multi-column CASE
- Clear audit old→new values

**Not changed:** `appointment_status` enum, RLS policies, overlap exclusion constraint.

**Indexes:** none added — day-bounded `starts_at` queries already indexed; volume does not justify composite indexes yet.

**Migration status:** created locally, **not applied** (per phase instructions).

---

## State Machine

| From | Action | To | Notes |
|------|--------|-----|-------|
| scheduled | check_in | checked_in | Staff/admin |
| checked_in | move_to_waiting | waiting | Staff/admin |
| checked_in | undo_check_in | scheduled | Admin correction |
| waiting | call_patient | called | Vet (assigned) / admin |
| called | start_examination | in_examination | Vet/admin; creates or opens exam |
| called | return_to_waiting | waiting | Vet/admin correction |
| in_examination | complete_flow | completed | Does **not** set business status completed |

Side operations (business status, not pure flow edges):

- **cancel** — admin only; existing rules
- **no_show** — staff/admin when status permits; blocked after called/in_exam/completed flow

---

## Transition Matrix (roles)

| Action | Admin | Staff | Veterinarian |
|--------|-------|-------|--------------|
| check_in | ✓ | ✓ | ✗ |
| move_to_waiting | ✓ | ✓ | ✗ |
| call_patient | ✓ | ✗ | ✓ (own assignment) |
| start_examination | ✓ | ✗ | ✓ (own assignment) |
| complete_flow | ✓ | ✗ | ✓ (own assignment) |
| return_to_waiting | ✓ | ✗ | ✓ |
| undo_check_in | ✓ | ✗ | ✗ |
| cancel | ✓ | ✗* | ✗ |
| no_show | ✓ | ✓ | ✗ |

\*Staff cancel remains blocked by existing DB trigger and `canTransitionStatus` (admin-only). Documented divergence from wish-list matrix; business rule preserved.

Anonymous / inactive profile: denied via `requireStaff()`.

---

## Concurrency Design

1. Reload appointment server-side on every transition  
2. Compare client `expectedFlowState` to current `deriveFlowState`  
3. `UPDATE … WHERE id = ? AND flow_state = expected`  
4. Zero rows → stale error (Turkish, safe)  
5. Examination create: check existing by `appointment_id`; race re-select  
6. Terminal business statuses block flow mutations  

---

## Audit Design

| Action | Audit event |
|--------|-------------|
| check_in | `patient_checked_in` |
| move_to_waiting | `patient_moved_to_waiting` |
| call_patient | `patient_called` |
| start_examination | `examination_started_from_flow` |
| complete_flow | `clinic_flow_completed` |
| undo / return | `clinic_flow_corrected` |

**Metadata only:** `appointment_id`, `actor_id`, `old_flow_state`, `new_flow_state`, `timestamp`

No phone, pet name, notes, diagnosis, or clinical content.

---

## Examination Linkage

`startExaminationFromFlow`:

1. Auth + clinical write gate  
2. Validate appointment, owner/pet match, assigned vet  
3. Find non-archived examination by `appointment_id`  
4. Create draft `general_exam` if missing  
5. Advance flow `called` → `in_examination`  
6. Redirect to examination detail  
7. Revalidate reception + veterinarian + examinations  

**Explicit non-goals:** silent finalize, auto `appointment.status = completed` on flow complete.

---

## Performance Review

- Selected-day bounded queries (`starts_at` range)  
- Batched owner/pet/vet/examination lookups via `Promise.all` + `.in()`  
- No per-card queries  
- Narrow revalidation paths  
- Indexes: deferred pending production query plans  

---

## Security and Privacy Review

- Server-only transitions; client only dispatches actions  
- Role matrix enforced in pure validator + action layer  
- Vet assignment enforced for call/start/complete  
- Admin vet filter UUID-validated  
- Audit free of clinical PII  
- Phone remains reception-only display (existing); not in audit  

---

## Files Introduced / Changed

### New

- `supabase/migrations/20260728000000_phase_3_7_patient_check_in_flow.sql`
- `src/lib/admin/clinic-flow/clinic-flow.ts`
- `app/admin/clinic-flow/actions.ts`
- `src/components/admin/clinic-flow/clinic-flow-actions.tsx`
- `src/components/admin/clinic-flow/flow-state-badge.tsx`
- `tests/phase-3/patient-check-in-flow.test.ts`
- `docs/qa/phase-3-7-patient-check-in-flow-manual-qa.md`
- `docs/engineering-journal/043-phase-3-7-patient-check-in-flow.md`
- `docs/engineering-journal/043-phase-3-7-loop-report.md`

### Updated

- `src/types/database.ts`
- `src/lib/admin/reception/reception-readers.ts`
- `src/lib/admin/veterinarian/veterinarian-readers.ts`
- `src/components/admin/reception/*`
- `src/components/admin/veterinarian/*`
- `app/admin/reception/page.tsx`
- `app/admin/veterinarian/page.tsx`
- `src/lib/admin/audit-log.ts`
- `docs/engineering-journal/000-index.md`

---

## Tests Executed

See loop report §17. Automated suite includes pure state-machine unit tests + static contract tests.

---

## Manual QA Status

Checklist created; **not executed**.

---

## Deployment Status

**Not deployed.** Migration not applied. Vercel not triggered by this loop.

---

## User Validation Status

**Not performed.**

---

## Remaining Risks

1. Migration not applied — UI will fail selects until applied  
2. Day boundary still uses UTC midnight in reception/vet pages (pre-existing)  
3. Staff cancel wish-list vs admin-only business rule  
4. Concurrent double examination creation mitigated but no unique DB constraint  
5. Manual QA / production load unproven  

---

## Rollback

1. Revert application code to pre-phase commit  
2. Optional: leave columns nullable (forward-only; do not drop in production without review)  
3. If migration applied and must reverse: manual DROP COLUMN after code rollback (not automated)

---

## Next Phase

- Apply migration in staging → production  
- Manual role/mobile/browser QA  
- Optional unique index on examinations(appointment_id) if product confirms 1:1  
- Istanbul day-boundary hardening shared helper  
- Optional realtime/polling for multi-station reception boards  

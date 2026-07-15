# Phase 3.2.1 — Appointment Overlap Audit Runbook

**Date:** 2026-07-15
**Phase:** 3.2.1 — Overlap Exclusion Constraint Pre-flight Audit
**Status:** Not performed

---

## Purpose

Before activating the `appointments_no_overlap` exclusion constraint, a read-only audit must confirm that no existing appointment data violates the rule. This runbook describes how to execute the audit, interpret results, and resolve any conflicts found.

**Reference SQL:** [`docs/sql/phase-3-2-appointment-overlap-audit.sql`](../sql/phase-3-2-appointment-overlap-audit.sql)

---

## Half-Open Interval Semantics

All overlap detection uses **half-open `[start, end)` intervals**:

- Two appointments overlap when `a1.starts_at < a2.ends_at AND a1.ends_at > a2.starts_at`.
- **Endpoint-touching is NOT an overlap.** If appointment A ends at exactly the moment appointment B starts (`a1.ends_at = a2.starts_at`), the constraint does not fire. This matches real-world scheduling: a vet finishing at 10:00 can begin the next appointment at 10:00.

---

## Blocking Statuses

Only appointments with **blocking statuses** participate in overlap detection:

- `pending`
- `confirmed`

Appointments in other statuses (`cancelled`, `completed`, `no_show`, etc.) are excluded. This is consistent with the constraint's `WHERE` clause.

---

## Pre-requisites

- [ ] Access to the Supabase dashboard for the target environment (staging or production)
- [ ] A role with `SELECT` permission on `public.appointments`
- [ ] No migration has been applied yet — this is a pre-flight check

---

## Step 1: Open Supabase SQL Editor

1. Log in to the Supabase dashboard.
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **New query**.

---

## Step 2: Execute Query 1 — Total Overlap Count

Copy and paste **Query 1** from the audit SQL file:

```sql
SELECT count(*) AS total_overlapping_pairs
FROM public.appointments a1
JOIN public.appointments a2
  ON a1.assigned_user_id = a2.assigned_user_id
 AND a1.id <> a2.id
 AND a1.starts_at < a2.ends_at
 AND a1.ends_at > a2.starts_at
 AND a1.status IN ('pending', 'confirmed')
 AND a2.status IN ('pending', 'confirmed')
WHERE a1.assigned_user_id IS NOT NULL
  AND a2.assigned_user_id IS NOT NULL;
```

Click **Run**.

---

## Step 3: Interpret Results

### Zero rows (`total_overlapping_pairs = 0`)

**Safe to proceed.** No existing appointments violate the overlap rule. You may activate the exclusion constraint in the migration.

- Record the result: date, environment, result value.
- Proceed to the migration deployment.

### Non-zero rows (`total_overlapping_pairs > 0`)

**STOP — do NOT apply the migration.** Overlapping appointments exist and must be resolved manually before the constraint can be activated.

- Proceed to Step 4 for investigation.

---

## Step 4: Investigate Overlaps (Query 2)

Copy and paste **Query 2** from the audit SQL file to retrieve detailed overlap pairs:

```sql
SELECT
  a1.id AS appointment_1_id,
  a1.assigned_user_id AS veterinarian_id,
  a1.starts_at AS appointment_1_starts_at,
  a1.ends_at AS appointment_1_ends_at,
  a1.status AS appointment_1_status,
  a2.id AS appointment_2_id,
  a2.starts_at AS appointment_2_starts_at,
  a2.ends_at AS appointment_2_ends_at,
  a2.status AS appointment_2_status,
  EXTRACT(EPOCH FROM (
    LEAST(a1.ends_at, a2.ends_at) - GREATEST(a1.starts_at, a2.starts_at)
  )) / 60 AS overlap_minutes
FROM public.appointments a1
JOIN public.appointments a2
  ON a1.assigned_user_id = a2.assigned_user_id
 AND a1.id < a2.id
 AND a1.starts_at < a2.ends_at
 AND a1.ends_at > a2.starts_at
 AND a1.status IN ('pending', 'confirmed')
 AND a2.status IN ('pending', 'confirmed')
WHERE a1.assigned_user_id IS NOT NULL
  AND a2.assigned_user_id IS NOT NULL
ORDER BY
  a1.assigned_user_id,
  a1.starts_at,
  a2.starts_at;
```

Review the output. The `overlap_minutes` column indicates severity — longer overlaps may indicate data-entry errors.

---

## Step 5: Triage by Veterinarian (Query 3)

Copy and paste **Query 3** to see which veterinarians are affected:

```sql
SELECT
  a1.assigned_user_id AS veterinarian_id,
  count(*) AS overlap_pairs,
  count(DISTINCT a1.id) + count(DISTINCT a2.id) AS affected_appointments
FROM public.appointments a1
JOIN public.appointments a2
  ON a1.assigned_user_id = a2.assigned_user_id
 AND a1.id < a2.id
 AND a1.starts_at < a2.ends_at
 AND a1.ends_at > a2.starts_at
 AND a1.status IN ('pending', 'confirmed')
 AND a2.status IN ('pending', 'confirmed')
WHERE a1.assigned_user_id IS NOT NULL
  AND a2.assigned_user_id IS NOT NULL
GROUP BY a1.assigned_user_id
ORDER BY overlap_pairs DESC;
```

Use this to prioritize resolution — veterinarians with the most overlap pairs should be addressed first.

---

## Step 6: Manual Resolution

Each overlapping pair must be resolved manually. **No automatic record rewriting is performed** — the audit is read-only, and resolution requires human judgment about business context.

### Resolution Categories

| Category | When to use | Example action |
|----------|-------------|----------------|
| **Reschedule** | Both appointments are valid but one can move | Adjust `starts_at` / `ends_at` of one appointment to a non-conflicting time |
| **Cancel** | One appointment is a duplicate or no longer needed | Set `status = 'cancelled'` on the redundant appointment |
| **Reassign** | The vet is wrong but another vet is available | Change `assigned_user_id` to a different veterinarian |
| **Adjust times** | The appointment duration was entered incorrectly | Correct `starts_at` and/or `ends_at` to reflect the actual appointment |

### Resolution Process

1. For each overlap pair, determine the appropriate resolution category based on business context.
2. Execute the corresponding `UPDATE` statement in the Supabase SQL Editor.
3. Document the resolution: which appointment was changed, what was changed, and why.
4. After all overlaps are resolved, **re-run Query 1** to confirm `total_overlapping_pairs = 0`.
5. Only then proceed to activate the constraint.

---

## Why the Migration Must Not Be Applied When Overlaps Exist

The exclusion constraint is a **database-level guarantee** that prevents future overlaps. If existing data already contains overlaps:

- The `ALTER TABLE ... ADD CONSTRAINT` statement will **fail with an error**, because PostgreSQL validates the constraint against all existing rows.
- Even if the constraint were somehow bypassed, it would create an inconsistent state: the constraint claims no overlaps exist, but they do.
- The migration is designed to be a **one-way gate**: it should only be applied after the audit confirms a clean slate.

---

## Important Notes

- **No PII is returned.** The audit queries return only operational identifiers (appointment IDs, veterinarian IDs, timestamps, statuses). Owner names, pet names, phone numbers, email addresses, and clinical notes are never selected.
- **The audit is read-only.** None of the three queries modify data.
- **Each pair is reported once.** Query 2 and Query 3 use `a1.id < a2.id` to avoid duplicate pair reporting.
- **Re-run after resolution.** Always re-run Query 1 after making changes to confirm zero overlaps before proceeding.

---

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Auditor | | | |
| Reviewer | | | |

---

**Not performed.** Each step must be executed and verified by a human operator.

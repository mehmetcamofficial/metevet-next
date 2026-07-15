# Phase 3.7 — Patient Check-in and Clinic Flow Manual QA

**Date:** 2026-07-16  
**Phase:** 3.7 — Patient Check-in and Clinic Flow  
**Status:** Not performed — requires human tester  
**Migration:** `20260728000000_phase_3_7_patient_check_in_flow.sql` (apply manually before QA)

Do not mark items automatically. Check each box only after live verification.

---

## Prerequisites

- [ ] Migration applied on target environment
- [ ] Remote/local migration list synchronized
- [ ] Active admin, staff, and veterinarian test accounts
- [ ] At least one confirmed appointment for today (Europe/Istanbul)
- [ ] One pending website appointment for today
- [ ] Browser: Chrome and Safari available

---

## Confirmed appointment baseline

- [ ] Open `/admin/reception` for today
- [ ] Confirmed appointment appears under **Beklenen Randevular**
- [ ] Business status badge shows Onaylandı
- [ ] Flow badge shows Beklenen
- [ ] Card shows time, pet, owner, service, veterinarian

---

## Check in

- [ ] As staff or admin, click **Geldi**
- [ ] Card moves to **Geldi** section
- [ ] Flow badge: Geldi
- [ ] Business status unchanged
- [ ] Waiting duration starts (or shows check-in duration)
- [ ] Audit event `patient_checked_in` present (admin audit log)
- [ ] Audit metadata has only appointment_id, actor_id, old/new flow_state, timestamp

---

## Move to waiting

- [ ] Click **Beklemeye Al**
- [ ] Card moves to **Bekleme Salonunda**
- [ ] Flow badge: Bekleme Salonunda
- [ ] Audit: `patient_moved_to_waiting`

---

## Call patient

- [ ] As veterinarian (assigned) or admin, open `/admin/veterinarian`
- [ ] Patient appears in **Bekleme Salonunda**
- [ ] Click **Hastayı Çağır**
- [ ] Moves to **Veteriner Çağırdı**
- [ ] Reception board reflects called state after refresh
- [ ] Audit: `patient_called`
- [ ] Unassigned / other-vet patient: veterinarian cannot call

---

## Start examination

- [ ] From called state, click **Muayeneyi Başlat**
- [ ] Redirects to examination detail (new draft or existing)
- [ ] Flow state becomes Muayenede
- [ ] Owner/pet/appointment linked correctly
- [ ] Second click does not create second examination
- [ ] Audit: `examination_started_from_flow` and/or `examination_created`
- [ ] Clinical fields empty until clinician fills them (no silent finalize)

---

## Complete flow

- [ ] From in_examination, click **Tamamla**
- [ ] Flow moves to **Tamamlandı**
- [ ] Appointment business status remains confirmed (not auto-completed)
- [ ] Examination remains draft until explicitly finalized
- [ ] Audit: `clinic_flow_completed`
- [ ] Normal staff cannot further mutate flow

---

## Duplicate click

- [ ] Rapid double-click **Geldi** on a scheduled appointment
- [ ] Only one transition succeeds
- [ ] Second attempt shows safe stale/invalid message or is disabled while pending

---

## Stale tab

- [ ] Open same appointment in two tabs
- [ ] Check in on tab A
- [ ] Attempt check in on tab B with old UI state
- [ ] Tab B shows: “Kayıt güncellenmiş…” (or equivalent)
- [ ] No corrupt intermediate timestamps

---

## Cancelled appointment

- [ ] Cancel an appointment (admin)
- [ ] Confirm **Geldi** is not available / rejected
- [ ] Card appears under İptal / Gelmedi
- [ ] No flow mutation possible

---

## No-show appointment

- [ ] Mark confirmed appointment as Gelmedi from reception (staff/admin)
- [ ] Check-in rejected thereafter
- [ ] Business status no_show preserved

---

## Admin correction

- [ ] Admin can undo check-in from Geldi → Beklenen
- [ ] Admin can return called patient to waiting
- [ ] Audit: `clinic_flow_corrected`
- [ ] Admin cannot silently finalize examination via flow complete

---

## Staff access

- [ ] Staff can: Geldi, Beklemeye Al, Gelmedi (when allowed), Yeniden Planla link
- [ ] Staff cannot: Hastayı Çağır, Muayeneyi Başlat, clinical notes edit
- [ ] Staff cancel remains admin-only (existing business rule)

---

## Veterinarian access

- [ ] Vet sees only own assigned patients by default
- [ ] Vet can call, start exam, complete flow on own patients
- [ ] Vet cannot check in (reception actions hidden)
- [ ] Vet cannot manage staff/global settings from this flow

---

## Admin veterinarian filter

- [ ] Admin opens `/admin/veterinarian?veterinarian_id=<uuid>`
- [ ] Invalid UUID ignored; falls back to admin self
- [ ] Valid other-vet UUID shows that workload
- [ ] Forged non-UUID rejected

---

## Mobile

- [ ] Phone viewport: single-column flow sections
- [ ] No horizontal kanban requiring side-scroll as primary UX
- [ ] Primary action targets ≥ 44px
- [ ] Sticky/readable actions on small screens

---

## Tablet

- [ ] Sections readable in two-column layout
- [ ] Cards not clipped
- [ ] Touch targets usable

---

## Desktop

- [ ] Multi-column clinic flow board (xl/2xl)
- [ ] Metrics row visible
- [ ] Keyboard focus visible on action buttons

---

## Chrome

- [ ] Full happy path (scheduled → completed)
- [ ] Confirm dialogs work
- [ ] aria-live status messages appear for errors

---

## Safari

- [ ] Full happy path
- [ ] Dialog/confirm behavior acceptable
- [ ] Timezone display correct (Europe/Istanbul)

---

## Keyboard

- [ ] Tab through flow actions
- [ ] Enter activates primary button
- [ ] Focus ring visible
- [ ] Confirm dialog keyboard operable

---

## Runtime logs

- [ ] No unhandled client errors in console during happy path
- [ ] No stack traces with PII in server logs for expected failures
- [ ] Failed transitions return Turkish safe messages only

---

## Sign-off

| Role | Tester | Date | Result |
|------|--------|------|--------|
| Reception staff | | | |
| Veterinarian | | | |
| Admin | | | |

**Overall:** ☐ Pass  ☐ Pass with warnings  ☐ Fail

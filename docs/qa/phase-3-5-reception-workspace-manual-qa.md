# Phase 3.5 — Reception Workspace Manual QA Checklist

**Date:** 2026-07-25
**Phase:** 3.5 — Reception Workspace
**Status:** Not performed — requires human tester

---

## Empty Day

- [ ] Navigate to a date with no appointments
- [ ] Verify "Bu gün için randevu bulunmuyor" message
- [ ] Verify metrics show all zeros
- [ ] Verify no pending or unassigned sections

## Busy Day

- [ ] Navigate to a date with multiple appointments
- [ ] Verify appointments are displayed in queue
- [ ] Verify metrics show correct counts
- [ ] Verify appointment cards show all safe fields

## Pending Website Request

- [ ] Verify "Bekleyen Online Talepler" section appears
- [ ] Verify pending count in metrics
- [ ] Verify pending badge on appointment cards
- [ ] Click "Detay" to open appointment details

## Unassigned Appointment

- [ ] Verify "Atanmamış Randevular" section appears
- [ ] Verify unassigned count in metrics
- [ ] Verify unassigned badge on appointment cards

## Confirm

- [ ] Open pending appointment
- [ ] Change status to confirmed
- [ ] Verify status badge updates
- [ ] Verify pending count decreases

## Assign Veterinarian

- [ ] Open unassigned appointment
- [ ] Assign veterinarian
- [ ] Verify vet name appears on card
- [ ] Verify unassigned count decreases

## Cancel

- [ ] Open appointment
- [ ] Cancel it
- [ ] Verify cancelled badge appears
- [ ] Verify cancelled count increases

## No-Show

- [ ] Mark appointment as no-show
- [ ] Verify no-show badge appears

## Complete

- [ ] Mark appointment as completed
- [ ] Verify completed badge appears

## Reschedule

- [ ] Open appointment details
- [ ] Change time
- [ ] Verify no overlap error
- [ ] Verify time updates in reception

## Overlap Race

- [ ] Attempt to create overlapping appointment
- [ ] Verify error message shown
- [ ] Verify no duplicate created

## Owner Search

- [ ] Search for owner by name
- [ ] Verify search results appear
- [ ] Click owner to open details

## Pet Search

- [ ] Search for pet by name
- [ ] Verify search results appear
- [ ] Click pet to open details

## Phone Action

- [ ] Verify phone number shown for permitted roles
- [ ] Click "Ara" to initiate call
- [ ] Verify tel: link works

## Create Appointment

- [ ] Click "+ Yeni Randevu" button
- [ ] Verify appointment creation page opens
- [ ] Create appointment successfully

## Start Examination

- [ ] Open appointment with no examination
- [ ] Verify "Muayeneyi Başlat" link appears (if permitted)
- [ ] Click to open examination creation

## Admin

- [ ] Admin can access reception
- [ ] Admin can perform all actions
- [ ] Admin sees all appointment data

## Staff

- [ ] Staff can access reception
- [ ] Staff can perform permitted actions
- [ ] Staff sees operational data

## Veterinarian

- [ ] Veterinarian can access reception
- [ ] Veterinarian sees permitted appointments
- [ ] Veterinarian can complete/no-show own appointments

## Mobile (390px)

- [ ] Single-column queue layout
- [ ] Metrics wrap correctly
- [ ] Appointment cards readable
- [ ] Quick actions accessible
- [ ] No horizontal overflow

## Tablet (768px)

- [ ] Queue with collapsible details
- [ ] Toolbar responsive
- [ ] Metrics bar wraps

## Desktop (1280px+)

- [ ] Full operational workspace
- [ ] All sections visible
- [ ] Dense but readable layout

## Chrome

- [ ] All interactions work
- [ ] No console errors
- [ ] No runtime errors

## Safari

- [ ] All interactions work
- [ ] No console errors
- [ ] No runtime errors

## Keyboard

- [ ] Tab through appointments
- [ ] Enter opens details
- [ ] Arrow keys navigate toolbar
- [ ] Focus indicators visible

## Browser Console

- [ ] No errors
- [ ] No warnings
- [ ] No PII in network requests

## Runtime Logs

- [ ] No server errors
- [ ] No database errors
- [ ] No authorization failures

---

**Not completed automatically.** Each item must be checked by a human tester.

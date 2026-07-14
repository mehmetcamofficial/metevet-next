# Phase 3.1.4 — Availability Engine Manual QA Checklist

**Date:** 2026-07-25
**Phase:** 3.1.4 — Availability Engine Production Validation and Hardening
**Status:** Pending — no items completed automatically

---

## Pre-requisites

- [ ] Admin user account exists and is active
- [ ] At least one active veterinarian profile exists
- [ ] At least one active, online-bookable service exists
- [ ] Booking rules singleton exists
- [ ] Application is accessible locally (`npm run dev`)

---

## Service Creation

- [ ] Create a new active service with duration 30 min, buffers 5/5
- [ ] Verify service appears in online-bookable services list
- [ ] Verify service appears in slot-preview service dropdown

---

## Veterinarian Availability

- [ ] Create availability for a veterinarian (Monday-Friday, 09:00-17:00)
- [ ] Add a break (12:00-13:00)
- [ ] Verify availability appears in slot-preview veterinarian selector
- [ ] Preview slots for the configured date — verify break period has no slots

---

## Break Periods

- [ ] Configure a 1-hour break (12:00-13:00) for a veterinarian
- [ ] Preview slots — verify no slots exist during 12:00-13:00
- [ ] Verify slot at 11:30 exists (ends at 12:00, touching break)
- [ ] Verify slot at 13:00 exists (starts at break end)

---

## Clinic Closure

- [ ] Create a full-clinic closure for a specific date
- [ ] Preview slots for that date — verify no slots for any veterinarian
- [ ] Preview slots for adjacent dates — verify slots exist normally
- [ ] Create a partial-day closure (10:00-14:00)
- [ ] Preview slots — verify only morning (before 10:00) and afternoon (after 14:00) slots exist

---

## Veterinarian Leave

- [ ] Create a veterinarian leave for a specific vet and date
- [ ] Preview slots with "All veterinarians" — verify that vet has no slots
- [ ] Preview slots with other vets — verify they have slots normally
- [ ] Preview slots with the specific vet on leave — verify error or no slots

---

## Blocking Appointments

- [ ] Create an appointment for a vet at 10:00-11:00
- [ ] Preview slots — verify 10:00 slot does not exist
- [ ] Verify 11:00 slot exists (touching, not overlapping)
- [ ] Create appointment with buffer — verify buffer-affected slots are blocked

---

## Booking Rules

- [ ] Set minimum notice to 120 minutes
- [ ] Preview slots for today — verify only slots after current time + 120 min appear
- [ ] Set same-day booking to disabled
- [ ] Preview slots for today — verify error message
- [ ] Preview slots for tomorrow — verify slots appear normally

---

## Boundary Slots

- [ ] Verify slot at the beginning of vet availability exists
- [ ] Verify slot at the end of vet availability exists
- [ ] Verify no slot exists that would extend past vet availability end
- [ ] Verify no slot exists before vet availability start

---

## Slot Preview UI

- [ ] Page loads with service dropdown, vet selector, date picker
- [ ] Warning banner visible: "Bu ekran yalnızca uygunluk önizlemesidir..."
- [ ] Rules summary visible below form
- [ ] Results show service name, duration, date, timezone
- [ ] Results grouped by veterinarian with names
- [ ] Empty state shown when no slots available
- [ ] Loading state shown during calculation
- [ ] Breadcrumb navigation works

---

## Mobile Layout

- [ ] Page renders without horizontal overflow on mobile (320px width)
- [ ] Form fields are tappable and readable
- [ ] Slot chips wrap correctly on small screens
- [ ] Warning banner is readable on mobile

---

## Keyboard Controls

- [ ] Tab through all form fields in order
- [ ] Enter key submits the form
- [ ] Focus indicators are visible
- [ ] Escape key does not interfere with form

---

## Browser Console

- [ ] Open browser dev tools → Console
- [ ] Navigate to /admin/booking-settings/slot-preview
- [ ] Verify no errors in console
- [ ] Submit a preview request — verify no errors
- [ ] Verify no PII logged to console (phone, email, address, notes)

---

## Direct Role Access

- [ ] Log in as admin — verify slot-preview page accessible
- [ ] Log in as veterinarian — verify slot-preview page denied (404 or redirect)
- [ ] Log in as staff — verify slot-preview page denied (404 or redirect)
- [ ] Access as anonymous (incognito) — verify denied

---

## Production Domain Smoke Test

- [ ] Application deployed to production domain
- [ ] Slot-preview page loads on production
- [ ] Service dropdown populated with production services
- [ ] Slots computed correctly on production
- [ ] No console errors on production

---

## Data Policy Verification

- [ ] Verify no production owner, pet, phone, email or clinical records used in testing
- [ ] All test data is fictional
- [ ] No PII visible in slot preview results

---

## Notes

Record any issues found during manual QA:

| # | Test | Issue | Severity | Status |
|---|------|-------|----------|--------|
| | | | | |

---

**Not completed automatically.** Each item must be checked by a human tester.

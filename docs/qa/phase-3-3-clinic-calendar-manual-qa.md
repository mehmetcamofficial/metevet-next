# Phase 3.3 — Clinic Calendar Manual QA Checklist

**Date:** 2026-07-25
**Phase:** 3.3 — Clinic Calendar and Daily Operations Workspace
**Status:** Not performed — requires human tester

---

## Empty Day

- [ ] Navigate to a date with no appointments
- [ ] Verify "Bu dönem için randevu bulunmuyor" message
- [ ] Verify metrics show all zeros
- [ ] Verify no closure overlay appears

## Busy Day

- [ ] Navigate to a date with multiple appointments
- [ ] Verify appointments are displayed in day view
- [ ] Verify time axis shows correct hours
- [ ] Verify appointments are positioned by time
- [ ] Verify each card shows pet name, owner, time, service

## Multiple Veterinarians

- [ ] Day with appointments for different vets
- [ ] Verify vet grouping in day view
- [ ] Use vet filter dropdown
- [ ] Verify filtering shows only selected vet's appointments

## Pending Online Request

- [ ] Verify "Bekleyen Online Talepler" queue appears
- [ ] Verify pending count in metrics bar
- [ ] Click "İncele" to open appointment details
- [ ] Verify pending badge is visible

## Unassigned Appointment

- [ ] Verify "Atanmamış" label on unassigned appointments
- [ ] Verify unassigned count in metrics bar

## Confirm Pending Request

- [ ] Open pending appointment
- [ ] Change status to confirmed
- [ ] Verify status badge updates
- [ ] Verify pending count decreases

## Cancellation

- [ ] Open appointment
- [ ] Cancel it
- [ ] Verify cancelled badge appears
- [ ] Verify cancelled count increases

## No-Show

- [ ] Mark appointment as no-show
- [ ] Verify no-show badge appears

## Completion

- [ ] Mark appointment as completed
- [ ] Verify completed badge appears

## Rescheduling

- [ ] Open appointment details
- [ ] Change time
- [ ] Verify no overlap error
- [ ] Verify time updates in calendar

## Closure

- [ ] Create a full-clinic closure
- [ ] Verify closure overlay appears on calendar
- [ ] Verify closure title and type shown

## Leave

- [ ] Create veterinarian leave
- [ ] Verify leave overlay appears
- [ ] Verify vet-specific label

## Mobile (390px)

- [ ] Default to agenda view
- [ ] Filters collapse into dropdowns
- [ ] Appointment cards readable
- [ ] Quick actions accessible
- [ ] No horizontal overflow

## Tablet (768px)

- [ ] Day view with vet grouping
- [ ] Toolbar responsive
- [ ] Metrics bar wraps correctly

## Desktop (1280px+)

- [ ] Full operational workspace
- [ ] All views available
- [ ] Week view grid visible
- [ ] Day view time axis visible

## Chrome

- [ ] Calendar renders correctly
- [ ] All interactions work
- [ ] No console errors

## Safari

- [ ] Calendar renders correctly
- [ ] All interactions work
- [ ] No console errors

## Keyboard

- [ ] Tab through appointments
- [ ] Enter opens appointment
- [ ] Arrow keys navigate toolbar
- [ ] Focus indicators visible

## Browser Console

- [ ] No errors
- [ ] No warnings
- [ ] No PII in network requests

## Role Access

- [ ] Admin can access calendar
- [ ] Staff can access calendar
- [ ] Veterinarian can access calendar
- [ ] Anonymous redirected to login

---

**Not completed automatically.** Each item must be checked by a human tester.

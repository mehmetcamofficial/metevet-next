# Phase 3.4 — Clinic Quick Actions Manual QA Checklist

**Date:** 2026-07-25
**Phase:** 3.4 — Clinic Quick Actions and Appointment Lifecycle Management
**Status:** Not performed — requires human tester

---

## Quick Actions Dashboard

- [ ] Quick actions visible on admin dashboard
- [ ] "Yeni Randevu" links to /admin/appointments/new
- [ ] "Yeni Hizmet" links to /admin/booking-settings/services/new
- [ ] "Bekleyen Talepler" links to /admin/appointments?status=pending
- [ ] "Bugünün Takvimi" links to /admin/calendar
- [ ] "Yeni Hayvan Sahibi" links to /admin/owners/new
- [ ] "Yeni Hayvan" links to /admin/pets/new
- [ ] "Yeni Muayene" links to /admin/examinations/new
- [ ] Actions hidden for roles without write access

## Service Management

- [ ] Create service with all fields
- [ ] Edit service
- [ ] Activate service
- [ ] Deactivate service
- [ ] Enable online booking
- [ ] Disable online booking
- [ ] Archive service
- [ ] Restore archived service
- [ ] Service status badges display correctly
- [ ] Slug auto-generates from Turkish name
- [ ] Manual slug edit allowed
- [ ] Duplicate slug rejected

## Appointment Creation

- [ ] Create appointment from dashboard quick action
- [ ] Create appointment from calendar
- [ ] Date query prefill works
- [ ] Time query prefill works
- [ ] Veterinarian UUID validated
- [ ] Service UUID validated

## Appointment Lifecycle

- [ ] Confirm pending request
- [ ] Cancel appointment
- [ ] Mark no-show
- [ ] Mark completed
- [ ] Reschedule appointment
- [ ] Invalid transition rejected
- [ ] Completed appointment read-only for staff

## Rescheduling

- [ ] Reschedule excludes current appointment from conflict
- [ ] True overlap rejected
- [ ] Endpoint-touching accepted
- [ ] Different veterinarian accepted

## Pending Online Requests

- [ ] Pending queue shows on dashboard
- [ ] Unassigned queue shows on dashboard
- [ ] Public booking reference displayed
- [ ] No clinical notes exposed
- [ ] No private document paths exposed

## Mobile (390px)

- [ ] Quick actions horizontally safe
- [ ] No overflow
- [ ] Minimum 44px touch targets
- [ ] Most important actions first

## Tablet (768px)

- [ ] Quick actions wrap correctly
- [ ] Calendar usable

## Desktop (1280px+)

- [ ] Full operational workspace
- [ ] All quick actions visible

## Chrome

- [ ] All interactions work
- [ ] No console errors

## Safari

- [ ] All interactions work
- [ ] No console errors

## Keyboard

- [ ] Tab through quick actions
- [ ] Enter activates action
- [ ] Focus indicators visible

## Role Access

- [ ] Admin can access all quick actions
- [ ] Staff can access permitted actions
- [ ] Veterinarian can access permitted actions
- [ ] Anonymous redirected to login

---

**Not completed automatically.** Each item must be checked by a human tester.

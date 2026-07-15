# Phase 3.6 — Veterinarian Workspace Manual QA Checklist

**Date:** 2026-07-25
**Phase:** 3.6 — Veterinarian Workspace
**Status:** Not performed — requires human tester

---

## Veterinarian Login

- [ ] Veterinarian can access /admin/veterinarian
- [ ] Workspace shows own appointments by default
- [ ] Metrics display correctly
- [ ] Next patient card shows upcoming appointment

## Admin Veterinarian Selector

- [ ] Admin can access /admin/veterinarian
- [ ] Admin can select different veterinarian via query param
- [ ] Admin sees selected vet's appointments
- [ ] Admin cannot bypass clinical-finalization rules

## Staff Denial/Read-Only

- [ ] Staff can access reception
- [ ] Staff cannot write clinical records from veterinarian workspace
- [ ] Staff sees only permitted content

## Empty Day

- [ ] Navigate to date with no appointments
- [ ] Verify "Bu gün için aktif randevu bulunmuyor" message
- [ ] Verify metrics show all zeros
- [ ] Verify next patient shows "bekleyen hasta yok"

## Busy Day

- [ ] Navigate to date with multiple appointments
- [ ] Verify appointments displayed in queue
- [ ] Verify metrics show correct counts
- [ ] Verify next patient shows nearest upcoming

## Next Patient

- [ ] Next patient card prominently visible
- [ ] Shows time, pet, owner, service, status
- [ ] "Randevu Detayı" link works
- [ ] "Hasta Kaydı" link works
- [ ] "Muayeneyi Başlat" link works

## Appointment Without Examination

- [ ] Appointment shows in queue
- [ ] "Muayeneyi Başlat" link available
- [ ] Clicking opens examination creation
- [ ] Prefills appointment, owner, pet

## Start Examination

- [ ] Click "Muayeneyi Başlat"
- [ ] Examination creation page opens
- [ ] Appointment, owner, pet prefilled
- [ ] Server validates relationship
- [ ] No duplicate examination created

## Open Existing Examination

- [ ] Appointment with examination shows link
- [ ] Click opens examination detail
- [ ] Shows finalized/read-only state appropriately

## Finalized Examination

- [ ] Finalized examination shows read-only
- [ ] Normal vet cannot silently reopen
- [ ] Admin behavior uses current architecture

## Preventive Due

- [ ] Preventive section shows upcoming items
- [ ] Vaccination due dates visible
- [ ] Parasite treatment due dates visible
- [ ] Links to vaccination/parasite records work

## Overdue Vaccine

- [ ] Overdue vaccines shown
- [ ] Links to create follow-up work
- [ ] Vaccine card generation permitted

## Parasite Follow-up

- [ ] Overdue parasite treatments shown
- [ ] Links to create follow-up work

## Reminders

- [ ] Reminder section shows relevant reminders
- [ ] Links to reminder detail work
- [ ] No retry metadata exposed
- [ ] No automatic sending

## Recent Documents

- [ ] Recent documents section shows generated docs
- [ ] Document type labels visible
- [ ] Open/download actions work
- [ ] No storage paths exposed

## Owner/Pet Search

- [ ] Search bounded to 10 results
- [ ] Links to owner/pet detail work
- [ ] No owner address exposed
- [ ] No clinical notes in search results

## Phone Visibility

- [ ] Phone shown only for permitted roles
- [ ] Click-to-call works

## Mobile (390px)

- [ ] Single-column layout
- [ ] Next patient first
- [ ] Sticky "Muayeneyi Başlat" when context exists
- [ ] Filters in drawer
- [ ] No horizontal overflow
- [ ] Touch targets at least 44px

## Tablet (768px)

- [ ] Stacked sections
- [ ] Compact cards
- [ ] All sections visible

## Desktop (1280px+)

- [ ] Next patient prominently visible
- [ ] Daily queue plus clinical task sidebar
- [ ] Preventive and document sections below

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

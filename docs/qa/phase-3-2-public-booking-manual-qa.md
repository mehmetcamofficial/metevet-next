# Phase 3.2.1 — Public Booking Flow Manual QA Checklist

**Date:** 2026-07-15
**Phase:** 3.2.1 — Public Appointment Booking End-to-End Validation
**Status:** Not performed — no items completed

---

## Pre-requisites

- [ ] Application is deployed and accessible (staging or production URL)
- [ ] At least one active, online-bookable service exists
- [ ] At least one active veterinarian with availability exists
- [ ] At least one open date with available slots exists
- [ ] `TURNSTILE_ENABLED` is configured appropriately for the target environment (see [Production Env Checklist](./phase-3-2-production-env-checklist.md))
- [ ] No overlapping appointments exist (see [Overlap Audit Runbook](./phase-3-2-overlap-audit-runbook.md))

---

## 1. Public Flow — Turkish (`/tr/randevu`)

Complete the full booking flow in Turkish. Each step must be verified in sequence.

### Step 1: Service Selection

- [ ] Page loads at `/tr/randevu`
- [ ] Service selection step is displayed
- [ ] Available services are listed with names and durations
- [ ] Select a service — verify the next step loads

### Step 2: Veterinarian Selection

- [ ] Veterinarian selection step is displayed
- [ ] Available veterinarians are listed
- [ ] Select a veterinarian — verify the next step loads

### Step 3: Date Selection

- [ ] Date selection step is displayed
- [ ] Available dates are shown
- [ ] Past dates are not selectable
- [ ] Closed clinic days are not selectable
- [ ] Dates with no availability are not selectable
- [ ] Select a date — verify the next step loads

### Step 4: Time Slot Selection

- [ ] Available time slots are displayed for the selected date and veterinarian
- [ ] Slots are shown in the correct timezone
- [ ] Already-booked slots are not shown
- [ ] Select a time slot — verify the next step loads

### Step 5: Contact Information

- [ ] Contact form is displayed with fields: name, phone, email
- [ ] Enter valid contact information
- [ ] Verify form validation (see negative cases below)

### Step 6: Consent

- [ ] Consent checkbox is displayed
- [ ] Consent text is readable and in Turkish
- [ ] Consent checkbox is **not** pre-checked
- [ ] Verify that the form cannot proceed without checking consent (see negative cases)

### Step 7: Review

- [ ] Review step displays all selected information:
  - [ ] Service name and duration
  - [ ] Veterinarian name
  - [ ] Date and time slot
  - [ ] Contact information (name, phone, email)
  - [ ] Consent acknowledgment
- [ ] All information is accurate and matches previous selections

### Step 8: Submit

- [ ] Submit button is visible and labeled appropriately
- [ ] Click submit — verify loading state is shown
- [ ] If Turnstile is enabled: verify the Turnstile challenge completes
- [ ] Verify the form does not allow double submission (see negative cases)

### Step 9: Success

- [ ] Success page/message is displayed
- [ ] Booking reference number is shown
- [ ] Appointment details summary is shown
- [ ] No form fields are editable on the success page

---

## 2. Public Flow — English (`/en/appointment`)

Complete the full booking flow in English. Verify all labels, messages, and content are in English.

### Step 1: Service Selection

- [ ] Page loads at `/en/appointment`
- [ ] Service selection step is displayed in English
- [ ] Available services are listed with names and durations
- [ ] Select a service — verify the next step loads

### Step 2: Veterinarian Selection

- [ ] Veterinarian selection step is displayed in English
- [ ] Available veterinarians are listed
- [ ] Select a veterinarian — verify the next step loads

### Step 3: Date Selection

- [ ] Date selection step is displayed in English
- [ ] Available dates are shown
- [ ] Select a date — verify the next step loads

### Step 4: Time Slot Selection

- [ ] Available time slots are displayed
- [ ] Select a time slot — verify the next step loads

### Step 5: Contact Information

- [ ] Contact form is displayed with fields: name, phone, email
- [ ] Labels and placeholders are in English
- [ ] Enter valid contact information

### Step 6: Consent

- [ ] Consent checkbox is displayed in English
- [ ] Consent checkbox is **not** pre-checked

### Step 7: Review

- [ ] Review step displays all information in English
- [ ] All information matches previous selections

### Step 8: Submit

- [ ] Submit button is visible and labeled in English
- [ ] Click submit — verify loading state
- [ ] If Turnstile is enabled: verify the Turnstile challenge completes

### Step 9: Success

- [ ] Success page/message is displayed in English
- [ ] Booking reference number is shown
- [ ] Appointment details summary is shown

---

## 3. Negative Cases

### Stale Slot

- [ ] Open the booking form and select a slot
- [ ] In a separate browser/session, book the same slot (or have it become unavailable)
- [ ] Attempt to submit the original booking with the stale slot
- [ ] Verify: submission is rejected with an appropriate error message indicating the slot is no longer available
- [ ] **Status:** Not performed

### Double Submit

- [ ] Fill out the form completely and reach the submit step
- [ ] Click the submit button rapidly multiple times
- [ ] Verify: only one appointment is created (check admin panel)
- [ ] Verify: submit button is disabled after first click or shows loading state
- [ ] **Status:** Not performed

### Missing Consent

- [ ] Fill out the form completely
- [ ] Do **not** check the consent checkbox
- [ ] Attempt to submit
- [ ] Verify: form does not submit; consent validation error is shown
- [ ] **Status:** Not performed

### Invalid Phone Number

- [ ] Enter an invalid phone number (e.g., "abc", "123", "+")
- [ ] Attempt to proceed past the contact step
- [ ] Verify: validation error is shown for the phone field
- [ ] **Status:** Not performed

### Invalid Email Address

- [ ] Enter an invalid email (e.g., "notanemail", "@missing.com", "no@domain")
- [ ] Attempt to proceed past the contact step
- [ ] Verify: validation error is shown for the email field
- [ ] **Status:** Not performed

### No Available Slot

- [ ] Select a service and veterinarian that have no available slots for any date
- [ ] Verify: an appropriate empty-state message is shown
- [ ] Verify: the user is informed that no slots are available
- [ ] **Status:** Not performed

### Closed Clinic Day

- [ ] Select a date that is a clinic closure day
- [ ] Verify: the date is not selectable or no slots are shown
- [ ] Verify: appropriate messaging explains the clinic is closed
- [ ] **Status:** Not performed

### Veterinarian Leave

- [ ] Select a veterinarian who is on leave for all available dates
- [ ] Verify: an appropriate message indicates the veterinarian is unavailable
- [ ] Verify: no slots are shown for the leave period
- [ ] **Status:** Not performed

### Turnstile Failure

- [ ] With `TURNSTILE_ENABLED=true`, attempt to submit the form without completing the Turnstile challenge
- [ ] Verify: submission is rejected with an appropriate error
- [ ] Verify: no appointment is created
- [ ] With `TURNSTILE_ENABLED=true` and an invalid secret key, attempt a booking
- [ ] Verify: all submissions are rejected (fail-closed behavior)
- [ ] **Status:** Not performed

### Rate Limit

- [ ] Submit multiple booking requests in rapid succession (e.g., 10+ in under a minute)
- [ ] Verify: rate limiting is applied and an appropriate error is shown
- [ ] Verify: not all requests succeed
- [ ] **Status:** Not performed

### Back/Forward Navigation

- [ ] Complete the booking flow up to the review step
- [ ] Use the browser's back button to go back to the slot selection step
- [ ] Change the slot and proceed forward
- [ ] Verify: the review step shows the updated slot, not the old one
- [ ] Use the browser's forward button on the success page
- [ ] Verify: the success page does not allow re-submission or show errors
- [ ] **Status:** Not performed

### Refresh on Success Page

- [ ] Complete a booking and reach the success page
- [ ] Refresh the browser (F5 / Cmd+R)
- [ ] Verify: the success page still displays correctly (or redirects gracefully)
- [ ] Verify: no duplicate appointment is created
- [ ] Verify: no errors are shown
- [ ] **Status:** Not performed

---

## 4. Admin Verification Checks

After completing a successful public booking, verify the appointment in the admin panel.

- [ ] **Appointment list:** The new appointment appears in the admin appointment list
- [ ] **Calendar view:** The appointment appears on the calendar at the correct date and time
- [ ] **Source:** The appointment's source field is `website` (not `phone`, `walk-in`, etc.)
- [ ] **Public booking reference:** A public booking reference is generated and visible
- [ ] **Status:** The appointment status is `pending` or `confirmed` (depending on auto-confirm configuration)
- [ ] **Audit event:** An audit event was recorded for the booking creation
- [ ] **Contact details:** Owner name, phone, and email are stored correctly
- [ ] **Service:** The correct service is associated with the appointment
- [ ] **Veterinarian:** The correct veterinarian is assigned
- [ ] **Time:** `starts_at` and `ends_at` match the selected slot exactly
- [ ] **Status:** Not performed

---

## 5. Responsive Design

### 390px (Mobile — iPhone 14 Pro, etc.)

- [ ] Page renders without horizontal overflow
- [ ] All form fields are readable and tappable
- [ ] Step indicators are visible and not truncated
- [ ] Time slot chips wrap correctly
- [ ] Submit button is full-width and tappable
- [ ] Success page content fits without scrolling horizontally
- [ ] **Status:** Not performed

### 768px (Tablet — iPad Mini, etc.)

- [ ] Page renders correctly at tablet width
- [ ] Form layout adapts (wider fields, possible multi-column)
- [ ] Time slot chips display efficiently
- [ ] Review step shows information clearly
- [ ] No horizontal overflow
- [ ] **Status:** Not performed

### 1280px (Desktop)

- [ ] Page renders correctly at desktop width
- [ ] Form is centered or uses available space appropriately
- [ ] All elements are properly aligned
- [ ] No excessive whitespace or layout issues
- [ ] **Status:** Not performed

---

## 6. Accessibility

### Keyboard Navigation

- [ ] Tab through all interactive elements in logical order
- [ ] Enter key activates buttons and form submissions
- [ ] Space key toggles checkboxes (consent)
- [ ] Arrow keys work within custom selectors (if any)
- [ ] Tab order follows the visual flow of the form
- [ ] **Status:** Not performed

### Focus Indicators

- [ ] All interactive elements show visible focus indicators
- [ ] Focus indicators are high-contrast and clearly visible
- [ ] Focus does not disappear or become hidden during step transitions
- [ ] Focus moves logically when advancing between steps
- [ ] **Status:** Not performed

### Screen Reader

- [ ] Step headings are announced when a new step loads
- [ ] Form fields have associated labels read by screen readers
- [ ] Error messages are announced when validation fails
- [ ] The consent checkbox has a descriptive label
- [ ] The submit button has a clear, descriptive label
- [ ] **Status:** Not performed

### Aria-live Regions

- [ ] Step transitions are announced via `aria-live` regions
- [ ] Loading states are announced (e.g., "Loading available slots...")
- [ ] Error messages appear in `aria-live` regions
- [ ] Success confirmation is announced
- [ ] **Status:** Not performed

### Touch Targets

- [ ] All buttons are at least 44x44px (or platform equivalent)
- [ ] Time slot chips are tappable on mobile
- [ ] Consent checkbox is tappable
- [ ] Form fields have adequate tap area
- [ ] **Status:** Not performed

### No Horizontal Overflow

- [ ] At all tested widths (390px, 768px, 1280px), no horizontal scrollbar appears
- [ ] Content does not extend beyond the viewport
- [ ] Long text (veterinarian names, service names) wraps or truncates correctly
- [ ] **Status:** Not performed

---

## 7. Browser Compatibility

### Chrome (Latest)

- [ ] Full booking flow completes successfully
- [ ] Turnstile widget renders and functions (if enabled)
- [ ] No console errors during the flow
- [ ] All animations and transitions work correctly
- [ ] **Status:** Not performed

### Safari (Latest)

- [ ] Full booking flow completes successfully
- [ ] Turnstile widget renders and functions (if enabled)
- [ ] No console errors during the flow
- [ ] Date picker works correctly (Safari has different date input behavior)
- [ ] All animations and transitions work correctly
- [ ] **Status:** Not performed

### Console Errors

- [ ] Open DevTools → Console before starting the flow
- [ ] Complete the full booking flow
- [ ] Verify: no JavaScript errors in the console
- [ ] Verify: no unhandled promise rejections
- [ ] Verify: no 4xx/5xx network errors (other than expected ones)
- [ ] Verify: no PII logged to console (phone, email, name)
- [ ] **Status:** Not performed

### Hydration

- [ ] Load the booking page with DevTools → Network throttling set to "Slow 3G"
- [ ] Verify: page renders correctly during slow loading
- [ ] Verify: no hydration mismatch errors in the console
- [ ] Verify: interactive elements become functional after hydration completes
- [ ] Verify: no flash of unstyled content (FOUC)
- [ ] **Status:** Not performed

---

## Notes

Record any issues found during manual QA:

| # | Section | Test | Issue | Severity | Status |
|---|---------|------|-------|----------|--------|
| | | | | | |

---

**Not performed.** Every item in this checklist is marked as "Not performed" and must be manually executed and verified by a human tester. Do not mark any item as complete without actually performing the test.

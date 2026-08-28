# Phase 3.2.6 Interactive Clinic Journey — Manual QA

Status: **PASS WITH WARNINGS until real-browser QA**

## Contact

- Confirm only the ImmersivePageHero uses the clinic exterior.
- Verify phone, WhatsApp, directions, and booking actions are available in the hero.
- Verify practical phone, address/location, and hours cards remain below.
- Confirm no dashed or implied geographic route remains.

## Journey interaction

- Ignore guide selection and confirm the default dog keeps the experience usable.
- Select Cat and Dog with mouse and keyboard; confirm only the selected WebGL guide remains.
- Reload within the same tab and confirm the guide choice persists for the session.
- Confirm the mobile guide icon is static and no pointer gaze is active.
- Open each discovery with keyboard, close with Escape, and confirm focus returns to its trigger.
- Open discoveries in a non-linear order and verify progress reflects opened items only.
- After two discoveries, open the optional care-path selector and verify it requests no personal, symptom, or medical data.
- Confirm the non-diagnostic disclaimer and standard appointment/WhatsApp actions.
- Open all four discoveries and verify the calm completion panel provides booking, WhatsApp, and directions.

## Motion and accessibility

- Verify Trust, Services, Doctor, Gallery, Philosophy, CTA, Blog, FAQ, Contact preview, and Footer retain their distinct entrance behavior.
- Test reduced motion: all content and controls remain available, the guide stays static, and no WebGL interaction is required.
- Confirm no overlay blocks ordinary scrolling, Navbar, WhatsApp, or standard page actions.
- Check focus indicators and screen-reader names for every interactive element.


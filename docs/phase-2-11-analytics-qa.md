# Phase 2.11 analytics manual QA

- Compare today, 7-day, 30-day, current-month, previous-month and a 366-day custom range against known Supabase records.
- Verify period comparisons, zero-data messages and the 5,000-row safety notice with representative datasets.
- Exercise status, service, source and admin-only veterinarian filters; confirm malformed query values are ignored.
- As admin, veterinarian and staff, verify the permitted sections, direct analytics URLs and absence of unauthorized export/personnel links.
- Download each admin CSV and verify aggregate-only columns, UTF-8 Turkish characters, bounded output and neutralized `=`, `+`, `-`, `@` cells.
- Keyboard through filters and chart table rows. Check screen-reader headings, captions, empty states, tooltips and focus indicators.
- Check phone, tablet and desktop widths for overflow; inspect the browser console for hydration or runtime errors.
- Compare heatmap weekday/hour buckets with Europe/Istanbul calendar entries around midnight.
- Confirm insight counts and links for failed reminders, overdue care, old drafts, unassigned appointments and failed documents.
- Re-run appointment, examination, preventive-care, reminder and document workflows to confirm analytics remain read-only.

Rollback is application-first. The Phase 2.11 migration adds only indexes; if an index must be removed, use a new forward-only migration after confirming query plans. Do not rewrite an applied migration.

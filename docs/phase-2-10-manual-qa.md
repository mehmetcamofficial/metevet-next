# Phase 2.10 manual QA

Do not paste secrets into tickets or browser consoles. After changing `.env.local`, fully restart `npm run dev`; hot reload does not reliably reload server environment variables.

- Personnel: confirm the admin list loads, invitation mail arrives, resend is rate-limit safe, and password recovery ends in a signed-out state.
- Settings: save each section, reload, verify persisted values, invalid email/URL/phone/duration/hours errors, first-invalid focus, unsaved-change warning, and provider-disabled messaging.
- Authorization: as staff and veterinarian, open `/admin/settings` and `/admin/audit-log` directly and confirm a not-found response; confirm admin access.
- Audit: test date, actor, action, module and result filters; previous/next pages; empty state; only known record links; no update/delete UI.
- Responsive/accessibility: inspect mobile navigation and cards, keyboard-only traversal, focus visibility, labels, overflow, browser console and hydration output.
- Regression: create/edit clinical records, generate/download/archive a document, process reminders, and confirm safe audit rows are produced without clinical bodies or credentials.

Rollback: revert application files first. The migration is forward-only; create a new repair migration to disable the new routes/policies or remove settings objects after preserving required audit history. Never delete existing audit history as rollback.

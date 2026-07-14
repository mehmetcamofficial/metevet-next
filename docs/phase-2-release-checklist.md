# Phase 2 release checklist

Use this checklist against the linked production project. Never paste keys, signed URLs, contact details, or clinical text into tickets or audit metadata.

## Before deployment

- [ ] Confirm `npx supabase migration list` has the same local and remote versions.
- [ ] Run `npx supabase db push --dry-run`; inspect every pending statement before a real push.
- [ ] Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, server-only `SUPABASE_SERVICE_ROLE_KEY`, and exact `SUPABASE_AUTH_REDIRECT_URL` in Vercel Production.
- [ ] Run `npm ci`, `npm run test:phase2`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- [ ] Confirm `npm audit --omit=dev` has no accepted high/critical finding.
- [ ] Confirm the deployment domain and canonical origin are `https://metevet.com.tr`.

## Migration and rollback

- [ ] Take a Supabase backup/PITR recovery point before `npx supabase db push`.
- [ ] Apply migrations once, then rerun `migration list` and `db push --dry-run`.
- [ ] `20260717000000_phase_2_audit_repairs.sql` replaces validation functions/triggers and Storage policies, and copies previously stranded `vaccine_records` rows into `vaccination_records` with stable IDs and explicit legacy defaults. It does not update or delete existing clinical rows.
- [ ] `20260718000000_clinician_and_relationship_repairs.sql` enforces veterinarian-only clinical attribution, active owner/pet relationships, immutable reminder provenance, and generated-document source integrity without rewriting historical clinical rows.
- [ ] `20260719000000_document_source_and_lifecycle_repairs.sql` preserves document source semantics and cancels active reminders when a vaccination or parasite source is archived. It replaces trigger functions without deleting clinical data.
- [ ] `20260720000000_personnel_and_account_security.sql` adds active/inactive personnel state, final-admin/self-role protection, active-session authorization, and active-clinician enforcement without deleting profile or clinical history.
- [ ] `20260721000000_personnel_private_data_reconciliation.sql` idempotently moves personnel email/phone out of the broadly readable profile table into self/admin-only RLS storage. It is required because `20260720000000` was applied while the final privacy review was in progress.
- [ ] Emergency rollback: drop `reminders_protect_record` and `appointments_validate_relationships`, restore the prior upload policy, and restore the prior function definitions from migration history. Rollback weakens protection but does not lose row data.
- [ ] Do not roll back by deleting clinical rows or rewriting applied migration history.

## First administrator

- [ ] Create the Auth user in Supabase Dashboard.
- [ ] Insert the matching `profiles` row as `admin` from the trusted SQL editor.
- [ ] Sign in at `/admin/login`; verify `/admin`, logout, and session invalidation.
- [ ] Verify a user without a profile receives no staff data.

## RLS smoke tests

- [ ] As `anon`, SELECT/INSERT/UPDATE/DELETE fails for every application table and `storage.objects` in `clinical-documents`.
- [ ] As staff, application tables are readable; clinical writes, deletes, template writes, document uploads, and analytics exports fail.
- [ ] As veterinarian, valid clinical writes succeed; profile role changes, permanent deletes, finalized-examination edits, and admin exports fail.
- [ ] As admin, intended elevated actions succeed but invalid owner/pet, veterinarian, appointment, reminder-source, and Storage-path relationships fail.
- [ ] `audit_logs` permits SELECT and own INSERT only; UPDATE/DELETE fail for normal clients.
- [ ] Run the SQL cases in `docs/phase-2-rls-test-matrix.sql` inside a disposable transaction with test identities.

## Storage and PDF

- [ ] Supabase Storage shows `clinical-documents` as private, PDF-only, and limited to 10 MB.
- [ ] Clinical upload object names begin with the authenticated user's UUID folder.
- [ ] No public URL exists; download redirects use a signed URL expiring after five minutes.
- [ ] Archiving metadata does not revoke a signed URL already issued; it expires naturally within five minutes. Permanent deletion removes the private Storage object so later signed-URL requests fail.
- [ ] Generate, download, regenerate, archive/restore, and delete one disposable document.
- [ ] Force an upload and metadata failure in staging; confirm no metadata points to a missing object and cleanup is operationally visible.
- [ ] Confirm PDFs omit internal notes unless an administrator explicitly includes them.

## Critical route matrix

For each row test unauthenticated, staff, veterinarian, admin, malformed UUID, and missing record behavior where applicable.

- [ ] Public: `/`, `/tr`, `/en`, `/tr/randevu`, `/en/appointment`, `/tr/blog`, `/en/blog`, `/tr/iletisim`, `/en/contact`.
- [ ] Auth: `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`, `/admin/profile`, `/admin`, logout.
- [ ] Personnel: `/admin/staff`, `/admin/staff/invite`, `/admin/staff/[id]`, `/admin/staff/[id]/edit` (admin only).
- [ ] Records: `/admin/owners`, `/admin/owners/new`, `/admin/pets`, `/admin/pets/new`.
- [ ] Clinical: `/admin/appointments`, `/admin/appointments/new`, `/admin/calendar`, `/admin/examinations`, `/admin/examinations/new`, `/admin/vaccines`, `/admin/vaccines/new`, `/admin/parasites`, `/admin/parasites/new`.
- [ ] Operations: `/admin/reminders`, `/admin/reminders/new`, `/admin/reminders/templates`, `/admin/documents`, `/admin/documents/generate`.
- [ ] Analytics: `/admin/analytics`, `/admin/analytics/appointments`, `/admin/analytics/preventive-care`, `/admin/analytics/operations`.
- [ ] Confirm admin responses are `no-store` and admin metadata is `noindex`.

## Reminder lifecycle

- [ ] Exercise due-today, overdue, future, cancelled source, archived source, duplicate generation, failed retry, and invalid recipient cases.
- [ ] Confirm duplicate active reminders are rejected by the unique indexes.
- [ ] Confirm SMS/email say provider unavailable and WhatsApp remains a manual action.
- [ ] Confirm retry count/timestamps and audit events match the state transition.
- [ ] Confirm audit metadata contains no message, phone number, email, or clinical note.

## Vercel deployment

- [ ] Deploy the migration before application code that depends on it.
- [ ] Deploy with the Node.js runtime; document/PDF handlers must not be moved to Edge.
- [ ] Confirm there is no filesystem persistence, background worker, or Phase 2 cron dependency.
- [ ] Smoke-test authentication refresh, one read workflow, one authorized mutation, PDF generation/download, analytics, and logout.
- [ ] Check Vercel and Supabase logs for authorization, constraint, Storage cleanup, and server-action errors without recording sensitive payloads.

## Application rollback

- [ ] Keep the previous Vercel deployment available for instant promotion.
- [ ] If application rollback is required, promote it first; retain the additive repair migration unless it demonstrably blocks valid production data.
- [ ] If migration rollback is unavoidable, use the function/policy rollback above during a maintenance window and rerun all RLS smoke tests.
- [ ] Restore data only from the pre-deployment backup/PITR point; document the recovery time and affected records.

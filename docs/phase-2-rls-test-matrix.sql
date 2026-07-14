-- Documentation-only smoke matrix. Run in a disposable/staging project inside
-- a transaction after substituting test UUIDs and JWT claims. Never run these
-- mutations against production clinical records.
begin;

-- Expected policy capabilities:
-- anon: no access to any public application table or clinical-documents object.
-- staff: SELECT application tables; INSERT own audit log only.
-- veterinarian: staff reads plus clinical INSERT/UPDATE and own-path PDF upload.
-- admin: veterinarian capabilities plus intended DELETE/archive operations.

-- Relationship cases expected to fail with SQLSTATE 23514:
-- 1. appointment owner_id does not own pet_id
-- 2. examination appointment_id does not match owner_id/pet_id
-- 3. preventive veterinarian_id has role staff
-- 4. vaccination appointment_id does not match owner_id/pet_id
-- 5. generated reminder references a cancelled/archived or mismatched source
-- 6. generated reminder has zero or multiple source IDs

-- Authorization cases expected to fail with SQLSTATE 42501 / RLS denial:
-- 1. authenticated user without profiles row reads owners
-- 2. staff inserts/updates clinical data
-- 3. veterinarian changes profiles.role or deletes a protected row
-- 4. veterinarian updates a finalized examination without admin reopen
-- 5. authenticated client changes reminders.created_by
-- 6. clinical upload path first folder differs from auth.uid()
-- 7. normal client updates/deletes audit_logs

rollback;

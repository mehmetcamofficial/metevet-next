begin;

-- Enforce cross-table invariants below RLS so direct authenticated API calls
-- cannot create relationships that the application would reject.
create or replace function public.validate_appointment_relationships()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_owner uuid;
begin
  select owner_id into expected_owner from public.pets where id = new.pet_id;
  if expected_owner is null or expected_owner <> new.owner_id then
    raise exception 'Owner and pet do not match.' using errcode = '23514';
  end if;

  if new.assigned_user_id is not null and not exists (
    select 1 from public.profiles where id = new.assigned_user_id
  ) then
    raise exception 'Assigned staff member is invalid.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_validate_relationships on public.appointments;
create trigger appointments_validate_relationships
before insert or update of owner_id, pet_id, assigned_user_id on public.appointments
for each row execute function public.validate_appointment_relationships();

create or replace function public.protect_appointment_workflow()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) <> 'authenticated' then return new; end if;
  if tg_op = 'INSERT' then
    if new.status not in ('pending', 'confirmed') and not (select public.is_admin()) then
      raise exception 'Invalid initial appointment status.' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' and not (select public.is_admin()) then
    raise exception 'Only administrators can cancel appointments.' using errcode = '42501';
  end if;
  if new.status <> old.status and not (select public.is_admin()) and not (
    (old.status = 'pending' and new.status = 'confirmed') or
    (old.status = 'confirmed' and new.status in ('completed', 'no_show'))
  ) then raise exception 'Invalid appointment status transition.' using errcode = '23514'; end if;
  return new;
end;
$$;

drop trigger if exists appointments_protect_workflow on public.appointments;
create trigger appointments_protect_workflow
before insert or update of status on public.appointments
for each row execute function public.protect_appointment_workflow();

create or replace function public.prevent_pet_reparent_with_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id and (
    exists (select 1 from public.appointments where pet_id = old.id) or
    exists (select 1 from public.examinations where pet_id = old.id) or
    exists (select 1 from public.vaccination_records where pet_id = old.id) or
    exists (select 1 from public.parasite_records where pet_id = old.id) or
    exists (select 1 from public.reminders where pet_id = old.id) or
    exists (select 1 from public.generated_documents where pet_id = old.id)
  ) then raise exception 'A pet with clinical history cannot be reassigned.' using errcode = '23514'; end if;
  return new;
end;
$$;

drop trigger if exists pets_prevent_reparent_with_history on public.pets;
create trigger pets_prevent_reparent_with_history
before update of owner_id on public.pets
for each row execute function public.prevent_pet_reparent_with_history();

create or replace function public.protect_examination_record()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_owner uuid;
  veterinarian_role public.user_role;
begin
  select owner_id into expected_owner from public.pets where id = new.pet_id;
  if expected_owner is null or new.owner_id <> expected_owner then
    raise exception 'Owner and pet do not match.' using errcode = '23514';
  end if;
  select role into veterinarian_role from public.profiles where id = new.veterinarian_id;
  if veterinarian_role is null or veterinarian_role not in ('admin', 'veterinarian') then
    raise exception 'Invalid veterinarian.' using errcode = '23514';
  end if;
  if new.appointment_id is not null and not exists (
    select 1 from public.appointments
    where id = new.appointment_id and owner_id = new.owner_id and pet_id = new.pet_id
  ) then
    raise exception 'Appointment does not match owner and pet.' using errcode = '23514';
  end if;
  if tg_op = 'INSERT' and new.status = 'archived'
    and (select auth.role()) = 'authenticated' and not (select public.is_admin()) then
    raise exception 'Only administrators can archive records.' using errcode = '42501';
  end if;
  if new.status = 'finalized' and new.finalized_at is null then new.finalized_at = now(); end if;
  if tg_op = 'UPDATE' and (select auth.role()) = 'authenticated' then
    if old.status = 'finalized' and new.status = 'finalized' then
      raise exception 'Finalized records are read-only.' using errcode = '42501';
    end if;
    if old.status = 'finalized' and new.status <> 'finalized' and not (select public.is_admin()) then
      raise exception 'Only administrators can reopen records.' using errcode = '42501';
    end if;
    if (new.status = 'archived' or old.status = 'archived') and not (select public.is_admin()) then
      raise exception 'Only administrators can manage archives.' using errcode = '42501';
    end if;
  end if;
  if new.status <> 'finalized' then new.finalized_at = null; end if;
  new.archived_at = case when new.status = 'archived' then coalesce(new.archived_at, now()) else null end;
  return new;
end;
$$;

create or replace function public.protect_preventive_record()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_owner uuid;
  veterinarian_role public.user_role;
begin
  select owner_id into expected_owner from public.pets where id = new.pet_id;
  if expected_owner is null or expected_owner <> new.owner_id then
    raise exception 'Owner and pet do not match.' using errcode = '23514';
  end if;
  if new.veterinarian_id is not null then
    select role into veterinarian_role from public.profiles where id = new.veterinarian_id;
    if veterinarian_role is null or veterinarian_role not in ('admin', 'veterinarian') then
      raise exception 'Invalid veterinarian.' using errcode = '23514';
    end if;
  end if;
  if tg_table_name = 'vaccination_records' and new.appointment_id is not null and not exists (
    select 1 from public.appointments
    where id = new.appointment_id and owner_id = new.owner_id and pet_id = new.pet_id
  ) then
    raise exception 'Appointment does not match owner and pet.' using errcode = '23514';
  end if;
  if ((tg_op = 'INSERT' and new.archived_at is not null)
      or (tg_op = 'UPDATE' and new.archived_at is distinct from old.archived_at))
    and (select auth.role()) = 'authenticated' and not (select public.is_admin()) then
    raise exception 'Only administrators can manage archives.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.status = 'completed'
    and new is distinct from old and not (select public.is_admin()) then
    raise exception 'Completed preventive records require administrator correction.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.protect_reminder_record()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_owner uuid;
  source_count integer;
begin
  if tg_op = 'INSERT' or row(new.owner_id, new.pet_id, new.appointment_id,
      new.vaccine_record_id, new.parasite_record_id, new.examination_id)
      is distinct from row(old.owner_id, old.pet_id, old.appointment_id,
      old.vaccine_record_id, old.parasite_record_id, old.examination_id) then
  if new.pet_id is not null then
    select owner_id into expected_owner from public.pets where id = new.pet_id;
    if expected_owner is null or expected_owner <> new.owner_id then
      raise exception 'Reminder owner and pet do not match.' using errcode = '23514';
    end if;
  end if;

  source_count := num_nonnulls(new.appointment_id, new.vaccine_record_id,
    new.parasite_record_id, new.examination_id);
  if new.reminder_type <> 'custom' and source_count <> 1 then
    raise exception 'A generated reminder requires exactly one source.' using errcode = '23514';
  end if;
  if new.reminder_type = 'custom' and source_count > 1 then
    raise exception 'A custom reminder can reference at most one source.' using errcode = '23514';
  end if;

  if new.appointment_id is not null and not exists (
    select 1 from public.appointments where id = new.appointment_id
      and owner_id = new.owner_id and pet_id = new.pet_id and status <> 'cancelled'
  ) then raise exception 'Invalid appointment reminder source.' using errcode = '23514'; end if;
  if new.vaccine_record_id is not null and not exists (
    select 1 from public.vaccination_records where id = new.vaccine_record_id
      and owner_id = new.owner_id and pet_id = new.pet_id and archived_at is null and status <> 'cancelled'
  ) then raise exception 'Invalid vaccine reminder source.' using errcode = '23514'; end if;
  if new.parasite_record_id is not null and not exists (
    select 1 from public.parasite_records where id = new.parasite_record_id
      and owner_id = new.owner_id and pet_id = new.pet_id and archived_at is null and status <> 'cancelled'
  ) then raise exception 'Invalid parasite reminder source.' using errcode = '23514'; end if;
  if new.examination_id is not null and not exists (
    select 1 from public.examinations where id = new.examination_id
      and owner_id = new.owner_id and pet_id = new.pet_id and status <> 'archived'
  ) then raise exception 'Invalid examination reminder source.' using errcode = '23514'; end if;
  end if;

  if tg_op = 'INSERT' and (select auth.role()) = 'authenticated'
    and new.created_by is distinct from (select auth.uid()) then
    raise exception 'Reminder creator is invalid.' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and new.status <> 'pending' then
    raise exception 'New reminders must start pending.' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    if new.created_by is distinct from old.created_by then
      raise exception 'Reminder creator cannot be changed.' using errcode = '42501';
    end if;
    if row(new.owner_id, new.pet_id, new.appointment_id, new.vaccine_record_id,
      new.parasite_record_id, new.examination_id, new.reminder_type,
      new.recipient_name, new.recipient_phone, new.recipient_email)
      is distinct from row(old.owner_id, old.pet_id, old.appointment_id,
      old.vaccine_record_id, old.parasite_record_id, old.examination_id,
      old.reminder_type, old.recipient_name, old.recipient_phone, old.recipient_email) then
      raise exception 'Reminder source and recipient are immutable.' using errcode = '42501';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'pending' and new.status in ('ready','sent','failed','cancelled')) or
      (old.status = 'ready' and new.status in ('sent','failed','cancelled')) or
      (old.status = 'failed' and new.status in ('ready','sent','cancelled'))
    ) then raise exception 'Invalid reminder status transition.' using errcode = '23514'; end if;
    if new.retry_count < old.retry_count or new.retry_count > old.retry_count + 1 then
      raise exception 'Invalid reminder retry count.' using errcode = '23514';
    end if;
  end if;
  if new.status = 'sent' then
    new.sent_at = coalesce(new.sent_at, now());
    if (select auth.role()) = 'authenticated' then new.sent_by = (select auth.uid()); end if;
  elsif new.status = 'failed' then
    new.failed_at = coalesce(new.failed_at, now());
    if nullif(trim(new.failure_reason), '') is null then
      raise exception 'Failure reason is required.' using errcode = '23514';
    end if;
  elsif new.status = 'cancelled' then
    new.cancelled_at = coalesce(new.cancelled_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists reminders_protect_record on public.reminders;
create trigger reminders_protect_record
before insert or update on public.reminders
for each row execute function public.protect_reminder_record();

create or replace function public.cancel_invalid_source_reminders()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'appointments' and new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.reminders set status = 'cancelled', cancelled_at = now()
      where appointment_id = new.id and status in ('pending', 'ready', 'failed');
  elsif tg_table_name = 'vaccination_records'
    and (new.status = 'cancelled' or new.archived_at is not null)
    and row(new.status, new.archived_at) is distinct from row(old.status, old.archived_at) then
    update public.reminders set status = 'cancelled', cancelled_at = now()
      where vaccine_record_id = new.id and status in ('pending', 'ready', 'failed');
  elsif tg_table_name = 'parasite_records'
    and (new.status = 'cancelled' or new.archived_at is not null)
    and row(new.status, new.archived_at) is distinct from row(old.status, old.archived_at) then
    update public.reminders set status = 'cancelled', cancelled_at = now()
      where parasite_record_id = new.id and status in ('pending', 'ready', 'failed');
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_cancel_reminders on public.appointments;
create trigger appointments_cancel_reminders after update of status on public.appointments
for each row execute function public.cancel_invalid_source_reminders();
drop trigger if exists vaccinations_cancel_reminders on public.vaccination_records;
create trigger vaccinations_cancel_reminders after update of status, archived_at on public.vaccination_records
for each row execute function public.cancel_invalid_source_reminders();
drop trigger if exists parasites_cancel_reminders on public.parasite_records;
create trigger parasites_cancel_reminders after update of status, archived_at on public.parasite_records
for each row execute function public.cancel_invalid_source_reminders();

create or replace function public.protect_generated_document()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'generated' then
      raise exception 'New documents must start generated.' using errcode = '23514';
    end if;
    if new.storage_path is not null and split_part(new.storage_path, '/', 1) <> new.generated_by::text then
      raise exception 'Invalid document storage path.' using errcode = '23514';
    end if;
  elsif row(new.document_type, new.owner_id, new.pet_id, new.appointment_id,
      new.examination_id, new.generated_by, new.title, new.language, new.file_name,
      new.storage_path, new.checksum, new.metadata, new.generated_at, new.created_at)
      is distinct from row(old.document_type, old.owner_id, old.pet_id,
      old.appointment_id, old.examination_id, old.generated_by, old.title,
      old.language, old.file_name, old.storage_path, old.checksum, old.metadata,
      old.generated_at, old.created_at) then
    raise exception 'Document provenance is immutable.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status and not (
    (old.status = 'generated' and new.status = 'archived') or
    (old.status = 'archived' and new.status = 'generated')
  ) then raise exception 'Invalid document status transition.' using errcode = '23514'; end if;
  return new;
end;
$$;

drop trigger if exists generated_documents_protect_record on public.generated_documents;
create trigger generated_documents_protect_record
before insert or update on public.generated_documents
for each row execute function public.protect_generated_document();

drop policy if exists "Staff read generated documents" on public.generated_documents;
create policy "Authorized staff read generated documents" on public.generated_documents
for select to authenticated using (
  public.is_clinical_staff() or (public.is_staff() and document_type = 'appointment_summary')
);

-- Direct Storage API uploads must use the same user-prefixed path generated by
-- the server. Bucket MIME and size restrictions remain enforced separately.
drop policy if exists "Clinical staff upload clinical documents" on storage.objects;
drop policy if exists "Clinical staff upload own clinical documents" on storage.objects;
create policy "Clinical staff upload own clinical documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'clinical-documents'
  and (
    public.is_admin()
    or (public.is_clinical_staff() and (storage.foldername(name))[1] = (select auth.uid())::text)
  )
);

drop policy if exists "Staff read clinical documents" on storage.objects;
create policy "Clinical staff read clinical documents"
on storage.objects for select to authenticated
using (bucket_id = 'clinical-documents' and public.is_clinical_staff());

drop policy if exists "Clinical staff delete own clinical documents" on storage.objects;
create policy "Clinical staff delete own clinical documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'clinical-documents'
  and public.is_clinical_staff()
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Preserve records from the superseded Phase 2 vaccine table. Stable IDs keep
-- any external references meaningful; conflicts indicate an already migrated row.
insert into public.vaccination_records (
  id, pet_id, owner_id, veterinarian_id, vaccine_name, manufacturer,
  batch_number, dose_number, route, administration_date, next_due_date,
  status, notes, created_at, updated_at
)
select v.id, v.pet_id, p.owner_id,
  case when pr.role in ('admin', 'veterinarian') then v.administered_by else null end,
  v.vaccine_name, 'Legacy import', coalesce(nullif(trim(v.batch_number), ''), 'legacy'),
  1, 'unspecified', v.administered_at, v.next_due_at, 'completed', v.notes,
  v.created_at, v.updated_at
from public.vaccine_records v
join public.pets p on p.id = v.pet_id
left join public.profiles pr on pr.id = v.administered_by
where not exists (select 1 from public.vaccination_records n where n.id = v.id);

drop policy if exists "Clinical staff can insert vaccine records" on public.vaccine_records;
drop policy if exists "Clinical staff can update vaccine records" on public.vaccine_records;
drop policy if exists "Admins can delete vaccine records" on public.vaccine_records;
revoke insert, update, delete on public.vaccine_records from authenticated;

commit;

begin;

create or replace function public.validate_appointment_relationships()
returns trigger language plpgsql set search_path = '' as $$
declare expected_owner uuid;
begin
  if tg_op = 'INSERT' or new.status <> 'cancelled' or row(new.owner_id,new.pet_id,new.assigned_user_id)
    is distinct from row(old.owner_id,old.pet_id,old.assigned_user_id) then
    select p.owner_id into expected_owner from public.pets p
    join public.owners o on o.id = p.owner_id
    where p.id = new.pet_id and p.archived_at is null and o.archived_at is null;
    if expected_owner is null or expected_owner <> new.owner_id then
      raise exception 'Owner and active pet do not match.' using errcode = '23514';
    end if;
    if new.assigned_user_id is not null and not exists (
      select 1 from public.profiles where id = new.assigned_user_id
    ) then raise exception 'Assigned staff member is invalid.' using errcode = '23514'; end if;
  end if;
  return new;
end; $$;

drop trigger if exists appointments_validate_relationships on public.appointments;
create trigger appointments_validate_relationships
before insert or update on public.appointments
for each row execute function public.validate_appointment_relationships();

create or replace function public.protect_examination_record()
returns trigger language plpgsql set search_path = '' as $$
declare expected_owner uuid; veterinarian_role public.user_role;
begin
  if tg_op = 'INSERT'
    or row(new.owner_id,new.pet_id,new.veterinarian_id,new.appointment_id)
      is distinct from row(old.owner_id,old.pet_id,old.veterinarian_id,old.appointment_id)
    or (to_jsonb(new) - array['status','finalized_at','archived_at','updated_at'])
      is distinct from (to_jsonb(old) - array['status','finalized_at','archived_at','updated_at']) then
    select p.owner_id into expected_owner from public.pets p
    join public.owners o on o.id = p.owner_id
    where p.id = new.pet_id and p.archived_at is null and o.archived_at is null;
    if expected_owner is null or new.owner_id <> expected_owner then
      raise exception 'Owner and active pet do not match.' using errcode = '23514';
    end if;
    select role into veterinarian_role from public.profiles where id = new.veterinarian_id;
    if veterinarian_role is null or veterinarian_role <> 'veterinarian' then
      raise exception 'Invalid veterinarian.' using errcode = '23514';
    end if;
    if new.appointment_id is not null and not exists (
      select 1 from public.appointments where id = new.appointment_id
        and owner_id = new.owner_id and pet_id = new.pet_id
    ) then raise exception 'Appointment does not match owner and pet.' using errcode = '23514'; end if;
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
end; $$;

create or replace function public.protect_preventive_record()
returns trigger language plpgsql set search_path = '' as $$
declare expected_owner uuid; veterinarian_role public.user_role; relationships_changed boolean;
begin
  relationships_changed := tg_op = 'INSERT';
  if tg_op = 'UPDATE' then
    if tg_table_name = 'vaccination_records' then
      relationships_changed := row(new.owner_id,new.pet_id,new.veterinarian_id,new.appointment_id)
        is distinct from row(old.owner_id,old.pet_id,old.veterinarian_id,old.appointment_id);
    else
      relationships_changed := row(new.owner_id,new.pet_id,new.veterinarian_id)
        is distinct from row(old.owner_id,old.pet_id,old.veterinarian_id);
    end if;
  end if;
  if tg_op = 'UPDATE' and (to_jsonb(new) - array['archived_at','updated_at'])
    is distinct from (to_jsonb(old) - array['archived_at','updated_at']) then
    relationships_changed := true;
  end if;
  if relationships_changed then
    select p.owner_id into expected_owner from public.pets p
    join public.owners o on o.id = p.owner_id
    where p.id = new.pet_id and p.archived_at is null and o.archived_at is null;
    if expected_owner is null or expected_owner <> new.owner_id then
      raise exception 'Owner and active pet do not match.' using errcode = '23514';
    end if;
    if new.veterinarian_id is null and (select auth.role()) = 'authenticated' then
      raise exception 'A veterinarian is required.' using errcode = '23514';
    elsif new.veterinarian_id is not null then
      select role into veterinarian_role from public.profiles where id = new.veterinarian_id;
      if veterinarian_role is null or veterinarian_role <> 'veterinarian' then
        raise exception 'Invalid veterinarian.' using errcode = '23514';
      end if;
    end if;
    if tg_table_name = 'vaccination_records' then
      if new.appointment_id is not null and not exists (
        select 1 from public.appointments where id = new.appointment_id
          and owner_id = new.owner_id and pet_id = new.pet_id
      ) then raise exception 'Appointment does not match owner and pet.' using errcode = '23514'; end if;
    end if;
  end if;
  if ((tg_op = 'INSERT' and new.archived_at is not null)
      or (tg_op = 'UPDATE' and new.archived_at is distinct from old.archived_at))
    and (select auth.role()) = 'authenticated' and not (select public.is_admin()) then
    raise exception 'Only administrators can manage archives.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.status = 'completed' and new is distinct from old
    and not (select public.is_admin()) then
    raise exception 'Completed preventive records require administrator correction.' using errcode = '42501';
  end if;
  return new;
end; $$;

create or replace function public.protect_reminder_record()
returns trigger language plpgsql set search_path = '' as $$
declare expected_owner uuid; source_count integer;
begin
  if tg_op = 'INSERT' or row(new.owner_id,new.pet_id,new.appointment_id,new.vaccine_record_id,new.parasite_record_id,new.examination_id)
    is distinct from row(old.owner_id,old.pet_id,old.appointment_id,old.vaccine_record_id,old.parasite_record_id,old.examination_id) then
    if new.pet_id is not null then
      select p.owner_id into expected_owner from public.pets p
      join public.owners o on o.id = p.owner_id
      where p.id = new.pet_id and p.archived_at is null and o.archived_at is null;
      if expected_owner is null or expected_owner <> new.owner_id then
        raise exception 'Reminder owner and active pet do not match.' using errcode = '23514';
      end if;
    end if;
    source_count := num_nonnulls(new.appointment_id,new.vaccine_record_id,new.parasite_record_id,new.examination_id);
    if new.reminder_type <> 'custom' and source_count <> 1 then
      raise exception 'A generated reminder requires exactly one source.' using errcode = '23514';
    end if;
    if new.reminder_type = 'custom' and source_count > 1 then
      raise exception 'A custom reminder can reference at most one source.' using errcode = '23514';
    end if;
    if new.appointment_id is not null and not exists (select 1 from public.appointments where id=new.appointment_id and owner_id=new.owner_id and pet_id=new.pet_id and status<>'cancelled') then raise exception 'Invalid appointment reminder source.' using errcode='23514'; end if;
    if new.vaccine_record_id is not null and not exists (select 1 from public.vaccination_records where id=new.vaccine_record_id and owner_id=new.owner_id and pet_id=new.pet_id and archived_at is null and status<>'cancelled') then raise exception 'Invalid vaccine reminder source.' using errcode='23514'; end if;
    if new.parasite_record_id is not null and not exists (select 1 from public.parasite_records where id=new.parasite_record_id and owner_id=new.owner_id and pet_id=new.pet_id and archived_at is null and status<>'cancelled') then raise exception 'Invalid parasite reminder source.' using errcode='23514'; end if;
    if new.examination_id is not null and not exists (select 1 from public.examinations where id=new.examination_id and owner_id=new.owner_id and pet_id=new.pet_id and status<>'archived') then raise exception 'Invalid examination reminder source.' using errcode='23514'; end if;
  end if;
  if tg_op = 'INSERT' then
    if (select auth.role())='authenticated' and new.created_by is distinct from (select auth.uid()) then raise exception 'Reminder creator is invalid.' using errcode='42501'; end if;
    if new.status <> 'pending' then raise exception 'New reminders must start pending.' using errcode='23514'; end if;
    new.retry_count=0;new.sent_at=null;new.sent_by=null;new.failed_at=null;new.failure_reason=null;new.cancelled_at=null;
  else
    if new.created_by is distinct from old.created_by then raise exception 'Reminder creator cannot be changed.' using errcode='42501'; end if;
    if row(new.owner_id,new.pet_id,new.appointment_id,new.vaccine_record_id,new.parasite_record_id,new.examination_id,new.reminder_type,new.recipient_name,new.recipient_phone,new.recipient_email)
      is distinct from row(old.owner_id,old.pet_id,old.appointment_id,old.vaccine_record_id,old.parasite_record_id,old.examination_id,old.reminder_type,old.recipient_name,old.recipient_phone,old.recipient_email) then raise exception 'Reminder source and recipient are immutable.' using errcode='42501'; end if;
    if new.status is distinct from old.status and new.status <> 'cancelled' and new.pet_id is not null and not exists (
      select 1 from public.pets p join public.owners o on o.id=p.owner_id
      where p.id=new.pet_id and p.owner_id=new.owner_id and p.archived_at is null and o.archived_at is null
    ) then raise exception 'Archived recipients cannot receive reminders.' using errcode='23514'; end if;
    if new.status is distinct from old.status and not ((old.status='pending' and new.status in('ready','sent','failed','cancelled')) or (old.status='ready' and new.status in('sent','failed','cancelled')) or (old.status='failed' and new.status in('ready','sent','cancelled'))) then raise exception 'Invalid reminder status transition.' using errcode='23514'; end if;
    if old.status='failed' and new.status='ready' then new.retry_count=old.retry_count+1; elsif new.retry_count<>old.retry_count then raise exception 'Invalid reminder retry count.' using errcode='23514'; end if;
  end if;
  if new.status in ('pending','ready') then new.sent_at=null;new.sent_by=null;new.failed_at=null;new.failure_reason=null;new.cancelled_at=null;
  elsif new.status='sent' then new.sent_at=now();new.sent_by=case when (select auth.role())='authenticated' then (select auth.uid()) else new.sent_by end;new.failed_at=null;new.failure_reason=null;new.cancelled_at=null;
  elsif new.status='failed' then new.sent_at=null;new.sent_by=null;new.failed_at=now();new.cancelled_at=null;if nullif(trim(new.failure_reason),'') is null then raise exception 'Failure reason is required.' using errcode='23514';end if;
  elsif new.status='cancelled' then new.sent_at=null;new.sent_by=null;new.failed_at=null;new.failure_reason=null;new.cancelled_at=now();end if;
  return new;
end; $$;

create or replace function public.protect_generated_document()
returns trigger language plpgsql set search_path = '' as $$
declare expected_owner uuid; expected_pet uuid; source_status text;
begin
  if tg_op='INSERT' then
    if new.status<>'generated' then raise exception 'New documents must start generated.' using errcode='23514'; end if;
    if new.storage_path is not null and split_part(new.storage_path,'/',1)<>new.generated_by::text then raise exception 'Invalid document storage path.' using errcode='23514'; end if;
    if new.document_type='appointment_summary' then
      select owner_id,pet_id into expected_owner,expected_pet from public.appointments where id=new.appointment_id;
      if expected_owner is null or new.examination_id is not null or new.owner_id<>expected_owner or new.pet_id<>expected_pet then raise exception 'Invalid appointment document source.' using errcode='23514'; end if;
    elsif new.document_type in ('examination_summary','follow_up_instructions','custom_clinical_note') then
      select owner_id,pet_id,status into expected_owner,expected_pet,source_status from public.examinations where id=new.examination_id;
      if expected_owner is null or source_status<>'finalized' or new.appointment_id is not null or new.owner_id<>expected_owner or new.pet_id<>expected_pet then raise exception 'Invalid examination document source.' using errcode='23514'; end if;
    else
      select p.owner_id into expected_owner from public.pets p join public.owners o on o.id=p.owner_id where p.id=new.pet_id and p.archived_at is null and o.archived_at is null;
      if expected_owner is null or new.owner_id<>expected_owner or new.appointment_id is not null or new.examination_id is not null then raise exception 'Invalid pet document source.' using errcode='23514'; end if;
    end if;
  elsif row(new.document_type,new.owner_id,new.pet_id,new.appointment_id,new.examination_id,new.generated_by,new.title,new.language,new.file_name,new.storage_path,new.checksum,new.metadata,new.generated_at,new.created_at)
    is distinct from row(old.document_type,old.owner_id,old.pet_id,old.appointment_id,old.examination_id,old.generated_by,old.title,old.language,old.file_name,old.storage_path,old.checksum,old.metadata,old.generated_at,old.created_at) then raise exception 'Document provenance is immutable.' using errcode='42501';
  end if;
  if tg_op='UPDATE' and new.status is distinct from old.status and not ((old.status='generated' and new.status='archived') or (old.status='archived' and new.status='generated')) then raise exception 'Invalid document status transition.' using errcode='23514'; end if;
  return new;
end; $$;

commit;

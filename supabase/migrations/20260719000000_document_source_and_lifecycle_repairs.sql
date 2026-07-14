begin;

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
    elsif new.document_type in ('examination_summary','follow_up_instructions') then
      select owner_id,pet_id,status into expected_owner,expected_pet,source_status from public.examinations where id=new.examination_id;
      if expected_owner is null or source_status<>'finalized' or new.appointment_id is not null or new.owner_id<>expected_owner or new.pet_id<>expected_pet then raise exception 'Invalid finalized examination document source.' using errcode='23514'; end if;
    elsif new.document_type='custom_clinical_note' then
      select owner_id,pet_id,status into expected_owner,expected_pet,source_status from public.examinations where id=new.examination_id;
      if expected_owner is null or source_status='archived' or new.appointment_id is not null or new.owner_id<>expected_owner or new.pet_id<>expected_pet then raise exception 'Invalid clinical note source.' using errcode='23514'; end if;
    else
      select p.owner_id into expected_owner from public.pets p join public.owners o on o.id=p.owner_id where p.id=new.pet_id and p.archived_at is null and o.archived_at is null;
      if expected_owner is null or new.owner_id<>expected_owner or new.appointment_id is not null or new.examination_id is not null then raise exception 'Invalid active pet document source.' using errcode='23514'; end if;
    end if;
  elsif row(new.document_type,new.owner_id,new.pet_id,new.appointment_id,new.examination_id,new.generated_by,new.title,new.language,new.file_name,new.storage_path,new.checksum,new.metadata,new.generated_at,new.created_at)
    is distinct from row(old.document_type,old.owner_id,old.pet_id,old.appointment_id,old.examination_id,old.generated_by,old.title,old.language,old.file_name,old.storage_path,old.checksum,old.metadata,old.generated_at,old.created_at) then raise exception 'Document provenance is immutable.' using errcode='42501';
  end if;
  if tg_op='UPDATE' and new.status is distinct from old.status and not ((old.status='generated' and new.status='archived') or (old.status='archived' and new.status='generated')) then raise exception 'Invalid document status transition.' using errcode='23514'; end if;
  return new;
end; $$;

create or replace function public.cancel_reminders_for_archived_preventive_record()
returns trigger language plpgsql security definer set search_path = '' as $$
declare reminder_row record;
begin
  if old.archived_at is null and new.archived_at is not null then
    for reminder_row in
      update public.reminders
      set status='cancelled'
      where status in ('pending','ready','failed')
        and ((tg_table_name='vaccination_records' and vaccine_record_id=new.id)
          or (tg_table_name='parasite_records' and parasite_record_id=new.id))
      returning id,reminder_type,channel
    loop
      insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
      values((select auth.uid()),'reminder_cancelled','reminder',reminder_row.id,
        jsonb_build_object('reminder_type',reminder_row.reminder_type,'channel',reminder_row.channel,'reason','source_archived'));
    end loop;
  end if;
  return new;
end; $$;

drop trigger if exists vaccination_records_cancel_reminders_on_archive on public.vaccination_records;
create trigger vaccination_records_cancel_reminders_on_archive
after update of archived_at on public.vaccination_records
for each row execute function public.cancel_reminders_for_archived_preventive_record();

drop trigger if exists parasite_records_cancel_reminders_on_archive on public.parasite_records;
create trigger parasite_records_cancel_reminders_on_archive
after update of archived_at on public.parasite_records
for each row execute function public.cancel_reminders_for_archived_preventive_record();

revoke all on function public.cancel_reminders_for_archived_preventive_record() from public;

commit;

alter type public.reminder_status add value if not exists 'ready' after 'pending';

alter table public.reminders rename column remind_at to scheduled_for;
alter table public.reminders rename column message to rendered_message;
alter table public.reminders
  add column if not exists parasite_record_id uuid references public.parasite_records(id) on delete restrict,
  add column if not exists examination_id uuid references public.examinations(id) on delete restrict,
  add column if not exists reminder_type text,
  add column if not exists retry_count integer not null default 0,
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists recipient_email text,
  add column if not exists message_template_key text,
  add column if not exists failed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists failure_reason text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists sent_by uuid references public.profiles(id) on delete set null;
alter table public.reminders drop constraint if exists reminders_vaccine_record_id_fkey;
alter table public.reminders add constraint reminders_vaccine_record_id_fkey foreign key(vaccine_record_id) references public.vaccination_records(id) on delete restrict;

update public.reminders r set
  reminder_type = coalesce(reminder_type, 'custom'),
  recipient_name = coalesce(recipient_name, o.full_name),
  recipient_phone = coalesce(recipient_phone, o.phone),
  recipient_email = coalesce(recipient_email, o.email)
from public.owners o where o.id = r.owner_id;
update public.reminders set sent_at=coalesce(sent_at,updated_at) where status='sent';
update public.reminders set failed_at=coalesce(failed_at,updated_at),failure_reason=coalesce(nullif(trim(failure_reason),''),'Önceki kayıttan aktarıldı') where status='failed';
update public.reminders set cancelled_at=coalesce(cancelled_at,updated_at) where status='cancelled';

alter table public.reminders
  drop constraint if exists reminders_type_check,
  drop constraint if exists reminders_channel_check,
  drop constraint if exists reminders_retry_check,
  drop constraint if exists reminders_sent_check,
  drop constraint if exists reminders_failed_check,
  drop constraint if exists reminders_cancelled_check;

alter table public.reminders
  alter column reminder_type set not null,
  alter column recipient_name set not null,
  alter column rendered_message drop not null,
  add constraint reminders_type_check check (reminder_type in ('appointment_upcoming','appointment_same_day','vaccine_due','vaccine_overdue','parasite_due','parasite_overdue','follow_up_due','custom')),
  add constraint reminders_channel_check check (channel in ('whatsapp','sms','email','internal')),
  add constraint reminders_retry_check check (retry_count >= 0),
  add constraint reminders_sent_check check (status <> 'sent' or sent_at is not null),
  add constraint reminders_failed_check check (status <> 'failed' or (failed_at is not null and length(trim(failure_reason)) > 0)),
  add constraint reminders_cancelled_check check (status <> 'cancelled' or cancelled_at is not null);

create index if not exists reminders_status_idx on public.reminders(status);
create index if not exists reminders_scheduled_for_idx on public.reminders(scheduled_for);
create index if not exists reminders_type_idx on public.reminders(reminder_type);
create index if not exists reminders_channel_idx on public.reminders(channel);
create index if not exists reminders_appointment_idx on public.reminders(appointment_id);
create index if not exists reminders_vaccination_idx on public.reminders(vaccine_record_id);
create index if not exists reminders_parasite_idx on public.reminders(parasite_record_id);
create unique index if not exists reminders_active_appointment_unique on public.reminders(reminder_type,appointment_id) where appointment_id is not null and status not in ('sent','failed','cancelled');
create unique index if not exists reminders_active_vaccine_unique on public.reminders(reminder_type,vaccine_record_id) where vaccine_record_id is not null and status not in ('sent','failed','cancelled');
create unique index if not exists reminders_active_parasite_unique on public.reminders(reminder_type,parasite_record_id) where parasite_record_id is not null and status not in ('sent','failed','cancelled');
create unique index if not exists reminders_active_examination_unique on public.reminders(reminder_type,examination_id) where examination_id is not null and status not in ('sent','failed','cancelled');

create table public.reminder_templates (
  id uuid primary key default gen_random_uuid(), key text unique not null,
  name text not null, channel text not null check (channel in ('whatsapp','sms','email','internal')),
  language text not null check (language in ('tr','en')), subject text, body text not null,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger reminder_templates_set_updated_at before update on public.reminder_templates for each row execute function public.set_updated_at();

insert into public.reminder_templates(key,name,channel,language,body) values
('appointment_upcoming_tr','Yaklaşan Randevu','whatsapp','tr','Sayın {{owner_name}}, {{pet_name}} için {{date}} {{time}} tarihindeki randevunuzu hatırlatırız. {{clinic_name}} {{clinic_phone}}'),
('appointment_same_day_tr','Bugünkü Randevu','whatsapp','tr','Sayın {{owner_name}}, {{pet_name}} için bugünkü {{time}} randevunuzu hatırlatırız. {{clinic_name}}'),
('vaccine_due_tr','Aşı Zamanı','whatsapp','tr','Sayın {{owner_name}}, {{pet_name}} için aşı zamanı {{date}} tarihinde yaklaşmaktadır. Veteriner hekim değerlendirmesi için kliniğimizle iletişime geçebilirsiniz.'),
('vaccine_overdue_tr','Geciken Aşı','whatsapp','tr','Sayın {{owner_name}}, {{pet_name}} için planlanan aşı tarihi geçmiştir. Uygun planlama için veteriner hekiminizle görüşünüz.'),
('parasite_due_tr','Parazit Uygulaması','whatsapp','tr','Sayın {{owner_name}}, {{pet_name}} için parazit koruma tarihi {{date}} tarihinde yaklaşmaktadır.'),
('parasite_overdue_tr','Geciken Parazit Uygulaması','whatsapp','tr','Sayın {{owner_name}}, {{pet_name}} için planlanan parazit koruma tarihi geçmiştir. Kliniğimizle iletişime geçebilirsiniz.'),
('follow_up_due_tr','Kontrol Ziyareti','whatsapp','tr','Sayın {{owner_name}}, {{pet_name}} için kontrol ziyareti {{date}} tarihinde planlanmıştır. {{clinic_name}}')
on conflict(key) do nothing;

alter table public.reminder_templates enable row level security;
drop policy if exists "Clinical staff can insert reminders" on public.reminders;
drop policy if exists "Clinical staff can update reminders" on public.reminders;
create policy "Veterinarians create reminders" on public.reminders for insert to authenticated with check (public.is_clinical_staff() and created_by = auth.uid());
create policy "Veterinarians update active reminders" on public.reminders for update to authenticated using (public.is_clinical_staff() and status not in ('sent','cancelled')) with check (public.is_clinical_staff());
create policy "Staff read reminder templates" on public.reminder_templates for select to authenticated using (public.is_staff());
create policy "Clinical staff update reminder templates" on public.reminder_templates for update to authenticated using (public.is_clinical_staff()) with check (public.is_clinical_staff());
create policy "Clinical staff create reminder templates" on public.reminder_templates for insert to authenticated with check (public.is_clinical_staff());
create policy "Admins delete reminder templates" on public.reminder_templates for delete to authenticated using (public.is_admin());
revoke all on public.reminder_templates from anon;
grant select, insert, update on public.reminder_templates to authenticated;
grant delete on public.reminder_templates to authenticated;
grant usage on type public.reminder_status to authenticated;

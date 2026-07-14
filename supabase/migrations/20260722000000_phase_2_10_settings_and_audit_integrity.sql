-- Phase 2.10: structured clinic configuration and tamper-resistant audit history.
create table public.clinic_settings (
  id boolean primary key default true check (id),
  clinic_name_tr text not null default 'MeteVet' check (char_length(clinic_name_tr) between 2 and 120),
  clinic_name_en text check (clinic_name_en is null or char_length(clinic_name_en) <= 120),
  authorized_veterinarian text check (authorized_veterinarian is null or char_length(authorized_veterinarian) <= 120),
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  whatsapp text check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  public_email text check (public_email is null or public_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  address_tr text check (address_tr is null or char_length(address_tr) <= 500),
  address_en text check (address_en is null or char_length(address_en) <= 500),
  map_url text check (map_url is null or (char_length(map_url) <= 500 and map_url ~ '^https://')),
  website_url text check (website_url is null or (char_length(website_url) <= 500 and website_url ~ '^https://')),
  registration_text text check (registration_text is null or char_length(registration_text) <= 240),
  appointment_default_duration smallint not null default 30 check (appointment_default_duration between 5 and 480),
  appointment_min_duration smallint not null default 15 check (appointment_min_duration between 5 and appointment_default_duration),
  appointment_max_duration smallint not null default 120 check (appointment_max_duration between appointment_default_duration and 480),
  appointment_buffer smallint not null default 0 check (appointment_buffer between 0 and 120),
  appointment_default_status public.appointment_status not null default 'pending',
  allow_past_appointments boolean not null default false,
  conflict_policy text not null default 'reject' check (conflict_policy in ('reject')),
  reminder_days_before smallint[] not null default '{1}' check (cardinality(reminder_days_before) between 1 and 10),
  reminder_send_hour time not null default '09:00',
  reminder_max_retry smallint not null default 3 check (reminder_max_retry between 0 and 10),
  whatsapp_enabled boolean not null default false,
  email_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  pdf_heading text check (pdf_heading is null or char_length(pdf_heading) <= 160),
  logo_media_path text check (logo_media_path is null or (char_length(logo_media_path) <= 300 and logo_media_path !~ '://')),
  pdf_footer text check (pdf_footer is null or char_length(pdf_footer) <= 500),
  signature_label text check (signature_label is null or char_length(signature_label) <= 120),
  default_locale text not null default 'tr' check (default_locale in ('tr','en')),
  timezone text not null default 'Europe/Istanbul' check (timezone = 'Europe/Istanbul'),
  exclude_internal_notes boolean not null default true check (exclude_internal_notes),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);

create table public.clinic_business_hours (
  weekday smallint primary key check (weekday between 1 and 7), is_open boolean not null default false,
  opens_at time, closes_at time, break_starts_at time, break_ends_at time,
  check ((not is_open and opens_at is null and closes_at is null and break_starts_at is null and break_ends_at is null) or
    (is_open and opens_at < closes_at and ((break_starts_at is null and break_ends_at is null) or
      (break_starts_at is not null and break_ends_at is not null and opens_at < break_starts_at and break_starts_at < break_ends_at and break_ends_at < closes_at))))
);
insert into public.clinic_settings(id) values(true);
insert into public.clinic_business_hours(weekday,is_open,opens_at,closes_at)
select d, d between 1 and 6, case when d between 1 and 6 then '09:00'::time end, case when d between 1 and 6 then '18:00'::time end from generate_series(1,7) d;

alter table public.clinic_settings enable row level security;
alter table public.clinic_business_hours enable row level security;
create policy "Admins read clinic settings" on public.clinic_settings for select using (public.is_admin());
create policy "Admins update clinic settings" on public.clinic_settings for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins read business hours" on public.clinic_business_hours for select using (public.is_admin());
create policy "Admins update business hours" on public.clinic_business_hours for update using (public.is_admin()) with check (public.is_admin());
grant select,update on public.clinic_settings,public.clinic_business_hours to authenticated;

create or replace function public.protect_audit_log() returns trigger language plpgsql security definer set search_path = '' as $$
declare r public.user_role; raw text;
begin
  if tg_op <> 'INSERT' then raise exception 'audit history is append-only' using errcode='42501'; end if;
  select role into r from public.profiles where id=auth.uid() and status='active';
  if r is null then raise exception 'active personnel required' using errcode='42501'; end if;
  new.actor_user_id := auth.uid(); new.created_at := now();
  if new.action !~ '^[a-z][a-z0-9_]{2,79}$' or new.entity_type !~ '^[a-z][a-z0-9_]{1,79}$' then raise exception 'invalid audit event'; end if;
  if r <> 'admin' and (new.action ~ '^(personnel_|settings_)' or new.action ~ '_(deleted|archived|restored)$') then raise exception 'privileged audit event denied' using errcode='42501'; end if;
  if r = 'staff' and new.action !~ '^(document_downloaded|password_changed|personnel_profile_updated)$' then raise exception 'audit event denied' using errcode='42501'; end if;
  raw := coalesce(new.metadata,'{}'::jsonb)::text;
  if length(raw)>8000 or raw ~* '"[^" ]*(password|token|secret|service.?role|signed.?url|clinical.?note|diagnosis|treatment|rendered.?message|phone|email)[^" ]*"\s*:' then raise exception 'unsafe audit metadata'; end if;
  return new;
end $$;
drop trigger if exists audit_log_integrity on public.audit_logs;
create trigger audit_log_integrity before insert or update or delete on public.audit_logs for each row execute function public.protect_audit_log();
revoke update,delete on public.audit_logs from authenticated,anon;
drop policy if exists "Staff can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs" on public.audit_logs for select using (public.is_admin());

create or replace function public.audit_clinic_settings() returns trigger language plpgsql security definer set search_path='' as $$
declare changed text[];
begin
  new.updated_at:=now(); new.updated_by:=auth.uid();
  select array_agg(k order by k) into changed from jsonb_object_keys(to_jsonb(new)-to_jsonb(old)) k where to_jsonb(new)->k is distinct from to_jsonb(old)->k and k not in ('updated_at','updated_by');
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'settings_updated','clinic_settings',null,jsonb_build_object('fields',coalesce(changed,'{}'::text[])));
  return new;
end $$;
create trigger clinic_settings_audit before update on public.clinic_settings for each row execute function public.audit_clinic_settings();

create or replace function public.audit_business_hours() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'settings_business_hours_updated','clinic_business_hours',null,jsonb_build_object('weekday',new.weekday,'fields',array(select k from jsonb_object_keys(to_jsonb(new)-'weekday') k where to_jsonb(new)->k is distinct from to_jsonb(old)->k)));
 return new;
end $$;
create trigger clinic_business_hours_audit before update on public.clinic_business_hours for each row execute function public.audit_business_hours();

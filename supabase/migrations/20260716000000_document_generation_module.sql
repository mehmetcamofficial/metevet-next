create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('examination_summary','vaccination_card','parasite_summary','preventive_care_history','appointment_summary','pet_health_summary','follow_up_instructions','custom_clinical_note')),
  owner_id uuid references public.owners(id) on delete restrict,
  pet_id uuid references public.pets(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete restrict,
  examination_id uuid references public.examinations(id) on delete restrict,
  generated_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  language text not null default 'tr' check (language in ('tr','en')),
  status text not null default 'generated' check (status in ('generated','archived','failed')),
  file_name text not null check (file_name = regexp_replace(file_name, '[^a-zA-Z0-9._-]', '', 'g')),
  storage_path text,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generated_documents_archive_state check ((status='archived') = (archived_at is not null))
);
create index generated_documents_type_idx on public.generated_documents(document_type);
create index generated_documents_owner_idx on public.generated_documents(owner_id);
create index generated_documents_pet_idx on public.generated_documents(pet_id);
create index generated_documents_appointment_idx on public.generated_documents(appointment_id);
create index generated_documents_examination_idx on public.generated_documents(examination_id);
create index generated_documents_generated_by_idx on public.generated_documents(generated_by);
create index generated_documents_generated_at_idx on public.generated_documents(generated_at desc);
create index generated_documents_archived_at_idx on public.generated_documents(archived_at);
create trigger generated_documents_set_updated_at before update on public.generated_documents for each row execute function public.set_updated_at();
alter table public.generated_documents enable row level security;
create policy "Staff read generated documents" on public.generated_documents for select to authenticated using (public.is_staff());
create policy "Authorized staff generate documents" on public.generated_documents for insert to authenticated with check (generated_by=auth.uid() and (public.is_clinical_staff() or document_type='appointment_summary'));
create policy "Clinical staff archive own documents" on public.generated_documents for update to authenticated using (public.is_admin() or (public.is_clinical_staff() and generated_by=auth.uid())) with check (public.is_admin() or (public.is_clinical_staff() and generated_by=auth.uid()));
create policy "Admins delete generated documents" on public.generated_documents for delete to authenticated using (public.is_admin());
revoke all on public.generated_documents from anon;
grant select,insert,update,delete on public.generated_documents to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('clinical-documents','clinical-documents',false,10485760,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Staff read clinical documents" on storage.objects;
drop policy if exists "Clinical staff upload clinical documents" on storage.objects;
drop policy if exists "Admins delete clinical documents" on storage.objects;
create policy "Staff read clinical documents" on storage.objects for select to authenticated using (bucket_id='clinical-documents' and public.is_staff());
create policy "Clinical staff upload clinical documents" on storage.objects for insert to authenticated with check (bucket_id='clinical-documents' and public.is_clinical_staff());
create policy "Admins delete clinical documents" on storage.objects for delete to authenticated using (bucket_id='clinical-documents' and public.is_admin());

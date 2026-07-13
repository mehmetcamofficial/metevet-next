create table public.examinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete restrict,
  owner_id uuid not null references public.owners (id) on delete restrict,
  appointment_id uuid references public.appointments (id) on delete set null,
  veterinarian_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'finalized', 'archived')),
  visit_type text not null check (visit_type in ('general_exam', 'follow_up', 'vaccination', 'emergency', 'surgery_control', 'dental', 'other')),
  chief_complaint text, history text, examination_findings text, assessment text,
  diagnosis text, procedures text, treatment_plan text, medications_notes text,
  recommendations text, follow_up_at timestamptz,
  weight_kg numeric check (weight_kg is null or weight_kg > 0),
  temperature_c numeric check (temperature_c is null or temperature_c between 30 and 45),
  heart_rate integer check (heart_rate is null or heart_rate > 0),
  respiratory_rate integer check (respiratory_rate is null or respiratory_rate > 0),
  internal_notes text, finalized_at timestamptz, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index examinations_pet_id_idx on public.examinations (pet_id);
create index examinations_owner_id_idx on public.examinations (owner_id);
create index examinations_appointment_id_idx on public.examinations (appointment_id);
create index examinations_veterinarian_id_idx on public.examinations (veterinarian_id);
create index examinations_status_idx on public.examinations (status);
create index examinations_created_at_idx on public.examinations (created_at desc);
create index examinations_follow_up_at_idx on public.examinations (follow_up_at) where follow_up_at is not null;
create trigger examinations_set_updated_at before update on public.examinations for each row execute function public.set_updated_at();

create function public.protect_examination_record()
returns trigger language plpgsql set search_path = '' as $$
declare expected_owner uuid;
declare veterinarian_role public.user_role;
begin
  select owner_id into expected_owner from public.pets where id = new.pet_id;
  if expected_owner is null or new.owner_id <> expected_owner then raise exception 'Owner and pet do not match.' using errcode = '23514'; end if;
  select role into veterinarian_role from public.profiles where id = new.veterinarian_id;
  if veterinarian_role is null or veterinarian_role not in ('admin', 'veterinarian') then raise exception 'Invalid veterinarian.' using errcode = '23514'; end if;
  if tg_op = 'INSERT' and new.status = 'archived' and (select auth.role()) = 'authenticated' and not (select public.is_admin()) then raise exception 'Only administrators can archive records.' using errcode = '42501'; end if;
  if new.status = 'finalized' and new.finalized_at is null then new.finalized_at = now(); end if;
  if tg_op = 'UPDATE' and (select auth.role()) = 'authenticated' then
    if old.status = 'finalized' and new.status = 'finalized' then raise exception 'Finalized records are read-only.' using errcode = '42501'; end if;
    if (old.status = 'finalized' and new.status <> 'finalized') and not (select public.is_admin()) then raise exception 'Only administrators can reopen records.' using errcode = '42501'; end if;
    if (new.status = 'archived' or old.status = 'archived') and not (select public.is_admin()) then raise exception 'Only administrators can manage archives.' using errcode = '42501'; end if;
  end if;
  if new.status <> 'finalized' then new.finalized_at = null; end if;
  new.archived_at = case when new.status = 'archived' then coalesce(new.archived_at, now()) else null end;
  return new;
end; $$;
create trigger examinations_protect_record before insert or update on public.examinations for each row execute function public.protect_examination_record();

alter table public.examinations enable row level security;
create policy "Staff can read examinations" on public.examinations for select to authenticated using ((select public.is_staff()));
create policy "Clinical staff can insert examinations" on public.examinations for insert to authenticated with check ((select public.is_clinical_staff()));
create policy "Clinical staff can update examinations" on public.examinations for update to authenticated using ((select public.is_clinical_staff())) with check ((select public.is_clinical_staff()));
create policy "Admins can delete examinations" on public.examinations for delete to authenticated using ((select public.is_admin()));
revoke all on public.examinations from anon;
grant select, insert, update, delete on public.examinations to authenticated;

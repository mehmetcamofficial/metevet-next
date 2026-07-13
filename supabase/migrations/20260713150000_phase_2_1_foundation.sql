create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'veterinarian', 'staff');
create type public.appointment_status as enum (
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
);
create type public.reminder_status as enum ('pending', 'sent', 'cancelled', 'failed');
create type public.pet_sex as enum ('female', 'male', 'unknown');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  species text not null check (length(trim(species)) > 0),
  breed text,
  birth_date date,
  sex public.pet_sex not null default 'unknown',
  microchip_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete restrict,
  pet_id uuid not null references public.pets (id) on delete restrict,
  assigned_user_id uuid references public.profiles (id) on delete set null,
  status public.appointment_status not null default 'pending',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  notes text,
  source text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_valid_time_range check (ends_at > starts_at)
);

create table public.vaccine_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete restrict,
  administered_by uuid references public.profiles (id) on delete set null,
  vaccine_name text not null check (length(trim(vaccine_name)) > 0),
  administered_at timestamptz not null,
  next_due_at timestamptz,
  batch_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete restrict,
  pet_id uuid references public.pets (id) on delete restrict,
  appointment_id uuid references public.appointments (id) on delete restrict,
  vaccine_record_id uuid references public.vaccine_records (id) on delete restrict,
  status public.reminder_status not null default 'pending',
  remind_at timestamptz not null,
  channel text not null check (length(trim(channel)) > 0),
  message text not null check (length(trim(message)) > 0),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null check (length(trim(action)) > 0),
  entity_type text not null check (length(trim(entity_type)) > 0),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index owners_phone_idx on public.owners (phone);
create index pets_owner_id_idx on public.pets (owner_id);
create index appointments_owner_id_idx on public.appointments (owner_id);
create index appointments_pet_id_idx on public.appointments (pet_id);
create index appointments_starts_at_idx on public.appointments (starts_at);
create index appointments_status_idx on public.appointments (status);
create index vaccine_records_pet_id_idx on public.vaccine_records (pet_id);
create index vaccine_records_next_due_at_idx on public.vaccine_records (next_due_at);
create index reminders_owner_id_idx on public.reminders (owner_id);
create index reminders_pet_id_idx on public.reminders (pet_id);
create index reminders_remind_at_status_idx on public.reminders (remind_at, status);
create index audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger owners_set_updated_at before update on public.owners
for each row execute function public.set_updated_at();
create trigger pets_set_updated_at before update on public.pets
for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments
for each row execute function public.set_updated_at();
create trigger vaccine_records_set_updated_at before update on public.vaccine_records
for each row execute function public.set_updated_at();
create trigger reminders_set_updated_at before update on public.reminders
for each row execute function public.set_updated_at();

create function public.prevent_self_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() = old.id and new.role is distinct from old.role then
    raise exception 'A user cannot change their own role.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_change
before update of role on public.profiles
for each row execute function public.prevent_self_role_change();

create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() in ('admin', 'veterinarian', 'staff'), false);
$$;

create function public.is_clinical_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() in ('admin', 'veterinarian'), false);
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_clinical_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_clinical_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.owners enable row level security;
alter table public.pets enable row level security;
alter table public.appointments enable row level security;
alter table public.vaccine_records enable row level security;
alter table public.reminders enable row level security;
alter table public.audit_logs enable row level security;

create policy "Staff can read profiles" on public.profiles
for select to authenticated using ((select public.is_staff()));
create policy "Admins can insert profiles" on public.profiles
for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update profiles" on public.profiles
for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete profiles" on public.profiles
for delete to authenticated using ((select public.is_admin()));

create policy "Staff can read owners" on public.owners
for select to authenticated using ((select public.is_staff()));
create policy "Clinical staff can insert owners" on public.owners
for insert to authenticated with check ((select public.is_clinical_staff()));
create policy "Clinical staff can update owners" on public.owners
for update to authenticated
using ((select public.is_clinical_staff())) with check ((select public.is_clinical_staff()));
create policy "Admins can delete owners" on public.owners
for delete to authenticated using ((select public.is_admin()));

create policy "Staff can read pets" on public.pets
for select to authenticated using ((select public.is_staff()));
create policy "Clinical staff can insert pets" on public.pets
for insert to authenticated with check ((select public.is_clinical_staff()));
create policy "Clinical staff can update pets" on public.pets
for update to authenticated
using ((select public.is_clinical_staff())) with check ((select public.is_clinical_staff()));
create policy "Admins can delete pets" on public.pets
for delete to authenticated using ((select public.is_admin()));

create policy "Staff can read appointments" on public.appointments
for select to authenticated using ((select public.is_staff()));
create policy "Clinical staff can insert appointments" on public.appointments
for insert to authenticated with check ((select public.is_clinical_staff()));
create policy "Clinical staff can update appointments" on public.appointments
for update to authenticated
using ((select public.is_clinical_staff())) with check ((select public.is_clinical_staff()));
create policy "Admins can delete appointments" on public.appointments
for delete to authenticated using ((select public.is_admin()));

create policy "Staff can read vaccine records" on public.vaccine_records
for select to authenticated using ((select public.is_staff()));
create policy "Clinical staff can insert vaccine records" on public.vaccine_records
for insert to authenticated with check ((select public.is_clinical_staff()));
create policy "Clinical staff can update vaccine records" on public.vaccine_records
for update to authenticated
using ((select public.is_clinical_staff())) with check ((select public.is_clinical_staff()));
create policy "Admins can delete vaccine records" on public.vaccine_records
for delete to authenticated using ((select public.is_admin()));

create policy "Staff can read reminders" on public.reminders
for select to authenticated using ((select public.is_staff()));
create policy "Clinical staff can insert reminders" on public.reminders
for insert to authenticated with check ((select public.is_clinical_staff()));
create policy "Clinical staff can update reminders" on public.reminders
for update to authenticated
using ((select public.is_clinical_staff())) with check ((select public.is_clinical_staff()));
create policy "Admins can delete reminders" on public.reminders
for delete to authenticated using ((select public.is_admin()));

create policy "Staff can read audit logs" on public.audit_logs
for select to authenticated using ((select public.is_staff()));
create policy "Staff can append their own audit logs" on public.audit_logs
for insert to authenticated
with check ((select public.is_staff()) and actor_user_id = (select auth.uid()));

revoke all on public.profiles, public.owners, public.pets, public.appointments,
  public.vaccine_records, public.reminders, public.audit_logs from anon;
grant select, insert, update, delete on public.profiles, public.owners, public.pets,
  public.appointments, public.vaccine_records, public.reminders to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant usage on type public.user_role, public.appointment_status,
  public.reminder_status, public.pet_sex to authenticated;

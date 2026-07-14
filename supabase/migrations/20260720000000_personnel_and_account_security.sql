begin;

create type public.personnel_status as enum ('active','inactive');

alter table public.profiles
  add column status public.personnel_status not null default 'active';

create table public.personnel_private_profiles(
  id uuid primary key references public.profiles(id) on delete cascade,
  email text unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.personnel_private_profiles(id,email)
select p.id,lower(u.email) from public.profiles p join auth.users u on u.id=p.id
on conflict(id) do nothing;

create index profiles_role_status_idx on public.profiles(role,status);
create trigger personnel_private_profiles_set_updated_at before update on public.personnel_private_profiles
for each row execute function public.set_updated_at();
alter table public.personnel_private_profiles enable row level security;
create policy "Personnel read own private profile" on public.personnel_private_profiles for select to authenticated using(id=(select auth.uid()));
create policy "Admins read private profiles" on public.personnel_private_profiles for select to authenticated using((select public.is_admin()));
create policy "Personnel update own private profile" on public.personnel_private_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy "Admins manage private profiles" on public.personnel_private_profiles for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

create function public.protect_private_login_email()
returns trigger language plpgsql set search_path='' as $$
begin
  if (select auth.role())='authenticated' and (select auth.uid())=old.id and new.email is distinct from old.email then
    raise exception 'A user cannot change their own login email.' using errcode='42501';
  end if;
  return new;
end; $$;
create trigger personnel_private_profiles_protect_email before update of email on public.personnel_private_profiles
for each row execute function public.protect_private_login_email();

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path='' as $$
  select role from public.profiles where id=(select auth.uid()) and status='active';
$$;

create or replace function public.protect_personnel_privileges()
returns trigger language plpgsql set search_path='' as $$
begin
  if (select auth.role())='authenticated' and (select auth.uid())=old.id
    and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'A user cannot change their own role or status.' using errcode='42501';
  end if;
  if old.role='admin' and old.status='active'
    and (new.role<>'admin' or new.status<>'active')
    and not exists(select 1 from public.profiles where id<>old.id and role='admin' and status='active') then
    raise exception 'The final active administrator cannot be removed.' using errcode='23514';
  end if;
  return new;
end; $$;

drop trigger if exists profiles_prevent_self_role_change on public.profiles;
drop trigger if exists profiles_protect_personnel_privileges on public.profiles;
create trigger profiles_protect_personnel_privileges
before update of role,status on public.profiles
for each row execute function public.protect_personnel_privileges();

drop policy if exists "Personnel update own profile" on public.profiles;
create policy "Personnel update own profile" on public.profiles
for update to authenticated using (id=(select auth.uid()) and status='active')
with check (id=(select auth.uid()) and status='active');

create or replace function public.require_active_clinician()
returns trigger language plpgsql set search_path='' as $$
declare target_id uuid;
begin
  if tg_table_name='appointments' then target_id=new.assigned_user_id; else target_id=new.veterinarian_id; end if;
  if target_id is not null and not exists(select 1 from public.profiles where id=target_id and status='active'
    and (tg_table_name='appointments' or role='veterinarian')) then
    raise exception 'Assigned personnel is inactive or invalid.' using errcode='23514';
  end if;
  return new;
end; $$;

drop trigger if exists appointments_require_active_assignee on public.appointments;
create trigger appointments_require_active_assignee before insert or update of assigned_user_id on public.appointments
for each row execute function public.require_active_clinician();
drop trigger if exists examinations_require_active_clinician on public.examinations;
create trigger examinations_require_active_clinician before insert or update of veterinarian_id on public.examinations
for each row execute function public.require_active_clinician();
drop trigger if exists vaccination_records_require_active_clinician on public.vaccination_records;
create trigger vaccination_records_require_active_clinician before insert or update of veterinarian_id on public.vaccination_records
for each row execute function public.require_active_clinician();
drop trigger if exists parasite_records_require_active_clinician on public.parasite_records;
create trigger parasite_records_require_active_clinician before insert or update of veterinarian_id on public.parasite_records
for each row execute function public.require_active_clinician();

revoke all on function public.protect_personnel_privileges() from public;
revoke all on function public.require_active_clinician() from public;
revoke all on function public.protect_private_login_email() from public;
grant usage on type public.personnel_status to authenticated;
revoke all on public.personnel_private_profiles from anon;
grant select,insert,update,delete on public.personnel_private_profiles to authenticated;

commit;

begin;

create table if not exists public.personnel_private_profiles(
  id uuid primary key references public.profiles(id) on delete cascade,
  email text unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='email') then
    execute 'insert into public.personnel_private_profiles(id,email,phone)
      select id,lower(email),phone from public.profiles
      on conflict(id) do update set email=coalesce(excluded.email,personnel_private_profiles.email),phone=coalesce(excluded.phone,personnel_private_profiles.phone)';
  else
    insert into public.personnel_private_profiles(id,email)
    select p.id,lower(u.email) from public.profiles p join auth.users u on u.id=p.id
    on conflict(id) do nothing;
  end if;
end $$;

alter table public.profiles drop column if exists email;
alter table public.profiles drop column if exists phone;

drop trigger if exists personnel_private_profiles_set_updated_at on public.personnel_private_profiles;
create trigger personnel_private_profiles_set_updated_at before update on public.personnel_private_profiles
for each row execute function public.set_updated_at();
alter table public.personnel_private_profiles enable row level security;
drop policy if exists "Personnel read own private profile" on public.personnel_private_profiles;
drop policy if exists "Admins read private profiles" on public.personnel_private_profiles;
drop policy if exists "Personnel update own private profile" on public.personnel_private_profiles;
drop policy if exists "Admins manage private profiles" on public.personnel_private_profiles;
create policy "Personnel read own private profile" on public.personnel_private_profiles for select to authenticated using(id=(select auth.uid()));
create policy "Admins read private profiles" on public.personnel_private_profiles for select to authenticated using((select public.is_admin()));
create policy "Personnel update own private profile" on public.personnel_private_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy "Admins manage private profiles" on public.personnel_private_profiles for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

create or replace function public.protect_private_login_email()
returns trigger language plpgsql set search_path='' as $$
begin
  if (select auth.role())='authenticated' and (select auth.uid())=old.id and new.email is distinct from old.email then
    raise exception 'A user cannot change their own login email.' using errcode='42501';
  end if;
  return new;
end; $$;
drop trigger if exists personnel_private_profiles_protect_email on public.personnel_private_profiles;
create trigger personnel_private_profiles_protect_email before update of email on public.personnel_private_profiles
for each row execute function public.protect_private_login_email();

revoke all on public.personnel_private_profiles from anon;
grant select,insert,update,delete on public.personnel_private_profiles to authenticated;
revoke all on function public.protect_private_login_email() from public;

commit;

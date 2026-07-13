create extension if not exists btree_gist;

alter table public.appointments rename column notes to internal_notes;
alter table public.appointments add column service_key text;
update public.appointments set service_key = 'general_examination' where service_key is null;
alter table public.appointments alter column service_key set not null;
update public.appointments set source = 'admin' where source = 'staff';
alter table public.appointments alter column source set default 'admin';
alter table public.appointments add constraint appointments_source_check
  check (source in ('website', 'plandok', 'whatsapp', 'phone', 'walk_in', 'admin'));

create index appointments_ends_at_idx on public.appointments (ends_at);
create index appointments_assigned_user_id_idx on public.appointments (assigned_user_id);
create index appointments_source_idx on public.appointments (source);
create index appointments_service_key_idx on public.appointments (service_key);

alter table public.appointments add constraint appointments_staff_no_overlap
  exclude using gist (
    assigned_user_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (assigned_user_id is not null and status <> 'cancelled');

create function public.protect_appointment_workflow()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) <> 'authenticated' then return new; end if;
  if new.status = 'cancelled' and old.status <> 'cancelled'
    and not (select public.is_admin()) then
    raise exception 'Only administrators can cancel appointments.' using errcode = '42501';
  end if;
  if new.status <> old.status and not (select public.is_admin()) and not (
    (old.status = 'pending' and new.status = 'confirmed') or
    (old.status = 'confirmed' and new.status in ('completed', 'no_show'))
  ) then
    raise exception 'Invalid appointment status transition.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger appointments_protect_workflow
before update of status on public.appointments
for each row execute function public.protect_appointment_workflow();

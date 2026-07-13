alter table public.owners add column archived_at timestamptz;
alter table public.pets add column archived_at timestamptz;

create index owners_active_created_at_idx
  on public.owners (created_at desc) where archived_at is null;
create index owners_active_full_name_idx
  on public.owners (lower(full_name)) where archived_at is null;
create index owners_normalized_phone_idx
  on public.owners ((regexp_replace(phone, '[^0-9]', '', 'g')));
create index pets_active_created_at_idx
  on public.pets (created_at desc) where archived_at is null;
create index pets_active_name_idx
  on public.pets (lower(name)) where archived_at is null;
create index pets_active_species_idx
  on public.pets (species) where archived_at is null;
create unique index pets_microchip_number_unique_idx
  on public.pets (microchip_number) where microchip_number is not null;

comment on column public.owners.archived_at is
  'Soft-delete timestamp. Null means the owner is active.';
comment on column public.pets.archived_at is
  'Soft-delete timestamp. Null means the pet is active.';

create function public.restrict_archive_changes_to_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.archived_at is distinct from old.archived_at
    and (select auth.role()) = 'authenticated'
    and not (select public.is_admin()) then
    raise exception 'Only administrators can change archive status.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger owners_restrict_archive_changes
before update of archived_at on public.owners
for each row execute function public.restrict_archive_changes_to_admin();

create trigger pets_restrict_archive_changes
before update of archived_at on public.pets
for each row execute function public.restrict_archive_changes_to_admin();

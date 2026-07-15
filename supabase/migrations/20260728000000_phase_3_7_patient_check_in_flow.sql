-- Phase 3.7 — Patient Check-in and Clinic Flow
-- Forward-only: adds operational flow timestamps + flow_state.
-- Does NOT alter appointment_status enum (business lifecycle stays separate).

alter table public.appointments
  add column if not exists checked_in_at timestamptz,
  add column if not exists waiting_started_at timestamptz,
  add column if not exists called_at timestamptz,
  add column if not exists examination_started_at timestamptz,
  add column if not exists flow_completed_at timestamptz,
  add column if not exists flow_state text not null default 'scheduled';

-- Backfill any nulls if column existed without default (idempotent safety)
update public.appointments
set flow_state = 'scheduled'
where flow_state is null;

alter table public.appointments
  drop constraint if exists appointments_flow_state_check;

alter table public.appointments
  add constraint appointments_flow_state_check
  check (flow_state in (
    'scheduled',
    'checked_in',
    'waiting',
    'called',
    'in_examination',
    'completed'
  ));

comment on column public.appointments.flow_state is
  'In-clinic operational progress. Independent of appointment_status business lifecycle.';
comment on column public.appointments.checked_in_at is
  'When the patient arrived / checked in (timestamptz UTC).';
comment on column public.appointments.waiting_started_at is
  'When the patient entered the waiting room (timestamptz UTC).';
comment on column public.appointments.called_at is
  'When the veterinarian called the patient (timestamptz UTC).';
comment on column public.appointments.examination_started_at is
  'When the examination was started from clinic flow (timestamptz UTC).';
comment on column public.appointments.flow_completed_at is
  'When clinic operational flow completed (does not auto-finalize clinical records).';

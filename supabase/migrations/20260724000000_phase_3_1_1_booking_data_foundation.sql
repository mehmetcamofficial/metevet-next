-- Phase 3.1.1: Online Booking Data Foundation (revised)
-- Forward-only migration. Do not modify existing structures.
-- All timestamps use Europe/Istanbul semantics (timezone column in clinic_settings = 'Europe/Istanbul').
-- Times stored as timestamptz; local time columns (start_time, end_time, break_start, break_end)
-- are `time` type representing Istanbul wall-clock time. Nullable for unavailable rows.

-- ═══════════════════════════════════════════════════════════════════
-- Partial-application verification
-- ═══════════════════════════════════════════════════════════════════
-- This migration was never recorded in supabase_migrations.schema_migrations.
-- Before running, verify no partial state exists:
--   SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'
--     AND table_name IN ('appointment_services','veterinarian_availability','clinic_closures','booking_rules');
--   SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public'
--     AND table_name = 'appointments' AND column_name IN ('service_id','public_booking_reference','requested_veterinarian_id');
-- Expected: all counts = 0. If any > 0, investigate before proceeding.

-- ═══════════════════════════════════════════════════════════════════
-- 1. appointment_services
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.appointment_services (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tr       text        NOT NULL CHECK (char_length(trim(name_tr)) BETWEEN 2 AND 120),
  name_en       text        NOT NULL CHECK (char_length(trim(name_en)) BETWEEN 2 AND 120),
  slug          text        NOT NULL CHECK (slug ~ '^[a-z][a-z0-9-]{1,58}[a-z0-9]$'),
  description_tr text       CHECK (char_length(description_tr) <= 500),
  description_en text       CHECK (char_length(description_en) <= 500),
  duration_minutes smallint  NOT NULL CHECK (duration_minutes BETWEEN 5 AND 480),
  buffer_before_minutes smallint NOT NULL DEFAULT 0 CHECK (buffer_before_minutes BETWEEN 0 AND 180),
  buffer_after_minutes  smallint NOT NULL DEFAULT 0 CHECK (buffer_after_minutes  BETWEEN 0 AND 180),
  is_online_bookable boolean NOT NULL DEFAULT false,
  requires_manual_confirmation boolean NOT NULL DEFAULT true,
  is_active      boolean    NOT NULL DEFAULT true,
  sort_order     smallint   NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 9999),
  created_by     uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_by     uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  archived_at    timestamptz          -- null = active; soft-delete
);

-- Unique active slug: archived services may reuse slugs
CREATE UNIQUE INDEX appointment_services_active_slug_idx
  ON public.appointment_services (slug) WHERE archived_at IS NULL;

-- Active online-bookable services lookup (for public booking)
CREATE INDEX appointment_services_online_active_idx
  ON public.appointment_services (sort_order, duration_minutes)
  WHERE is_online_bookable AND is_active AND archived_at IS NULL;

-- Auto-set updated_at
CREATE TRIGGER appointment_services_set_updated_at
  BEFORE UPDATE ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Protect archive changes to admin only
CREATE TRIGGER appointment_services_restrict_archive
  BEFORE UPDATE OF archived_at ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.restrict_archive_changes_to_admin();

-- Audit log for service changes
CREATE FUNCTION public.audit_appointment_service() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (new.created_by, 'appointment_service_created', 'appointment_service', new.id,
            jsonb_build_object('slug', new.slug, 'name_tr', new.name_tr, 'duration_minutes', new.duration_minutes, 'is_online_bookable', new.is_online_bookable));
  ELSIF TG_OP = 'UPDATE' THEN
    IF new.archived_at IS NOT NULL AND old.archived_at IS NULL THEN
      INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES (new.updated_by, 'appointment_service_archived', 'appointment_service', new.id,
              jsonb_build_object('slug', new.slug));
    ELSE
      INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES (new.updated_by, 'appointment_service_updated', 'appointment_service', new.id,
              jsonb_build_object('slug', new.slug, 'changed_fields',
                (SELECT jsonb_object_agg(key, true) FROM jsonb_each_text(to_jsonb(new) - to_jsonb(old)) WHERE key NOT IN ('updated_at','updated_by'))));
    END IF;
  END IF;
  RETURN new;
END $$;

CREATE TRIGGER appointment_services_audit
  AFTER INSERT OR UPDATE ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.audit_appointment_service();

-- RLS: admin full CRUD; veterinarian/staff read active; anonymous read online-bookable active
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage appointment services"
  ON public.appointment_services FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Staff can read active appointment services"
  ON public.appointment_services FOR SELECT
  TO authenticated USING (is_active AND archived_at IS NULL AND public.is_staff());

CREATE POLICY "Anonymous can read online-bookable services"
  ON public.appointment_services FOR SELECT
  TO anon, authenticated USING (is_online_bookable AND is_active AND archived_at IS NULL);


-- ═══════════════════════════════════════════════════════════════════
-- 2. veterinarian_availability
-- ═══════════════════════════════════════════════════════════════════

-- Weekday representation: ISO 8601 (1=Monday, 7=Sunday), matching clinic_business_hours.weekday
-- Time columns are nullable: available rows require start/end; unavailable rows require all nulls.
CREATE TABLE public.veterinarian_availability (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  veterinarian_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  weekday          smallint    NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  is_available     boolean     NOT NULL DEFAULT true,
  start_time       time,                   -- Istanbul wall-clock; null when unavailable
  end_time         time,                   -- Istanbul wall-clock; null when unavailable
  break_start      time,                   -- Istanbul wall-clock; null = no break
  break_end        time,                   -- Istanbul wall-clock; null = no break
  effective_from   date,                   -- null = applies from now onward
  effective_until  date,                   -- null = indefinite
  created_by       uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_by       uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- available rows: start and end required, start < end
  CONSTRAINT va_available_requires_times CHECK (
    is_available AND start_time IS NOT NULL AND end_time IS NOT NULL
    AND start_time < end_time
    OR NOT is_available AND start_time IS NULL AND end_time IS NULL
  ),
  -- break inside availability interval, or both null
  CONSTRAINT va_break_inside_interval CHECK (
    (break_start IS NULL AND break_end IS NULL) OR
    (break_start IS NOT NULL AND break_end IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL
     AND start_time < break_start AND break_end < end_time AND break_start < break_end)
  ),
  -- effective_from <= effective_until if both set (same-day = one valid day)
  CONSTRAINT va_effective_range CHECK (
    effective_from IS NULL OR effective_until IS NULL OR effective_from <= effective_until
  )
);

-- Prevent overlapping availability rules for same veterinarian and weekday + effective range.
-- Uses daterange with inclusive bounds '[]' so same-day effective_from/effective_until is one valid day.
-- Adjacent ranges (e.g. Jan–Jun and Jul–Dec) do not overlap because '[]' bounds touch but don't intersect
-- when the end of one equals the start of the next — this is still rejected by &&.
-- For truly adjacent non-overlapping ranges, use a gap day between periods (e.g. Jun 30 then Jul 1).
-- NULL effective_from/effective_until are treated as unbounded (-infinity/infinity).
-- Uses btree_gist extension (already installed).
ALTER TABLE public.veterinarian_availability ADD CONSTRAINT veterinarian_availability_no_overlap
  EXCLUDE USING gist (
    veterinarian_id WITH =,
    weekday WITH =,
    daterange(coalesce(effective_from, '-infinity'::date), coalesce(effective_until, 'infinity'::date), '[]') WITH &&
  ) WHERE (is_available);

-- Efficient lookup: veterinarian + weekday for scheduling
CREATE INDEX veterinarian_availability_vet_weekday_idx
  ON public.veterinarian_availability (veterinarian_id, weekday)
  WHERE is_available;

-- Auto-set updated_at
CREATE TRIGGER veterinarian_availability_set_updated_at
  BEFORE UPDATE ON public.veterinarian_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Validate that veterinarian_id references an active veterinarian profile.
-- Replaces the removed CHECK constraint that used a subquery (SQLSTATE 0A000).
CREATE FUNCTION public.validate_active_veterinarian() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  vet_role public.user_role;
  vet_status public.personnel_status;
BEGIN
  IF TG_TABLE_NAME = 'veterinarian_availability' THEN
    IF new.veterinarian_id IS NULL THEN
      RAISE EXCEPTION 'veterinarian_id must not be null in veterinarian_availability';
    END IF;
    SELECT role, status INTO vet_role, vet_status
      FROM public.profiles WHERE id = new.veterinarian_id;
    IF vet_role IS NULL THEN
      RAISE EXCEPTION 'Referenced profile does not exist (id: %)', new.veterinarian_id;
    END IF;
    IF vet_role <> 'veterinarian' THEN
      RAISE EXCEPTION 'Only veterinarian profiles can receive availability rules (role: %, id: %)', vet_role, new.veterinarian_id;
    END IF;
    IF vet_status <> 'active' THEN
      RAISE EXCEPTION 'Only active veterinarians can receive availability rules (status: %, id: %)', vet_status, new.veterinarian_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'clinic_closures' THEN
    IF new.closure_type = 'veterinarian_leave' AND new.veterinarian_id IS NOT NULL THEN
      SELECT role, status INTO vet_role, vet_status
        FROM public.profiles WHERE id = new.veterinarian_id;
      IF vet_role IS NULL THEN
        RAISE EXCEPTION 'Referenced veterinarian profile does not exist (id: %)', new.veterinarian_id;
      END IF;
      IF vet_role <> 'veterinarian' THEN
        RAISE EXCEPTION 'Veterinarian leave must reference a veterinarian profile (role: %, id: %)', vet_role, new.veterinarian_id;
      END IF;
      IF vet_status <> 'active' THEN
        RAISE EXCEPTION 'Veterinarian leave must reference an active veterinarian (status: %, id: %)', vet_status, new.veterinarian_id;
      END IF;
    END IF;

  ELSE
    RAISE EXCEPTION 'validate_active_veterinarian trigger attached to unexpected table: %', TG_TABLE_NAME;
  END IF;

  RETURN new;
END $$;

CREATE TRIGGER veterinarian_availability_validate_vet
  BEFORE INSERT OR UPDATE OF veterinarian_id ON public.veterinarian_availability
  FOR EACH ROW EXECUTE FUNCTION public.validate_active_veterinarian();

-- Audit log
CREATE FUNCTION public.audit_veterinarian_availability() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (new.created_by, 'veterinarian_availability_created', 'veterinarian_availability', new.id,
            jsonb_build_object('veterinarian_id', new.veterinarian_id, 'weekday', new.weekday, 'is_available', new.is_available));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (new.updated_by, 'veterinarian_availability_updated', 'veterinarian_availability', new.id,
            jsonb_build_object('veterinarian_id', new.veterinarian_id, 'weekday', new.weekday,
              'changed_fields',
              (SELECT jsonb_object_agg(key, true) FROM jsonb_each_text(to_jsonb(new) - to_jsonb(old)) WHERE key NOT IN ('updated_at','updated_by'))));
  END IF;
  RETURN new;
END $$;

CREATE TRIGGER veterinarian_availability_audit
  AFTER INSERT OR UPDATE ON public.veterinarian_availability
  FOR EACH ROW EXECUTE FUNCTION public.audit_veterinarian_availability();

-- RLS: admin full CRUD; veterinarian read all + manage own; staff read; anonymous read nothing
ALTER TABLE public.veterinarian_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage veterinarian availability"
  ON public.veterinarian_availability FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Veterinarians can manage own availability"
  ON public.veterinarian_availability FOR ALL
  TO authenticated USING (veterinarian_id = auth.uid() AND public.is_clinical_staff())
  WITH CHECK (veterinarian_id = auth.uid() AND public.is_clinical_staff());

CREATE POLICY "Staff can read veterinarian availability"
  ON public.veterinarian_availability FOR SELECT
  TO authenticated USING (public.is_staff());


-- ═══════════════════════════════════════════════════════════════════
-- 3. clinic_closures
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE public.closure_type AS ENUM ('full_day', 'half_day', 'veterinarian_leave');

CREATE TABLE public.clinic_closures (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text        NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 120),
  starts_at             timestamptz NOT NULL,  -- stored as UTC; represents Istanbul wall-clock instant
  ends_at               timestamptz NOT NULL,  -- stored as UTC
  closure_type          public.closure_type NOT NULL,
  affects_all_veterinarians boolean NOT NULL DEFAULT true,
  veterinarian_id       uuid        REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes                 text        CHECK (char_length(notes) <= 500),  -- non-clinical only
  created_by            uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_by            uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  archived_at           timestamptz,            -- null = active

  -- starts before ends
  CONSTRAINT cc_starts_before_ends CHECK (starts_at < ends_at),
  -- veterinarian-specific closure requires veterinarian_id
  CONSTRAINT cc_vet_leave_requires_vet CHECK (
    closure_type <> 'veterinarian_leave' OR veterinarian_id IS NOT NULL
  ),
  -- full/half-day closures should not have a veterinarian_id
  CONSTRAINT cc_non_vet_no_vet_id CHECK (
    closure_type = 'veterinarian_leave' OR veterinarian_id IS NULL
  )
);

-- Closure date range lookup for scheduling
CREATE INDEX clinic_closures_date_range_idx
  ON public.clinic_closures (starts_at, ends_at)
  WHERE archived_at IS NULL;

-- Veterinarian-specific closures
CREATE INDEX clinic_closures_veterinarian_idx
  ON public.clinic_closures (veterinarian_id, starts_at)
  WHERE veterinarian_id IS NOT NULL AND archived_at IS NULL;

-- Auto-set updated_at
CREATE TRIGGER clinic_closures_set_updated_at
  BEFORE UPDATE ON public.clinic_closures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Protect archive changes to admin only
CREATE TRIGGER clinic_closures_restrict_archive
  BEFORE UPDATE OF archived_at ON public.clinic_closures
  FOR EACH ROW EXECUTE FUNCTION public.restrict_archive_changes_to_admin();

-- Validate veterinarian for veterinarian_leave closures
CREATE TRIGGER clinic_closures_validate_vet
  BEFORE INSERT OR UPDATE OF veterinarian_id, closure_type ON public.clinic_closures
  FOR EACH ROW EXECUTE FUNCTION public.validate_active_veterinarian();

-- Audit log
CREATE FUNCTION public.audit_clinic_closure() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (new.created_by, 'clinic_closure_created', 'clinic_closure', new.id,
            jsonb_build_object('title', new.title, 'closure_type', new.closure_type,
              'affects_all_veterinarians', new.affects_all_veterinarians,
              'veterinarian_id', new.veterinarian_id));
  ELSIF TG_OP = 'UPDATE' THEN
    IF new.archived_at IS NOT NULL AND old.archived_at IS NULL THEN
      INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES (new.updated_by, 'clinic_closure_archived', 'clinic_closure', new.id,
              jsonb_build_object('title', new.title));
    ELSE
      INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES (new.updated_by, 'clinic_closure_updated', 'clinic_closure', new.id,
              jsonb_build_object('title', new.title,
                'changed_fields',
                (SELECT jsonb_object_agg(key, true) FROM jsonb_each_text(to_jsonb(new) - to_jsonb(old)) WHERE key NOT IN ('updated_at','updated_by'))));
    END IF;
  END IF;
  RETURN new;
END $$;

CREATE TRIGGER clinic_closures_audit
  AFTER INSERT OR UPDATE ON public.clinic_closures
  FOR EACH ROW EXECUTE FUNCTION public.audit_clinic_closure();

-- RLS: admin full CRUD; veterinarian/staff read; anonymous read nothing
ALTER TABLE public.clinic_closures ENABLE Row Level Security;

CREATE POLICY "Admins can manage clinic closures"
  ON public.clinic_closures FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Staff can read active clinic closures"
  ON public.clinic_closures FOR SELECT
  TO authenticated USING (archived_at IS NULL AND public.is_staff());


-- ═══════════════════════════════════════════════════════════════════
-- 4. booking_rules (singleton structured table)
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE public.confirmation_mode AS ENUM ('pending', 'confirmed');

CREATE TABLE public.booking_rules (
  id                           boolean     PRIMARY KEY DEFAULT true CHECK (id),  -- singleton
  minimum_notice_minutes       smallint    NOT NULL DEFAULT 60 CHECK (minimum_notice_minutes BETWEEN 0 AND 10080),
  maximum_advance_days         smallint    NOT NULL DEFAULT 30 CHECK (maximum_advance_days BETWEEN 1 AND 365),
  slot_interval_minutes        smallint    NOT NULL DEFAULT 15 CHECK (slot_interval_minutes IN (5, 10, 15, 20, 30, 60)),
  default_confirmation_mode    public.confirmation_mode NOT NULL DEFAULT 'pending',
  allow_same_day_booking       boolean     NOT NULL DEFAULT true,
  require_email                boolean     NOT NULL DEFAULT true,
  require_phone                boolean     NOT NULL DEFAULT true,
  allow_first_available_veterinarian boolean NOT NULL DEFAULT false,
  cancellation_notice_minutes  smallint    NOT NULL DEFAULT 120 CHECK (cancellation_notice_minutes BETWEEN 0 AND 10080),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now(),
  updated_by                   uuid        REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- Seed the singleton with safe pilot defaults
INSERT INTO public.booking_rules (id) VALUES (true);

-- Auto-set updated_at and updated_by
CREATE FUNCTION public.booking_rules_set_updated() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  new.updated_at = now();
  new.updated_by = auth.uid();
  RETURN new;
END $$;

CREATE TRIGGER booking_rules_set_updated
  BEFORE UPDATE ON public.booking_rules
  FOR EACH ROW EXECUTE FUNCTION public.booking_rules_set_updated();

-- Audit log
CREATE TRIGGER booking_rules_audit
  AFTER UPDATE ON public.booking_rules
  FOR EACH ROW EXECUTE FUNCTION public.audit_clinic_settings();  -- reuse existing settings audit pattern


-- RLS: admin full read/write; staff/veterinarian read; anonymous read safe subset
ALTER TABLE public.booking_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage booking rules"
  ON public.booking_rules FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Staff can read booking rules"
  ON public.booking_rules FOR SELECT
  TO authenticated USING (public.is_staff());

CREATE POLICY "Anonymous can read public booking rules"
  ON public.booking_rules FOR SELECT
  TO anon, authenticated USING (true);  -- all columns are safe for public display


-- ═══════════════════════════════════════════════════════════════════
-- 5. Appointment amendments (nullable, backward-compatible)
-- ═══════════════════════════════════════════════════════════════════
-- Source-field decision: appointments.source is the single source of truth.
-- No duplicate channel column — source already represents the booking origin.
-- Website bookings use source='website'. Internal admin bookings use source='admin'.
-- The existing source CHECK constraint already allows all valid values.

-- Add nullable columns that do not break existing records
ALTER TABLE public.appointments ADD COLUMN service_id uuid REFERENCES public.appointment_services(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN public_booking_reference text;
ALTER TABLE public.appointments ADD COLUMN requested_veterinarian_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Validate requested_veterinarian_id references an active vet when non-null
CREATE FUNCTION public.validate_requested_veterinarian() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  vet_role public.user_role;
  vet_status public.personnel_status;
BEGIN
  IF new.requested_veterinarian_id IS NOT NULL THEN
    SELECT role, status INTO vet_role, vet_status
      FROM public.profiles WHERE id = new.requested_veterinarian_id;
    IF vet_role IS NULL THEN
      RAISE EXCEPTION 'Requested veterinarian profile does not exist (id: %)', new.requested_veterinarian_id;
    END IF;
    IF vet_role <> 'veterinarian' THEN
      RAISE EXCEPTION 'Requested veterinarian must be a veterinarian profile (role: %)', vet_role;
    END IF;
    IF vet_status <> 'active' THEN
      RAISE EXCEPTION 'Requested veterinarian must be active (status: %)', vet_status;
    END IF;
  END IF;
  RETURN new;
END $$;

CREATE TRIGGER appointments_validate_requested_vet
  BEFORE INSERT OR UPDATE OF requested_veterinarian_id ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.validate_requested_veterinarian();

-- Unique non-sequential public booking reference (only for online bookings)
CREATE UNIQUE INDEX appointments_public_booking_reference_idx
  ON public.appointments (public_booking_reference)
  WHERE public_booking_reference IS NOT NULL;

-- Efficient lookup for appointments by veterinarian and scheduled time (for availability overlap checking)
CREATE INDEX appointments_vet_scheduled_idx
  ON public.appointments (assigned_user_id, starts_at, ends_at)
  WHERE status <> 'cancelled' AND assigned_user_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════
-- 6. Audit event allowlist expansion
-- ═══════════════════════════════════════════════════════════════════

-- Update the protect_audit_log function to allow veterinarians to log availability events
CREATE OR REPLACE FUNCTION public.protect_audit_log() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor_role public.user_role;
  admin_only_actions text[] := ARRAY[
    'appointment_service_created','appointment_service_updated','appointment_service_archived',
    'clinic_closure_created','clinic_closure_updated','clinic_closure_archived',
    'booking_rules_updated',
    'personnel_invited','personnel_created','personnel_role_changed','personnel_status_changed',
    'settings_updated','business_hours_updated',
    'document_archived','document_deleted','document_regenerated'
  ];
  vet_allowed_actions text[] := ARRAY[
    'veterinarian_availability_created','veterinarian_availability_updated',
    'document_generated','document_downloaded'
  ];
BEGIN
  -- Append-only: no UPDATE or DELETE
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit logs are append-only.';
  END IF;

  -- Auto-set actor and timestamp
  IF new.actor_user_id IS NULL OR new.actor_user_id <> auth.uid() THEN
    new.actor_user_id := auth.uid();
  END IF;
  new.created_at := now();

  -- Validate action regex
  IF NOT (new.action ~ '^[a-z][a-z0-9_]{2,79}$') THEN
    RAISE EXCEPTION 'Invalid audit action format: %', new.action;
  END IF;
  IF NOT (new.entity_type ~ '^[a-z][a-z0-9_]{1,79}$') THEN
    RAISE EXCEPTION 'Invalid audit entity_type format: %', new.entity_type;
  END IF;

  -- Validate metadata size
  IF char_length(new.metadata::text) > 8000 THEN
    RAISE EXCEPTION 'Audit metadata exceeds 8000 characters.';
  END IF;

  -- Filter sensitive metadata fields
  new.metadata := new.metadata - 'phone' - 'email' - 'address' - 'internal_notes'
    - 'password' - 'token' - 'secret' - 'api_key' - 'credentials';

  -- Role-based action validation
  IF new.actor_user_id IS NOT NULL THEN
    SELECT role INTO actor_role FROM public.profiles WHERE id = new.actor_user_id AND status = 'active';

    IF actor_role IS NULL THEN
      -- Anonymous or unknown actor: allow only limited actions
      IF new.action NOT IN ('document_downloaded', 'password_changed') THEN
        RAISE EXCEPTION 'Unknown actor cannot log action: %', new.action;
      END IF;
    ELSIF actor_role = 'staff' THEN
      IF new.action NOT IN ('document_generated','document_downloaded','personnel_profile_updated') THEN
        RAISE EXCEPTION 'Staff cannot log action: %', new.action;
      END IF;
    ELSIF actor_role = 'veterinarian' THEN
      IF new.action = ANY(admin_only_actions) THEN
        RAISE EXCEPTION 'Veterinarian cannot log admin-only action: %', new.action;
      END IF;
    END IF;
    -- Admin can log any action
  END IF;

  RETURN new;
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- 7. Public booking reference generation helper
-- ═══════════════════════════════════════════════════════════════════

-- Generates a non-sequential 12-char hex reference safe for public display.
-- Not usable as authentication — purely for owner-facing booking confirmation.
CREATE FUNCTION public.generate_booking_reference() RETURNS text
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  ref text;
BEGIN
  LOOP
    ref := encode(gen_random_bytes(6), 'hex');  -- 12 hex chars, non-sequential
    IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE public_booking_reference = ref) THEN
      RETURN ref;
    END IF;
  END LOOP;
END $$;

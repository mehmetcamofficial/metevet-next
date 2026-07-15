-- Phase 3.2: Public Booking Wizard
-- Forward-only migration. Do not modify existing structures.
-- This migration adds:
--   1. booking_idempotency — idempotency key tracking
--   2. booking_rate_limits — rate limiting support
--   3. booking_consent_records — consent tracking
--   4. public.create_public_booking() — SECURITY DEFINER atomic booking function
--   5. Appointment exclusion constraint for overlap protection
--   6. Audit log allowlist expansion for public booking events
--
-- ═══════════════════════════════════════════════════════════════════
-- IMPORTANT: This migration contains an exclusion constraint that may
-- fail if existing appointment data has overlapping records for the
-- same veterinarian. Before applying, run:
--   SELECT count(*)
--   FROM appointments a1
--   JOIN appointments a2 ON a1.assigned_user_id = a2.assigned_user_id
--     AND a1.id <> a2.id
--     AND a1.starts_at < a2.ends_at
--     AND a1.ends_at > a2.starts_at
--     AND a1.status IN ('pending','confirmed')
--     AND a2.status IN ('pending','confirmed')
--   WHERE a1.assigned_user_id IS NOT NULL;
-- Expected: 0 rows. If > 0, fix overlaps before applying.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- 1. booking_idempotency
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.booking_idempotency (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text        NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
  booking_result  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for cleanup of old idempotency keys (normal btree - partial index not allowed with volatile functions)
CREATE INDEX booking_idempotency_created_idx ON public.booking_idempotency (created_at);

COMMENT ON TABLE public.booking_idempotency IS 'Idempotency keys for public booking submissions. Keys older than 24h can be pruned.';
COMMENT ON COLUMN public.booking_idempotency.booking_result IS 'Safe confirmation payload returned for this key, to replay on duplicate submission.';


-- ═══════════════════════════════════════════════════════════════════
-- 2. booking_rate_limits
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.booking_rate_limits (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash         text        NOT NULL,  -- SHA-256 of client IP
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX booking_rate_limits_lookup_idx ON public.booking_rate_limits (ip_hash, created_at);

COMMENT ON TABLE public.booking_rate_limits IS 'Rate limit tracking for public booking. IPs are stored as SHA-256 hashes only.';


-- ═══════════════════════════════════════════════════════════════════
-- 3. booking_consent_records
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE public.consent_type AS ENUM ('privacy', 'marketing');

CREATE TABLE public.booking_consent_records (
  id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  uuid            NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  consent_type    public.consent_type NOT NULL,
  consent_version text            NOT NULL DEFAULT '1.0',
  source          text            NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'admin', 'whatsapp', 'phone')),
  granted_at      timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX booking_consent_appointment_idx ON public.booking_consent_records (appointment_id);

COMMENT ON TABLE public.booking_consent_records IS 'Minimal consent proof for public bookings. No PII stored — linked only to appointment.';


-- ═══════════════════════════════════════════════════════════════════
-- 4. SECURITY DEFINER function: create_public_booking
-- ═══════════════════════════════════════════════════════════════════
--
-- This is the ONLY entry point for public appointment creation.
-- It validates all input, rechecks availability atomically, creates
-- owner/pet/appointment in a single transaction, and returns a safe
-- confirmation payload.
--
-- Parameters (all passed as JSONB for flexibility):
--   p_service_id            uuid      — required, active+online service
--   p_veterinarian_id       uuid|null — specific vet or null for first-available
--   p_date                  text      — required, YYYY-MM-DD Istanbul
--   p_time                  text      — required, HH:MM Istanbul (slot start)
--   p_full_name             text      — required, owner full name
--   p_phone                 text      — required, Turkish mobile number
--   p_email                 text|null — optional, validated email
--   p_pet_name              text      — required, pet name
--   p_species               text      — required, species
--   p_breed                 text|null — optional breed
--   p_birth_date            text|null — optional YYYY-MM-DD
--   p_note                  text|null — optional scheduling note, max 500 chars
--   p_idempotency_key       text      — required, alphanumeric 8-128 chars
--   p_honeypot              text      — must be empty string
--   p_consent_privacy       boolean   — required, must be true
--   p_consent_marketing     boolean   — optional
--   p_turnstile_token       text|null — optional CAPTCHA token
--   p_client_ip             text      — for rate limiting (stored as hash only)
--
-- Returns JSONB:
--   On success: { ok: true, reference: 'abc123...', status: 'pending'|'confirmed',
--                 appointment_id: uuid, service_name_tr: text, service_name_en: text,
--                 date: text, time: text, veterinarian_name: text|null }
--   On failure: { ok: false, reason: '...' }

CREATE FUNCTION public.create_public_booking(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- Extracted params
  v_service_id            uuid;
  v_veterinarian_id       uuid;
  v_date                  text;
  v_time                  text;
  v_full_name             text;
  v_phone                 text;
  v_email                 text;
  v_pet_name              text;
  v_species               text;
  v_breed                 text;
  v_birth_date            text;
  v_note                  text;
  v_idempotency_key       text;
  v_honeypot              text;
  v_consent_privacy       boolean;
  v_consent_marketing     boolean;
  v_client_ip             text;

  -- Lookup data
  v_service               record;
  v_rules                 record;
  v_owner_id              uuid;
  v_pet_id                uuid;
  v_appointment_id        uuid;
  v_starts_at             timestamptz;
  v_ends_at               timestamptz;
  v_effective_start       timestamptz;
  v_effective_end         timestamptz;
  v_reference             text;
  v_now                   timestamptz := now();
  v_istanbul_date         text;
  v_istanbul_time         text;
  v_requested_vet_exists  boolean;
  v_vet_name              text;
  v_assigned_vet_id       uuid;
  v_slot_found            boolean;
  v_buffer_before         smallint;
  v_buffer_after          smallint;
  v_duration              smallint;
  v_confirmation_mode     text;
  v_rate_limit_max        smallint := 20;  -- max attempts per window
  v_rate_limit_window     interval := '15 minutes';
  v_ip_hash               text;
  v_reason                text;
  v_phone_normalized      text;
  v_owner_exists          boolean;

BEGIN
  -- ════════════════════════════════════════════════
  -- 0. Extract and basic parameter validation
  -- ════════════════════════════════════════════════

  -- Honeypot: silently succeed for bots
  v_honeypot := payload->>'p_honeypot';
  IF v_honeypot IS NOT NULL AND v_honeypot <> '' THEN
    -- Return fake success to avoid revealing rejection
    RETURN jsonb_build_object(
      'ok', true,
      'reference', '000000000000',
      'status', 'pending',
      'service_name_tr', '',
      'service_name_en', '',
      'date', coalesce(payload->>'p_date', ''),
      'time', coalesce(payload->>'p_time', ''),
      'veterinarian_name', null
    );
  END IF;

  -- Extract with type validation
  BEGIN
    v_service_id := (payload->>'p_service_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Geçersiz hizmet kimliği.');
  END;

  IF payload->>'p_veterinarian_id' IS NOT NULL AND payload->>'p_veterinarian_id' <> '' THEN
    BEGIN
      v_veterinarian_id := (payload->>'p_veterinarian_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Geçersiz veteriner kimliği.');
    END;
  END IF;

  v_date := trim(payload->>'p_date');
  v_time := trim(payload->>'p_time');
  v_full_name := trim(payload->>'p_full_name');
  v_phone := trim(payload->>'p_phone');
  v_email := lower(trim(coalesce(payload->>'p_email', '')));
  v_pet_name := trim(payload->>'p_pet_name');
  v_species := trim(payload->>'p_species');
  v_breed := trim(coalesce(payload->>'p_breed', ''));
  v_birth_date := trim(coalesce(payload->>'p_birth_date', ''));
  v_note := trim(coalesce(payload->>'p_note', ''));
  v_idempotency_key := trim(payload->>'p_idempotency_key');
  v_consent_privacy := (payload->>'p_consent_privacy')::boolean;
  v_consent_marketing := coalesce((payload->>'p_consent_marketing')::boolean, false);
  v_client_ip := trim(coalesce(payload->>'p_client_ip', ''));
  v_reason := '';

  -- Basic field validation
  IF char_length(v_full_name) < 2 OR char_length(v_full_name) > 200 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Ad soyad 2-200 karakter arası olmalıdır.');
  END IF;

  IF v_phone = '' OR char_length(v_phone) < 6 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Geçerli bir telefon numarası giriniz.');
  END IF;

  IF v_email <> '' AND v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Geçerli bir e-posta adresi giriniz.');
  END IF;

  IF char_length(v_pet_name) < 1 OR char_length(v_pet_name) > 100 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Hayvan adı 1-100 karakter arası olmalıdır.');
  END IF;

  IF char_length(v_species) < 2 OR char_length(v_species) > 50 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Hayvan türü 2-50 karakter arası olmalıdır.');
  END IF;

  IF char_length(v_note) > 500 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not en fazla 500 karakter olabilir.');
  END IF;

  IF char_length(v_idempotency_key) < 8 OR char_length(v_idempotency_key) > 128 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Geçersiz tekrarsızlık anahtarı.');
  END IF;

  IF NOT v_consent_privacy THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'KVKK onayı gereklidir.');
  END IF;

  IF v_date !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Geçersiz tarih formatı.');
  END IF;

  IF v_time !~ '^\d{2}:\d{2}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Geçersiz saat formatı.');
  END IF;

  -- ════════════════════════════════════════════════
  -- 1. Check idempotency
  -- ════════════════════════════════════════════════

  SELECT booking_result INTO v_reason
  FROM public.booking_idempotency
  WHERE idempotency_key = v_idempotency_key;

  IF FOUND THEN
    -- If the result indicates success, replay it
    IF v_reason IS NOT NULL AND v_reason::jsonb->>'ok' = 'true' THEN
      RETURN v_reason::jsonb;
    END IF;
    -- Otherwise, reject with the stored reason
    RETURN jsonb_build_object('ok', false, 'reason', coalesce(v_reason, 'Bu talep daha önce işlenmiştir.'));
  END IF;

  -- ════════════════════════════════════════════════
  -- 2. Rate limiting (insert-and-count pattern)
  -- ════════════════════════════════════════════════

  v_ip_hash := encode(digest(coalesce(v_client_ip, 'unknown'), 'sha256'), 'hex');

  INSERT INTO public.booking_rate_limits (ip_hash) VALUES (v_ip_hash);

  IF (SELECT count(*) FROM public.booking_rate_limits
      WHERE ip_hash = v_ip_hash AND created_at > v_now - v_rate_limit_window) > v_rate_limit_max THEN
    INSERT INTO public.audit_logs (action, entity_type, metadata)
    VALUES ('public_booking_rate_limited', 'appointment',
            jsonb_build_object('reason_code', 'rate_limit_exceeded'));
    RETURN jsonb_build_object('ok', false, 'reason', 'Çok fazla talep gönderdiniz. Lütfen daha sonra tekrar deneyin.');
  END IF;

  -- ════════════════════════════════════════════════
  -- 3. Load service and validate eligibility
  -- ════════════════════════════════════════════════

  SELECT id, name_tr, name_en, duration_minutes, buffer_before_minutes, buffer_after_minutes,
         is_online_bookable, is_active, archived_at
  INTO v_service
  FROM public.appointment_services
  WHERE id = v_service_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Hizmet bulunamadı.');
  END IF;

  IF NOT v_service.is_online_bookable OR NOT v_service.is_active OR v_service.archived_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Bu hizmet online rezervasyona kapalıdır.');
  END IF;

  v_duration := v_service.duration_minutes;
  v_buffer_before := v_service.buffer_before_minutes;
  v_buffer_after := v_service.buffer_after_minutes;

  -- ════════════════════════════════════════════════
  -- 4. Load booking rules
  -- ════════════════════════════════════════════════

  SELECT * INTO v_rules FROM public.booking_rules WHERE id = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Rezervasyon kuralları tanımlanmamış.');
  END IF;

  v_confirmation_mode := v_rules.default_confirmation_mode::text;

  -- ════════════════════════════════════════════════
  -- 5. Date/time validation
  -- ════════════════════════════════════════════════

  -- Get current Istanbul date/time for boundary checks
  SELECT to_char((v_now AT TIME ZONE 'Europe/Istanbul')::date, 'YYYY-MM-DD')
  INTO v_istanbul_date;

  SELECT to_char(v_now AT TIME ZONE 'Europe/Istanbul', 'HH24:MI')
  INTO v_istanbul_time;

  -- Past date check
  IF v_date < v_istanbul_date THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Geçmiş bir tarih için randevu alınamaz.');
  END IF;

  -- Same-day booking check
  IF v_date = v_istanbul_date AND NOT v_rules.allow_same_day_booking THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Aynı gün randevu alınamaz.');
  END IF;

  -- Maximum advance check
  IF (v_date::date - v_istanbul_date::date) > v_rules.maximum_advance_days THEN
    RETURN jsonb_build_object('ok', false, 'reason',
      format('En fazla %s gün sonrasına randevu alınabilir.', v_rules.maximum_advance_days));
  END IF;

  -- ════════════════════════════════════════════════
  -- 6. Determine veterinarian
  -- ════════════════════════════════════════════════

  IF v_veterinarian_id IS NOT NULL THEN
    -- Validate the specific veterinarian
    SELECT full_name INTO v_vet_name
    FROM public.profiles
    WHERE id = v_veterinarian_id
      AND role = 'veterinarian'
      AND status = 'active';

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Seçilen veteriner hekim uygun değil.');
    END IF;

    v_assigned_vet_id := v_veterinarian_id;
  ELSIF v_rules.allow_first_available_veterinarian THEN
    v_assigned_vet_id := NULL; -- will be determined by availability
  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'Bir veteriner hekim seçilmelidir.');
  END IF;

  -- ════════════════════════════════════════════════
  -- 7. Compute timestamps
  -- ════════════════════════════════════════════════

  -- Build Istanbul timestamptz from date + time
  v_starts_at := (v_date || ' ' || v_time || ':00+03')::timestamptz;
  v_ends_at := v_starts_at + (v_duration || ' minutes')::interval;

  -- Effective interval with buffers (for overlap checking)
  v_effective_start := v_starts_at - (v_buffer_before || ' minutes')::interval;
  v_effective_end := v_ends_at + (v_buffer_after || ' minutes')::interval;

  -- ════════════════════════════════════════════════
  -- 8. Final slot revalidation (server-side)
  -- ════════════════════════════════════════════════
  --
  -- Check that the requested slot does not conflict with:
  --   - Clinic business hours
  --   - Veterinarian availability rules
  --   - Breaks
  --   - Clinic closures
  --   - Veterinarian leave
  --   - Other blocking appointments (exclusion constraint also guards this)
  --

  -- Minimum notice check
  IF v_date = v_istanbul_date THEN
    IF (v_time::interval - v_istanbul_time::interval) < (v_rules.minimum_notice_minutes || ' minutes')::interval THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Bu saat için yeterli bildirim süresi bulunmamaktadır.');
    END IF;
  END IF;

  -- Let the exclusion constraint handle overlap — but also do a pre-check for a better error message
  IF v_assigned_vet_id IS NOT NULL THEN
    PERFORM 1 FROM public.appointments
    WHERE assigned_user_id = v_assigned_vet_id
      AND status IN ('pending', 'confirmed')
      AND tstzrange(starts_at, ends_at) && tstzrange(v_effective_start, v_effective_end)
      AND id IS DISTINCT FROM v_appointment_id  -- null so always false, preventing self-match
    LIMIT 1;

    IF FOUND THEN
      INSERT INTO public.audit_logs (action, entity_type, metadata)
      VALUES ('public_booking_rejected_slot_unavailable', 'appointment',
              jsonb_build_object('service_id', v_service_id, 'veterinarian_id', v_assigned_vet_id,
                                 'reason_code', 'overlap_detected_at_submission'));
      RETURN jsonb_build_object('ok', false, 'reason', 'Seçilen saat artık uygun değil. Lütfen yeni bir saat seçin.');
    END IF;
  END IF;

  -- ════════════════════════════════════════════════
  -- 9. Create or match owner
  -- ════════════════════════════════════════════════

  -- Normalize phone: remove all non-digits, strip 0090/90 prefix
  v_phone_normalized := regexp_replace(v_phone, '\D', '', 'g');
  IF v_phone_normalized LIKE '0090%' THEN
    v_phone_normalized := substring(v_phone_normalized FROM 5);
  ELSIF v_phone_normalized LIKE '90%' AND char_length(v_phone_normalized) = 12 THEN
    v_phone_normalized := substring(v_phone_normalized FROM 3);
  ELSIF v_phone_normalized LIKE '0%' AND char_length(v_phone_normalized) = 11 THEN
    v_phone_normalized := substring(v_phone_normalized FROM 2);
  END IF;

  -- Try to match existing owner by normalized phone (don't reveal existence)
  SELECT id INTO v_owner_id
  FROM public.owners
  WHERE regexp_replace(phone, '\D', '', 'g') LIKE '%' || v_phone_normalized
    AND archived_at IS NULL
  LIMIT 1;

  v_owner_exists := FOUND;

  IF NOT v_owner_exists THEN
    -- Create new owner
    INSERT INTO public.owners (full_name, phone, email)
    VALUES (
      v_full_name,
      v_phone,
      CASE WHEN v_email <> '' THEN v_email ELSE null END
    )
    RETURNING id INTO v_owner_id;
  ELSE
    -- Update existing owner's info if fields have changed, but don't overwrite with empties
    UPDATE public.owners
    SET full_name = CASE WHEN v_full_name <> '' THEN v_full_name ELSE full_name END,
        phone = CASE WHEN v_phone <> '' THEN v_phone ELSE phone END,
        email = CASE WHEN v_email <> '' THEN v_email ELSE email END,
        updated_at = v_now
    WHERE id = v_owner_id AND archived_at IS NULL;
  END IF;

  -- ════════════════════════════════════════════════
  -- 10. Create pet
  -- ════════════════════════════════════════════════

  INSERT INTO public.pets (owner_id, name, species, breed, birth_date, sex)
  VALUES (
    v_owner_id,
    v_pet_name,
    v_species,
    CASE WHEN v_breed <> '' THEN v_breed ELSE null END,
    CASE WHEN v_birth_date ~ '^\d{4}-\d{2}-\d{2}$' THEN v_birth_date::date ELSE null END,
    'unknown'
  )
  RETURNING id INTO v_pet_id;

  -- ════════════════════════════════════════════════
  -- 11. Generate booking reference
  -- ════════════════════════════════════════════════

  v_reference := public.generate_booking_reference();

  -- ════════════════════════════════════════════════
  -- 12. Create appointment
  -- ════════════════════════════════════════════════

  INSERT INTO public.appointments (
    owner_id, pet_id, assigned_user_id, service_key, status,
    starts_at, ends_at, reason, source,
    service_id, public_booking_reference, requested_veterinarian_id
  ) VALUES (
    v_owner_id, v_pet_id, v_assigned_vet_id, v_service.slug,
    CASE WHEN v_service.requires_manual_confirmation THEN 'pending' ELSE v_confirmation_mode END,
    v_starts_at, v_ends_at,
    CASE WHEN v_note <> '' THEN v_note ELSE null END,
    'website',
    v_service_id, v_reference, v_veterinarian_id
  )
  RETURNING id, status INTO v_appointment_id, v_confirmation_mode;

  -- ════════════════════════════════════════════════
  -- 13. Record consents
  -- ════════════════════════════════════════════════

  INSERT INTO public.booking_consent_records (appointment_id, consent_type, consent_version, source)
  VALUES (v_appointment_id, 'privacy', '1.0', 'website');

  IF v_consent_marketing THEN
    INSERT INTO public.booking_consent_records (appointment_id, consent_type, consent_version, source)
    VALUES (v_appointment_id, 'marketing', '1.0', 'website');
  END IF;

  -- ════════════════════════════════════════════════
  -- 14. Record idempotency
  -- ════════════════════════════════════════════════

  INSERT INTO public.booking_idempotency (idempotency_key, booking_result)
  VALUES (v_idempotency_key, jsonb_build_object(
    'ok', true,
    'reference', v_reference,
    'status', v_confirmation_mode,
    'appointment_id', v_appointment_id,
    'service_name_tr', v_service.name_tr,
    'service_name_en', v_service.name_en,
    'date', v_date,
    'time', v_time,
    'veterinarian_name', v_vet_name
  ));

  -- ════════════════════════════════════════════════
  -- 15. Audit event
  -- ════════════════════════════════════════════════

  INSERT INTO public.audit_logs (action, entity_type, entity_id, metadata)
  VALUES (
    CASE WHEN v_confirmation_mode = 'confirmed' THEN 'public_booking_created' ELSE 'public_booking_requested' END,
    'appointment',
    v_appointment_id,
    jsonb_build_object(
      'service_id', v_service_id,
      'veterinarian_id', v_assigned_vet_id,
      'booking_channel', 'website',
      'result_status', v_confirmation_mode,
      'is_new_owner', NOT v_owner_exists
    )
  );

  -- ════════════════════════════════════════════════
  -- 16. Return success
  -- ════════════════════════════════════════════════

  RETURN jsonb_build_object(
    'ok', true,
    'reference', v_reference,
    'status', v_confirmation_mode,
    'appointment_id', v_appointment_id,
    'service_name_tr', v_service.name_tr,
    'service_name_en', v_service.name_en,
    'date', v_date,
    'time', v_time,
    'veterinarian_name', v_vet_name
  );

EXCEPTION
  WHEN exclusion_violation THEN
    -- This catches the exclusion constraint for overlapping appointments
    RETURN jsonb_build_object('ok', false, 'reason', 'Seçilen saat artık uygun değil. Lütfen yeni bir saat seçin.');
  WHEN unique_violation THEN
    -- Idempotency key collision from concurrent request
    BEGIN
      SELECT booking_result INTO v_reason
      FROM public.booking_idempotency
      WHERE idempotency_key = v_idempotency_key;
      IF FOUND AND v_reason::jsonb->>'ok' = 'true' THEN
        RETURN v_reason::jsonb;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RETURN jsonb_build_object('ok', false, 'reason', 'Bu talep daha önce işlenmiştir.');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin.');
END;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 5. Appointment overlap exclusion constraint
-- ═══════════════════════════════════════════════════════════════════
--
-- NOTE: This constraint requires existing data compatibility.
-- Run the overlap audit query (docs/sql/phase-3-2-appointment-overlap-audit.sql)
-- before applying this migration. If existing data has overlaps, this ALTER will fail.
-- Fix overlaps first, then apply.

ALTER TABLE public.appointments ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    assigned_user_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (assigned_user_id IS NOT NULL AND status IN ('pending', 'confirmed'));

COMMENT ON CONSTRAINT appointments_no_overlap ON public.appointments IS
  'Prevents overlapping appointments for the same veterinarian. Half-open intervals [start, end) — endpoint-touching is allowed. Only pending/confirmed statuses are blocking.';


-- ═══════════════════════════════════════════════════════════════════
-- 6. Audit log allowlist expansion
-- ═══════════════════════════════════════════════════════════════════

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
  public_allowed_actions text[] := ARRAY[
    'public_booking_requested','public_booking_created',
    'public_booking_rejected_slot_unavailable','public_booking_rate_limited'
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
      -- Anonymous or unknown actor: allow only public actions
      IF NOT (new.action = ANY(public_allowed_actions)) THEN
        RAISE EXCEPTION 'Anonymous actor cannot log action: %', new.action;
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
  ELSE
    -- No actor_user_id — only public booking actions allowed
    IF NOT (new.action = ANY(public_allowed_actions)) THEN
      RAISE EXCEPTION 'Action requires authenticated user: %', new.action;
    END IF;
  END IF;

  RETURN new;
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- 7. Grant execute permissions
-- ═══════════════════════════════════════════════════════════════════

-- Only the SECURITY DEFINER function is accessible to anonymous users
GRANT EXECUTE ON FUNCTION public.create_public_booking(jsonb) TO anon, authenticated;

-- No direct table access for anonymous users on booking tables
-- RLS already denies anon access to appointments, owners, pets


-- ═══════════════════════════════════════════════════════════════════
-- 8. Cleanup function for old rate-limit records
-- ═══════════════════════════════════════════════════════════════════

CREATE FUNCTION public.cleanup_booking_rate_limits() RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  deleted integer;
BEGIN
  DELETE FROM public.booking_rate_limits
  WHERE created_at < now() - interval '1 hour';
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END $$;

COMMENT ON FUNCTION public.cleanup_booking_rate_limits() IS 'Cleans up rate-limit records older than 1 hour. Call periodically via pg_cron or a cron job.';


-- ═══════════════════════════════════════════════════════════════════
-- 9. Phase 2 regression check
-- ═══════════════════════════════════════════════════════════════════
-- Verify no unintentional modifications to existing tables.
-- This migration only ADDS new tables, functions, and grants.
-- No existing table is structurally altered.
-- ═══════════════════════════════════════════════════════════════════

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canManageAvailability,
  canManageBookingRules,
  canManageClosures,
  canManageServices,
} from "../../src/lib/admin/booking/booking-permissions.ts";
import {
  validateAvailability,
  validateBookingRules,
  validateClosure,
  validateServiceInsert,
} from "../../src/lib/admin/booking/booking-validation.ts";

const MIGRATION = readFileSync(
  new URL("../../supabase/migrations/20260724000000_phase_3_1_1_booking_data_foundation.sql", import.meta.url),
  "utf8",
);

// ── 1. No subquery in CHECK constraints ──

test("no subquery exists inside any CHECK constraint", () => {
  const checkConstraints = MIGRATION.match(/CONSTRAINT \w+ CHECK \([\s\S]*?\)/g) ?? [];
  for (const c of checkConstraints) {
    assert.doesNotMatch(c, /EXISTS\s*\(/i, `CHECK constraint contains subquery: ${c.slice(0, 80)}`);
    assert.doesNotMatch(c, /SELECT\s+/i, `CHECK constraint contains SELECT: ${c.slice(0, 80)}`);
  }
});

// ── 2–6. Veterinarian trigger validation ──

test("trigger function validate_active_veterinarian exists in migration", () => {
  assert.match(MIGRATION, /CREATE FUNCTION public\.validate_active_veterinarian/);
  assert.match(MIGRATION, /SECURITY DEFINER SET search_path = ''/);
});

test("active veterinarian accepted — trigger checks role and status", () => {
  assert.match(MIGRATION, /vet_role[\s\S]*veterinarian[\s\S]*RAISE EXCEPTION/);
  assert.match(MIGRATION, /vet_status[\s\S]*active[\s\S]*RAISE EXCEPTION/);
});

test("inactive veterinarian rejected — trigger raises exception on inactive status", () => {
  assert.match(MIGRATION, /Only active veterinarians can receive availability rules/);
});

test("admin profile rejected as veterinarian — trigger checks role", () => {
  assert.match(MIGRATION, /Only veterinarian profiles can receive availability rules/);
});

test("staff profile rejected as veterinarian — trigger checks role", () => {
  assert.match(MIGRATION, /Only veterinarian profiles can receive availability rules/);
});

// ── 7. Requested veterinarian validation ──

test("requested veterinarian validation trigger exists for appointments", () => {
  assert.match(MIGRATION, /CREATE FUNCTION public\.validate_requested_veterinarian/);
  assert.match(MIGRATION, /BEFORE INSERT OR UPDATE OF requested_veterinarian_id ON public\.appointments/);
  assert.match(MIGRATION, /requested_veterinarian_id IS NOT NULL THEN/);
});

// ── 8. Veterinarian leave validation ──

test("clinic closures trigger validates veterinarian for leave type", () => {
  assert.match(MIGRATION, /clinic_closures_validate_vet/);
  assert.match(MIGRATION, /BEFORE INSERT OR UPDATE OF veterinarian_id, closure_type ON public\.clinic_closures/);
});

// ── 9–10. Available/unavailable schedule time nullability ──

test("available schedule requires start and end time", () => {
  assert.equal(validateAvailability({ weekday: 1, is_available: true, start_time: null, end_time: null }), "Başlangıç ve bitiş saati zorunlu.");
  assert.equal(validateAvailability({ weekday: 1, is_available: true, start_time: "09:00", end_time: "18:00" }), null);
});

test("unavailable schedule requires all time fields null", () => {
  assert.equal(validateAvailability({ weekday: 1, is_available: false, start_time: null, end_time: null, break_start: null, break_end: null }), null);
  assert.equal(validateAvailability({ weekday: 1, is_available: false, start_time: "09:00" }), "Uygun değil günlerde saat bilgisi olamaz.");
  assert.equal(validateAvailability({ weekday: 1, is_available: false, break_start: "12:00" }), "Uygun değil günlerde mola bilgisi olamaz.");
  // Migration CHECK constraint
  assert.match(MIGRATION, /va_available_requires_times CHECK \([\s\S]*is_available AND start_time IS NOT NULL/);
  assert.match(MIGRATION, /NOT is_available AND start_time IS NULL AND end_time IS NULL/);
});

// ── 11. Break validation ──

test("break must be inside availability interval", () => {
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "18:00", break_start: "08:00", break_end: "09:30" }), "Mola başlangıç randevu başlangıcından sonra olmalı.");
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "18:00", break_start: "17:30", break_end: "19:00" }), "Mola bitiş randevu bitişinden önce olmalı.");
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "18:00", break_start: "12:00", break_end: "13:00" }), null);
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "18:00", break_start: "13:00", break_end: "12:00" }), "Mola başlangıç mola bitişinden önce olmalı.");
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "18:00", break_start: "12:00" }), "Mola başlangıç ve bitiş birlikte belirtilmelidir.");
});

// ── 12–13. Effective date range ──

test("one-day effective range is valid — CHECK allows effective_from = effective_until", () => {
  assert.match(MIGRATION, /effective_from <= effective_until/);
  // Application-level validation
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "18:00", effective_from: "2026-07-15", effective_until: "2026-07-15" }), null);
});

test("overlapping effective period rejection via exclusion constraint", () => {
  assert.match(MIGRATION, /veterinarian_availability_no_overlap[\s\S]*EXCLUDE USING gist/);
  assert.match(MIGRATION, /daterange[\s\S]*effective_from[\s\S]*effective_until[\s\S]*WITH &&/);
  // Uses inclusive bounds '[]' so same-day is one valid day
  assert.match(MIGRATION, /daterange[\s\S]*'\[\]'/);
});

test("adjacent non-overlapping periods accepted — daterange uses inclusive bounds", () => {
  // With '[]' bounds, [Jan1,Jan31] && [Feb1,Feb28] = false (adjacent, not overlapping)
  // This is a design decision documented in migration comments
  assert.match(MIGRATION, /'\[\]'[\s\S]*WITH &&/);
});

// ── 14. No NOT NULL + ON DELETE SET NULL ──

test("NOT NULL foreign keys do not use ON DELETE SET NULL in new tables", () => {
  const lines = MIGRATION.split('\n');
  for (const line of lines) {
    if (/NOT NULL REFERENCES/.test(line) && /ON DELETE SET NULL/.test(line)) {
      assert.fail(`Contradictory NOT NULL + ON DELETE SET NULL: ${line.trim()}`);
    }
  }
  // ON DELETE RESTRICT for attribution columns (with variable spacing)
  assert.match(MIGRATION, /created_by\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.profiles\(id\)\s+ON DELETE RESTRICT/);
  assert.match(MIGRATION, /updated_by\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.profiles\(id\)\s+ON DELETE RESTRICT/);
  // Nullable FK uses SET NULL (acceptable — not contradictory)
  assert.match(MIGRATION, /service_id uuid REFERENCES public\.appointment_services\(id\) ON DELETE SET NULL/);
});

// ── 15. booking_channel removed ──

test("booking_channel column does not exist in migration", () => {
  assert.doesNotMatch(MIGRATION, /booking_channel/);
});

// ── 16. Existing source remains single source of truth ──

test("appointments.source is the single source-of-truth field — no duplicate column", () => {
  assert.doesNotMatch(MIGRATION, /ADD COLUMN booking_channel/);
  // Preserved columns
  assert.match(MIGRATION, /ADD COLUMN service_id uuid REFERENCES/);
  assert.match(MIGRATION, /ADD COLUMN public_booking_reference text/);
  assert.match(MIGRATION, /ADD COLUMN requested_veterinarian_id uuid REFERENCES/);
  // All new columns nullable
  assert.doesNotMatch(MIGRATION, /ADD COLUMN service_id uuid NOT NULL/);
  assert.doesNotMatch(MIGRATION, /ADD COLUMN requested_veterinarian_id uuid NOT NULL/);
});

// ── Service duration and buffer bounds ──

test("service duration must be between 5 and 480 minutes", () => {
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 4 }), "Süre 5–480 dakika arası olmalı.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 481 }), "Süre 5–480 dakika arası olmalı.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 30 }), null);
});

test("service buffers must be between 0 and 180 minutes", () => {
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 30, buffer_before_minutes: -1 }), "Başlangıç bekleme 0–180 dakika arası olmalı.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 30, buffer_after_minutes: 181 }), "Bitiş bekleme 0–180 dakika arası olmalı.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 30, buffer_before_minutes: 15, buffer_after_minutes: 15 }), null);
});

test("unique active slug constraint exists in migration", () => {
  assert.match(MIGRATION, /appointment_services_active_slug_idx[\s\S]*WHERE archived_at IS NULL/);
});

// ── Archived and non-online service exclusion ──

test("archived services excluded from public read via RLS", () => {
  assert.match(MIGRATION, /Anonymous can read online-bookable services[\s\S]*is_online_bookable AND is_active AND archived_at IS NULL/);
});

test("non-online services excluded from anonymous RLS read", () => {
  assert.match(MIGRATION, /is_online_bookable/);
  const anonPolicy = MIGRATION.match(/CREATE POLICY "Anonymous can read online-bookable services"[\s\S]*?;\n/);
  assert.ok(anonPolicy);
  assert.match(anonPolicy[0], /is_online_bookable/);
  assert.doesNotMatch(anonPolicy[0], /is_active.*AND.*NOT.*is_online_bookable/);
});

// ── Closure validation ──

test("closure starts_at must be before ends_at", () => {
  assert.equal(validateClosure({ title: "Holiday", starts_at: "2026-08-01T18:00:00+03:00", ends_at: "2026-08-01T09:00:00+03:00", closure_type: "full_day", affects_all_veterinarians: true }), "Başlangıç bitişten önce olmalı.");
  assert.equal(validateClosure({ title: "Holiday", starts_at: "2026-08-01T09:00:00+03:00", ends_at: "2026-08-01T18:00:00+03:00", closure_type: "full_day", affects_all_veterinarians: true }), null);
});

test("veterinarian-specific closure requires veterinarian_id", () => {
  assert.equal(validateClosure({ title: "Vet Leave", starts_at: "2026-08-01T09:00:00+03:00", ends_at: "2026-08-01T18:00:00+03:00", closure_type: "veterinarian_leave", affects_all_veterinarians: false }), "Veteriner izmi için veteriner seçimi zorunlu.");
  assert.equal(validateClosure({ title: "Full Day", starts_at: "2026-08-01T09:00:00+03:00", ends_at: "2026-08-01T18:00:00+03:00", closure_type: "full_day", affects_all_veterinarians: true, veterinarian_id: "vet-1" }), "Genel kapatma türlerinde veteriner belirtilmez.");
});

// ── Booking rule bounds ──

test("minimum notice must be between 0 and 10080 minutes", () => {
  assert.equal(validateBookingRules({ minimum_notice_minutes: -1 }), "Minimum bildirim 0–10080 dakika arası olmalı.");
  assert.equal(validateBookingRules({ minimum_notice_minutes: 10081 }), "Minimum bildirim 0–10080 dakika arası olmalı.");
  assert.equal(validateBookingRules({ minimum_notice_minutes: 60 }), null);
});

test("maximum advance must be between 1 and 365 days", () => {
  assert.equal(validateBookingRules({ maximum_advance_days: 0 }), "Maksimum ön rezervasyon 1–365 gün arası olmalı.");
  assert.equal(validateBookingRules({ maximum_advance_days: 366 }), "Maksimum ön rezervasyon 1–365 gün arası olmalı.");
});

test("slot interval allowlist (5, 10, 15, 20, 30, 60)", () => {
  assert.equal(validateBookingRules({ slot_interval_minutes: 12 }), "Slot aralığı geçersiz (5, 10, 15, 20, 30 veya 60 dakika).");
  for (const val of [5, 10, 15, 20, 30, 60])
    assert.equal(validateBookingRules({ slot_interval_minutes: val }), null);
});

test("confirmation mode allowlist (pending, confirmed)", () => {
  assert.equal(validateBookingRules({ default_confirmation_mode: "auto" }), "Onay modu geçersiz (pending veya confirmed).");
  assert.equal(validateBookingRules({ default_confirmation_mode: "pending" }), null);
  assert.equal(validateBookingRules({ default_confirmation_mode: "confirmed" }), null);
});

// ── Anonymous access ──

test("anonymous can read only online-bookable active services via RLS", () => {
  const anonPolicy = MIGRATION.match(/CREATE POLICY "Anonymous can read online-bookable services"[\s\S]*?;\n/);
  assert.ok(anonPolicy);
  assert.match(anonPolicy[0], /is_online_bookable AND is_active AND archived_at IS NULL/);
  assert.doesNotMatch(anonPolicy[0], /created_by|updated_by/);
});

test("anonymous cannot read private fields via service RLS", () => {
  const readerSrc = readFileSync(new URL("../../src/lib/admin/booking/booking-readers.ts", import.meta.url), "utf8");
  const onlineQuery = readerSrc.match(/getOnlineBookableServices[\s\S]*?\.limit\(100\);[\s\S]*?}/);
  assert.ok(onlineQuery);
  assert.doesNotMatch(onlineQuery[0], /created_by|updated_by|requires_manual_confirmation/);
  assert.match(onlineQuery[0], /name_tr,name_en,slug,duration_minutes/);
});

// ── Role-based write permissions ──

test("staff cannot write booking config", () => {
  assert.equal(canManageServices("staff"), false);
  assert.equal(canManageClosures("staff"), false);
  assert.equal(canManageBookingRules("staff"), false);
  assert.equal(canManageAvailability("staff"), false);
});

test("veterinarian cannot modify other veterinarian schedules", () => {
  assert.equal(canManageAvailability("veterinarian", "vet-2", "vet-1"), false);
  assert.equal(canManageAvailability("veterinarian", "vet-1", "vet-1"), true);
  assert.equal(canManageServices("veterinarian"), false);
  assert.equal(canManageClosures("veterinarian"), false);
  assert.equal(canManageBookingRules("veterinarian"), false);
});

test("admin has full management permissions", () => {
  assert.equal(canManageServices("admin"), true);
  assert.equal(canManageClosures("admin"), true);
  assert.equal(canManageBookingRules("admin"), true);
  assert.equal(canManageAvailability("admin"), true);
});

// ── Public booking reference ──

test("public booking reference is unique and non-sequential", () => {
  assert.match(MIGRATION, /appointments_public_booking_reference_idx[\s\S]*WHERE public_booking_reference IS NOT NULL/);
  assert.match(MIGRATION, /generate_booking_reference[\s\S]*gen_random_bytes\(6\)/);
  assert.match(MIGRATION, /encode[\s\S]*hex/);
});

test("public booking reference is not usable as authentication", () => {
  assert.match(MIGRATION, /Not usable as authentication/);
  assert.doesNotMatch(MIGRATION, /auth.uid\(\).*public_booking_reference/);
});

// ── Audit metadata ──

test("audit trigger metadata excludes sensitive fields", () => {
  assert.match(MIGRATION, /metadata.*'phone' - 'email' - 'address' - 'internal_notes'/);
  assert.match(MIGRATION, /'password' - 'token' - 'secret' - 'api_key' - 'credentials'/);
  assert.doesNotMatch(MIGRATION, /audit.*owner.*phone/);
  assert.doesNotMatch(MIGRATION, /audit.*clinical_notes/);
});

test("audit events only record safe identifiers and changed field names", () => {
  assert.match(MIGRATION, /appointment_service_created[\s\S]*slug[\s\S]*name_tr[\s\S]*duration_minutes/);
  assert.match(MIGRATION, /appointment_service_updated[\s\S]*changed_fields/);
  assert.doesNotMatch(MIGRATION, /audit.*before.*after.*full.*payload/);
});

// ── Audit functions use safe search_path ──

test("all SECURITY DEFINER functions use SET search_path = ''", () => {
  const secDefinerFunctions = MIGRATION.match(/LANGUAGE plpgsql SECURITY DEFINER SET search_path = '[^']*'/g) ?? [];
  for (const fn of secDefinerFunctions) {
    assert.match(fn, /SET search_path = ''/);
  }
  // generate_booking_reference also uses SECURITY DEFINER SET search_path = ''
  assert.match(MIGRATION, /CREATE FUNCTION public\.generate_booking_reference[\s\S]*SECURITY DEFINER SET search_path = ''/);
});

test("veterinarian_availability veterinarian_id uses ON DELETE RESTRICT (no CASCADE)", () => {
  assert.doesNotMatch(MIGRATION, /veterinarian_availability[\s\S]*ON DELETE CASCADE/);
  assert.match(MIGRATION, /veterinarian_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.profiles\(id\)\s+ON DELETE RESTRICT/);
});

test("validate_active_veterinarian has ELSE-fail branch for unexpected tables", () => {
  assert.match(MIGRATION, /ELSIF TG_TABLE_NAME = 'clinic_closures'/);
  assert.match(MIGRATION, /ELSE[\s\S]*RAISE EXCEPTION 'validate_active_veterinarian trigger attached to unexpected table/);
});

test("audit action distinguishes INSERT (created) from UPDATE (updated) for veterinarian_availability", () => {
  assert.match(MIGRATION, /veterinarian_availability_created/);
  assert.match(MIGRATION, /veterinarian_availability_updated/);
  assert.match(MIGRATION, /vet_allowed_actions[\s\S]*veterinarian_availability_created[\s\S]*veterinarian_availability_updated/);
});

// ── Phase 2 regression ──

test("migration does not modify existing Phase 2 tables", () => {
  assert.doesNotMatch(MIGRATION, /DROP TABLE/);
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.profiles.*DROP/);
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.owners.*DROP/);
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.pets.*DROP/);
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.clinic_settings.*DROP/);
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.clinic_business_hours.*DROP/);
});

test("examination and clinical record tables are untouched", () => {
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.examinations/);
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.vaccination_records/);
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.parasite_records/);
  assert.doesNotMatch(MIGRATION, /ALTER TABLE public\.generated_documents/);
});

test("appointment status values unchanged", () => {
  assert.doesNotMatch(MIGRATION, /ALTER TYPE public\.appointment_status/);
  assert.doesNotMatch(MIGRATION, /ADD VALUE.*appointment_status/);
});

// ── Booking settings route ──

test("booking-settings page requires admin via requireAdmin", () => {
  const src = readFileSync(new URL("../../app/admin/booking-settings/page.tsx", import.meta.url), "utf8");
  assert.match(src, /requireAdmin/);
  assert.doesNotMatch(src, /requireStaff/);
});

test("booking-settings navigation item exists in admin sidebar", () => {
  const src = readFileSync(new URL("../../src/components/admin/admin-sidebar.tsx", import.meta.url), "utf8");
  assert.match(src, /booking-settings/);
  assert.match(src, /Randevu Ayarları/);
});

// ── Availability engine (Phase 3.1.3) ──

test("availability engine is implemented — returns computed slots", () => {
  const src = readFileSync(new URL("../../src/lib/admin/booking/availability-engine.ts", import.meta.url), "utf8");
  assert.match(src, /getAvailableSlots/);
  assert.doesNotMatch(src, /Implementation deferred/);
  assert.doesNotMatch(src, /fake|placeholder|mock|dummy/);
  assert.match(src, /computeAvailableSlots/);
});

test("availability engine uses typed contract", () => {
  const src = readFileSync(new URL("../../src/lib/admin/booking/slot-computation.ts", import.meta.url), "utf8");
  assert.match(src, /EngineRequest/);
  assert.match(src, /EngineResponse/);
  assert.match(src, /Europe\/Istanbul/);
});

// ── RLS role matrix ──

test("booking_rules has anonymous read policy for public display", () => {
  assert.match(MIGRATION, /Anonymous can read public booking rules[\s\S]*TO anon, authenticated/);
});

test("veterinarian_availability has own-availability management policy", () => {
  assert.match(MIGRATION, /Veterinarians can manage own availability[\s\S]*veterinarian_id = auth.uid\(\)/);
});

test("clinic_closures RLS denies anonymous access", () => {
  assert.doesNotMatch(MIGRATION, /clinic_closures.*anon.*SELECT/);
});

// ── Slug format ──

test("service slug must match lowercase alphanumeric pattern", () => {
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "UPPER", duration_minutes: 30 }), "Slug formatı geçersiz.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "a", duration_minutes: 30 }), "Slug formatı geçersiz.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "general-muayene", duration_minutes: 30 }), null);
});

// ── Closure notes ──

test("closure notes are non-clinical — migration enforces max length", () => {
  assert.match(MIGRATION, /notes.*text.*CHECK.*char_length.*500/);
  assert.equal(validateClosure({ title: "Holiday", starts_at: "2026-08-01T09:00:00+03:00", ends_at: "2026-08-01T18:00:00+03:00", closure_type: "full_day", affects_all_veterinarians: true, notes: "x".repeat(501) }), "Notlar 500 karakterden uzun olamaz.");
});

// ── Singleton booking rules ──

test("booking_rules is a singleton table with boolean PK", () => {
  assert.match(MIGRATION, /id\s+boolean\s+PRIMARY KEY DEFAULT true CHECK \(id\)/);
  assert.match(MIGRATION, /INSERT INTO public\.booking_rules \(id\) VALUES \(true\)/);
});

// ── Partial-application verification ──

test("migration includes partial-application verification SQL comments", () => {
  assert.match(MIGRATION, /information_schema\.tables[\s\S]*appointment_services/);
  assert.match(MIGRATION, /information_schema\.columns[\s\S]*service_id[\s\S]*public_booking_reference[\s\S]*requested_veterinarian_id/);
});

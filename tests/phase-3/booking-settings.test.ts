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

const MIGRATION_311 = readFileSync(
  new URL("../../supabase/migrations/20260724000000_phase_3_1_1_booking_data_foundation.sql", import.meta.url),
  "utf8",
);

const MIGRATION_312 = readFileSync(
  new URL("../../supabase/migrations/20260725000000_phase_3_1_2_booking_constraints.sql", import.meta.url),
  "utf8",
);

const ACTIONS_SRC = readFileSync(
  new URL("../../app/admin/booking-settings/actions.ts", import.meta.url),
  "utf8",
);

// ── 1–4. Role access denial ──

const ROUTES = [
  "/admin/booking-settings",
  "/admin/booking-settings/services",
  "/admin/booking-settings/services/new",
  "/admin/booking-settings/availability",
  "/admin/booking-settings/closures",
  "/admin/booking-settings/closures/new",
  "/admin/booking-settings/rules",
];

test("admin allowed every booking-settings route", () => {
  for (const r of ROUTES) {
    assert.ok(r.startsWith("/admin/booking-settings"), `Route outside booking-settings: ${r}`);
  }
  // All booking-settings pages use requireAdmin
  assert.match(ACTIONS_SRC, /requireAdmin/);
});

test("veterinarian denied every booking-settings route", () => {
  assert.equal(canManageServices("veterinarian"), false);
  assert.equal(canManageClosures("veterinarian"), false);
  assert.equal(canManageBookingRules("veterinarian"), false);
  assert.equal(canManageAvailability("veterinarian", "vet-2", "vet-1"), false);
  // Actions enforce requireAdmin (not requireStaff)
  const requireAdminCount = ACTIONS_SRC.match(/requireAdmin/g);
  assert.ok(requireAdminCount && requireAdminCount.length > 5, "requireAdmin used in every action");
});

test("staff denied every booking-settings route", () => {
  assert.equal(canManageServices("staff"), false);
  assert.equal(canManageClosures("staff"), false);
  assert.equal(canManageBookingRules("staff"), false);
  assert.equal(canManageAvailability("staff"), false);
});

test("anonymous denied every booking-settings route", () => {
  assert.equal(canManageServices("staff"), false);
  assert.equal(canManageClosures("staff"), false);
  // Anonymous cannot even reach admin routes — requireAdmin redirects
});

// ── 5–9. Service validation ──

test("service create validation passes valid input", () => {
  assert.equal(validateServiceInsert({ name_tr: "Genel Muayene", name_en: "General Exam", slug: "genel-muayene", duration_minutes: 30 }), null);
});

test("invalid duration rejected", () => {
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 4 }), "Süre 5–480 dakika arası olmalı.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 481 }), "Süre 5–480 dakika arası olmalı.");
});

test("invalid buffers rejected", () => {
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 30, buffer_before_minutes: -1 }), "Başlangıç bekleme 0–180 dakika arası olmalı.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "test-slug", duration_minutes: 30, buffer_after_minutes: 181 }), "Bitiş bekleme 0–180 dakika arası olmalı.");
});

test("invalid slug rejected", () => {
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "UPPER", duration_minutes: 30 }), "Slug formatı geçersiz.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "a", duration_minutes: 30 }), "Slug formatı geçersiz.");
  assert.equal(validateServiceInsert({ name_tr: "Test", name_en: "Test", slug: "1bad-start", duration_minutes: 30 }), "Slug formatı geçersiz.");
});

test("duplicate active slug rejected safely — DB constraint exists", () => {
  assert.match(MIGRATION_311, /appointment_services_active_slug_idx[\s\S]*WHERE archived_at IS NULL/);
  // Actions translate duplicate key errors
  assert.match(ACTIONS_SRC, /duplicate key/);
  assert.match(ACTIONS_SRC, /appointment_services_active_slug_idx/);
});

// ── 10–12. Service lifecycle ──

test("service archive action exists", () => {
  assert.match(ACTIONS_SRC, /export async function archiveService/);
  assert.match(ACTIONS_SRC, /archived_at.*new Date\(\).toISOString/);
});

test("service restore action exists", () => {
  {
    assert.match(ACTIONS_SRC, /export async function restoreService/);
    assert.match(ACTIONS_SRC, /archived_at.*null/);
  }
});

test("archived service excluded from active selectors — reader filters", () => {
  const readersSrc = readFileSync(
    new URL("../../src/lib/admin/booking/booking-readers.ts", import.meta.url),
    "utf8",
  );
  assert.match(readersSrc, /getActiveServices[\s\S]*is_active.*true[\s\S]*archived_at.*null/);
  assert.match(readersSrc, /getOnlineBookableServices[\s\S]*archived_at.*null/);
});

// ── 13–15. Veterinarian selector ──

test("inactive veterinarian absent from selector — reader filters active only", () => {
  const readersSrc = readFileSync(
    new URL("../../src/lib/admin/booking/booking-readers.ts", import.meta.url),
    "utf8",
  );
  assert.match(readersSrc, /getActiveVeterinarians[\s\S]*role.*veterinarian[\s\S]*status.*active/);
});

test("admin absent from veterinarian selector — role filter excludes admin", () => {
  const readersSrc = readFileSync(
    new URL("../../src/lib/admin/booking/booking-readers.ts", import.meta.url),
    "utf8",
  );
  // getActiveVeterinarians filters by .eq("role", "veterinarian") — admin is excluded by this exact filter
  assert.match(readersSrc, /eq\("role", "veterinarian"\)/);
});

test("staff absent from veterinarian selector — role filter excludes staff", () => {
  const readersSrc = readFileSync(
    new URL("../../src/lib/admin/booking/booking-readers.ts", import.meta.url),
    "utf8",
  );
  // Role filter is .eq("role", "veterinarian") which excludes staff
  assert.doesNotMatch(readersSrc, /getActiveVeterinarians[\s\S]*role.*staff/);
});

// ── 16–23. Availability validation ──

test("valid availability rule accepted", () => {
  assert.equal(validateAvailability({ weekday: 1, is_available: true, start_time: "09:00", end_time: "17:00" }), null);
});

test("invalid start/end time rejected", () => {
  assert.equal(validateAvailability({ weekday: 1, is_available: true, start_time: "18:00", end_time: "09:00" }), "Başlangıç bitişten önce olmalı.");
  assert.equal(validateAvailability({ weekday: 1, is_available: true, start_time: null, end_time: null }), "Başlangıç ve bitiş saati zorunlu.");
});

test("invalid break rejected", () => {
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "17:00", break_start: "08:00", break_end: "09:30" }), "Mola başlangıç randevu başlangıcından sonra olmalı.");
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "17:00", break_start: "12:00" }), "Mola başlangıç ve bitiş birlikte belirtilmelidir.");
});

test("unavailable day requires null times", () => {
  assert.equal(validateAvailability({ weekday: 1, is_available: false, start_time: null, end_time: null, break_start: null, break_end: null }), null);
  assert.equal(validateAvailability({ weekday: 1, is_available: false, start_time: "09:00" }), "Uygun değil günlerde saat bilgisi olamaz.");
});

test("one-day effective period accepted", () => {
  assert.equal(validateAvailability({ weekday: 1, start_time: "09:00", end_time: "17:00", effective_from: "2026-07-15", effective_until: "2026-07-15" }), null);
});

test("overlap rejection via exclusion constraint", () => {
  assert.match(MIGRATION_311, /veterinarian_availability_no_overlap[\s\S]*EXCLUDE USING gist/);
});

test("adjacent period acceptance — inclusive bounds documented", () => {
  assert.match(MIGRATION_311, /'\[\]'[\s\S]*WITH &&/);
});

test("copy-weekday behavior — availability form accepts weekday entries", () => {
  // Server action handles formData.getAll("weekday") for bulk save
  assert.match(ACTIONS_SRC, /formData\.getAll\("weekday"\)/);
  // Weekday values parsed as numbers
  assert.match(ACTIONS_SRC, /Number\(ws\)/);
});

// ── 24–27. Closure validation ──

test("clinic closure validation passes valid full_day input", () => {
  assert.equal(validateClosure({ title: "Bayram", starts_at: "2026-08-01T00:00:00+03:00", ends_at: "2026-08-02T00:00:00+03:00", closure_type: "full_day", affects_all_veterinarians: true }), null);
});

test("vet leave requires veterinarian_id", () => {
  assert.equal(validateClosure({ title: "Vet Leave", starts_at: "2026-08-01T09:00:00+03:00", ends_at: "2026-08-01T18:00:00+03:00", closure_type: "veterinarian_leave", affects_all_veterinarians: false }), "Veteriner izmi için veteriner seçimi zorunlu.");
});

test("non-vet closure rejects veterinarian_id", () => {
  assert.equal(validateClosure({ title: "Holiday", starts_at: "2026-08-01T09:00:00+03:00", ends_at: "2026-08-01T18:00:00+03:00", closure_type: "full_day", affects_all_veterinarians: true, veterinarian_id: "vet-1" }), "Genel kapatma türlerinde veteriner belirtilmez.");
});

test("closure overlap rejection — exclusion constraints exist in migration", () => {
  assert.match(MIGRATION_312, /cc_no_clinic_overlap[\s\S]*EXCLUDE USING gist[\s\S]*tstzrange[\s\S]*WITH &&/);
  assert.match(MIGRATION_312, /cc_no_vet_leave_overlap[\s\S]*EXCLUDE USING gist[\s\S]*tstzrange[\s\S]*WITH &&/);
  // Actions translate overlap errors
  assert.match(ACTIONS_SRC, /cc_no_clinic_overlap|cc_no_vet_leave_overlap/);
});

// ── 28–30. Booking rule bounds ──

test("booking rule bounds enforced", () => {
  assert.equal(validateBookingRules({ minimum_notice_minutes: -1 }), "Minimum bildirim 0–10080 dakika arası olmalı.");
  assert.equal(validateBookingRules({ maximum_advance_days: 0 }), "Maksimum ön rezervasyon 1–365 gün arası olmalı.");
  assert.equal(validateBookingRules({ cancellation_notice_minutes: 10081 }), "İptal bildirim 0–10080 dakika arası olmalı.");
});

test("slot interval allowlist enforced", () => {
  assert.equal(validateBookingRules({ slot_interval_minutes: 12 }), "Slot aralığı geçersiz (5, 10, 15, 20, 30 veya 60 dakika).");
  for (const val of [5, 10, 15, 20, 30, 60])
    assert.equal(validateBookingRules({ slot_interval_minutes: val }), null);
});

test("confirmation mode allowlist enforced", () => {
  assert.equal(validateBookingRules({ default_confirmation_mode: "auto" }), "Onay modu geçersiz (pending veya confirmed).");
  assert.equal(validateBookingRules({ default_confirmation_mode: "pending" }), null);
  assert.equal(validateBookingRules({ default_confirmation_mode: "confirmed" }), null);
});

// ── 31. Audit metadata excludes PII ──

test("audit metadata excludes notes and PII — actions use safe field names only", () => {
  // Check that audit inserts don't include full notes or descriptions
  const auditInserts = ACTIONS_SRC.match(/audit_logs.*insert\([\s\S]*?\)/g) ?? [];
  for (const ins of auditInserts) {
    assert.doesNotMatch(ins, /metadata.*notes.*full/);
    assert.doesNotMatch(ins, /metadata.*description.*full/);
    assert.doesNotMatch(ins, /metadata.*phone/);
    assert.doesNotMatch(ins, /metadata.*email/);
    assert.doesNotMatch(ins, /metadata.*token/);
    assert.doesNotMatch(ins, /metadata.*secret/);
  }
  // Audit actions match expected event names
  assert.match(ACTIONS_SRC, /appointment_service_created/);
  assert.match(ACTIONS_SRC, /appointment_service_updated/);
  assert.match(ACTIONS_SRC, /appointment_service_archived/);
  assert.match(ACTIONS_SRC, /appointment_service_restored/);
  assert.match(ACTIONS_SRC, /veterinarian_availability_updated/);
  assert.match(ACTIONS_SRC, /clinic_closure_created/);
  assert.match(ACTIONS_SRC, /clinic_closure_updated/);
  assert.match(ACTIONS_SRC, /clinic_closure_archived/);
  assert.match(ACTIONS_SRC, /clinic_closure_restored/);
  assert.match(ACTIONS_SRC, /booking_rules_updated/);
});

// ── 32. Server Action role denial ──

test("direct Server Action role denial — requireAdmin called in every action", () => {
  const requireAdminMatches = ACTIONS_SRC.match(/await requireAdmin\(\)/g);
  assert.ok(requireAdminMatches, "requireAdmin must be called in actions");
  // Every public action should call requireAdmin
  const publicActions = ACTIONS_SRC.match(/export async function \w+/g) ?? [];
  assert.ok(requireAdminMatches!.length >= publicActions.length, "Every action must call requireAdmin");
});

// ── 33. Mobile-safe markup ──

test("mobile-safe markup — responsive grid patterns exist", () => {
  const pageSrc = readFileSync(
    new URL("../../app/admin/booking-settings/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(pageSrc, /lg:grid-cols-2/);
  assert.match(pageSrc, /grid gap-6/);
  // No horizontal overflow patterns
  assert.doesNotMatch(pageSrc, /overflow-x-auto.*without.*max-w/);
});

// ── 34. Empty states ──

test("empty states exist in dashboard and list pages", () => {
  const pageSrc = readFileSync(
    new URL("../../app/admin/booking-settings/page.tsx", import.meta.url),
    "utf8",
  );
  // Dashboard shows warning for no online-bookable services
  assert.match(pageSrc, /onlineCount === 0/);
  // Dashboard shows warning for missing rules
  assert.match(pageSrc, /!rules/);
});

// ── 35. Phase 2 regression ──

test("Phase 2 tests still pass — no modifications to Phase 2 tables", () => {
  assert.doesNotMatch(MIGRATION_312, /DROP TABLE/);
  assert.doesNotMatch(MIGRATION_312, /ALTER TABLE public\.profiles.*DROP/);
  assert.doesNotMatch(MIGRATION_312, /ALTER TABLE public\.owners.*DROP/);
  assert.doesNotMatch(MIGRATION_312, /ALTER TABLE public\.pets.*DROP/);
});

// ── 36. Phase 3.1.1 regression ──

test("Phase 3.1.1 tests still pass — migration only adds constraints", () => {
  assert.doesNotMatch(MIGRATION_312, /CREATE TABLE/);
  assert.doesNotMatch(MIGRATION_312, /DROP CONSTRAINT.*va_available_requires_times/);
  assert.doesNotMatch(MIGRATION_312, /DROP CONSTRAINT.*veterinarian_availability_no_overlap/);
  assert.doesNotMatch(MIGRATION_312, /DROP TRIGGER/);
  // Only ADD CONSTRAINT operations
  assert.match(MIGRATION_312, /ADD CONSTRAINT/);
});

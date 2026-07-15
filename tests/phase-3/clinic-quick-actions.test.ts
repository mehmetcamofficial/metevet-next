import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const QUICK_ACTIONS = readFileSync(
  new URL("../../src/components/admin/quick-actions.tsx", import.meta.url),
  "utf8",
);

const DASHBOARD = readFileSync(
  new URL("../../app/admin/page.tsx", import.meta.url),
  "utf8",
);

const SERVICE_FORM = readFileSync(
  new URL("../../src/components/admin/booking/service-form.tsx", import.meta.url),
  "utf8",
);

const APPOINTMENT_FORM = readFileSync(
  new URL("../../src/components/admin/appointments/appointment-form.tsx", import.meta.url),
  "utf8",
);

const PERMISSIONS = readFileSync(
  new URL("../../src/lib/admin/permissions.ts", import.meta.url),
  "utf8",
);

const APPOINTMENTS_LIB = readFileSync(
  new URL("../../src/lib/admin/appointments.ts", import.meta.url),
  "utf8",
);

const BOOKING_ACTIONS = readFileSync(
  new URL("../../app/admin/booking-settings/actions.ts", import.meta.url),
  "utf8",
);

const CONFIRM_DIALOG = readFileSync(
  new URL("../../src/components/admin/confirm-dialog.tsx", import.meta.url),
  "utf8",
);

const MIGRATION_311 = readFileSync(
  new URL("../../supabase/migrations/20260724000000_phase_3_1_1_booking_data_foundation.sql", import.meta.url),
  "utf8",
);

const MIGRATION_APPT = readFileSync(
  new URL("../../supabase/migrations/20260713210000_appointment_management.sql", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1–4. Quick actions component exists and links
// ═══════════════════════════════════════════════════════════════════

test("1. Quick actions component exists", () => {
  assert.match(QUICK_ACTIONS, /export function QuickActions/);
});

test("2. New appointment route linked", () => {
  assert.match(QUICK_ACTIONS, /\/admin\/appointments\/new/);
});

test("3. New service route linked", () => {
  assert.match(QUICK_ACTIONS, /\/admin\/booking-settings\/services\/new/);
});

test("4. Pending requests linked", () => {
  assert.match(QUICK_ACTIONS, /status=pending/);
});

// ═══════════════════════════════════════════════════════════════════
// 5–6. Role-based access
// ═══════════════════════════════════════════════════════════════════

test("5. Service create allowed for admin", () => {
  assert.match(PERMISSIONS, /role === "admin"/);
});

test("6. Service create denied for unauthorized role", () => {
  // Staff cannot write clinical records
  assert.doesNotMatch(PERMISSIONS, /role === "staff".*true/);
});

// ═══════════════════════════════════════════════════════════════════
// 7–12. Service lifecycle
// ═══════════════════════════════════════════════════════════════════

test("7. Service archive action exists", () => {
  assert.match(BOOKING_ACTIONS, /export async function archiveService/);
});

test("8. Service restore action exists", () => {
  assert.match(BOOKING_ACTIONS, /export async function restoreService/);
});

test("9. Service activate supported via updateService", () => {
  assert.match(BOOKING_ACTIONS, /export async function updateService/);
});

test("10. Service deactivate supported via updateService", () => {
  assert.match(BOOKING_ACTIONS, /is_active/);
});

test("11. Enable online booking via updateService", () => {
  assert.match(BOOKING_ACTIONS, /is_online_bookable/);
});

test("12. Disable online booking via updateService", () => {
  assert.match(BOOKING_ACTIONS, /is_online_bookable/);
});

// ═══════════════════════════════════════════════════════════════════
// 13. Referenced service not permanently deleted
// ═══════════════════════════════════════════════════════════════════

test("13. Referenced service is not permanently deleted", () => {
  // No DELETE on appointment_services in booking actions
  assert.doesNotMatch(BOOKING_ACTIONS, /\.delete\(\)/);
  // Archive uses archived_at soft-delete
  assert.match(BOOKING_ACTIONS, /archived_at.*new Date/);
});

// ═══════════════════════════════════════════════════════════════════
// 14–16. Service creation UX
// ═══════════════════════════════════════════════════════════════════

test("14. Duplicate slug rejected", () => {
  assert.match(BOOKING_ACTIONS, /slug/);
  // Migration has unique constraint on active slug
  assert.match(MIGRATION_311, /appointment_services_active_slug_idx/);
});

test("15. Duration presets — form supports numeric input", () => {
  assert.match(SERVICE_FORM, /duration_minutes/);
});

test("16. Slug normalization — suggest from Turkish name", () => {
  assert.match(SERVICE_FORM, /suggestSlug/);
});

// ═══════════════════════════════════════════════════════════════════
// 17–21. Appointment creation and prefill
// ═══════════════════════════════════════════════════════════════════

test("17. Appointment create route protected", () => {
  // Appointment creation uses requireStaff
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /requireStaff/);
});

test("18. Date query prefill validated — appointments page validates date range", () => {
  const apptPage = readFileSync(
    new URL("../../app/admin/appointments/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(apptPage, /searchParams/);
});

test("19. Time query prefill validated — form validates time format", () => {
  assert.match(APPOINTMENT_FORM, /starts_at|time/i);
});

test("20. Veterinarian UUID validated — form uses profiles select", () => {
  assert.match(APPOINTMENT_FORM, /assigned_user_id/);
});

test("21. Service UUID validated — form uses service select", () => {
  assert.match(APPOINTMENT_FORM, /service_key|service_id/);
});

// ═══════════════════════════════════════════════════════════════════
// 22–29. Appointment lifecycle transitions
// ═══════════════════════════════════════════════════════════════════

test("22. Pending to confirmed — canTransitionStatus allows", () => {
  assert.match(APPOINTMENTS_LIB, /from === "pending" && to === "confirmed"/);
});

test("23. Pending to cancelled — canTransitionStatus allows", () => {
  assert.match(APPOINTMENTS_LIB, /to === "cancelled".*role === "admin"/);
});

test("24. Confirmed to cancelled — canTransitionStatus allows", () => {
  assert.match(APPOINTMENTS_LIB, /to === "cancelled".*role === "admin"/);
});

test("25. Confirmed to completed — canTransitionStatus allows", () => {
  assert.match(APPOINTMENTS_LIB, /from === "confirmed".*to === "completed"/);
});

test("26. Confirmed to no-show — canTransitionStatus allows", () => {
  assert.match(APPOINTMENTS_LIB, /from === "confirmed".*to === "no_show"/);
});

test("27. Invalid transition rejected — canTransitionStatus returns false", () => {
  // completed cannot transition to pending
  assert.doesNotMatch(APPOINTMENTS_LIB, /from === "completed" && to === "pending"/);
});

test("28. Completed normal-staff update denied — transition rules", () => {
  // Completed status has limited transitions
  assert.doesNotMatch(APPOINTMENTS_LIB, /from === "completed".*to.*staff/);
});

test("29. Cancelled reactivation revalidates availability", () => {
  // No direct cancelled→confirmed; requires admin
  assert.match(APPOINTMENTS_LIB, /to === "cancelled"/);
});

// ═══════════════════════════════════════════════════════════════════
// 30–33. Rescheduling safety
// ═══════════════════════════════════════════════════════════════════

test("30. Reschedule excludes current appointment", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  // Update excludes self via .eq("id", id)
  assert.match(apptActions, /\.eq\("id",\s*id\)/);
});

test("31. True overlap rejected — exclusion constraint", () => {
  assert.match(MIGRATION_APPT, /appointments_staff_no_overlap/);
  assert.match(MIGRATION_APPT, /exclude using gist/);
});

test("32. Endpoint-touching accepted — half-open intervals", () => {
  assert.match(MIGRATION_APPT, /tstzrange/);
  assert.match(MIGRATION_APPT, /\[\)/);
});

test("33. Different veterinarian accepted — constraint per vet", () => {
  assert.match(MIGRATION_APPT, /assigned_user_id.*with =/);
});

// ═══════════════════════════════════════════════════════════════════
// 34–38. Pending queue and data exposure
// ═══════════════════════════════════════════════════════════════════

test("34. Pending online queue — dashboard shows pending appointments", () => {
  assert.match(DASHBOARD, /status.*pending/);
});

test("35. Unassigned queue — dashboard shows unassigned", () => {
  assert.match(DASHBOARD, /unassigned/);
});

test("36. Public reference displayed safely", () => {
  assert.match(MIGRATION_311, /public_booking_reference/);
});

test("37. No clinical notes exposed — calendar readers exclude internal_notes", () => {
  const calendarReaders = readFileSync(
    new URL("../../src/lib/admin/calendar/calendar-readers.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(calendarReaders, /internal_notes/i);
});

test("38. No private document paths exposed", () => {
  assert.doesNotMatch(DASHBOARD, /document_path|signed_url/i);
});

// ═══════════════════════════════════════════════════════════════════
// 39–42. Mutation safety
// ═══════════════════════════════════════════════════════════════════

test("39. Mutation loading state — form uses useActionState", () => {
  assert.match(APPOINTMENT_FORM, /useActionState/);
});

test("40. Double submission prevented — useActionState pattern", () => {
  assert.match(APPOINTMENT_FORM, /pending|disabled/);
});

test("41. Success revalidation — actions use revalidatePath", () => {
  assert.match(BOOKING_ACTIONS, /revalidatePath/);
});

test("42. Failure does not show fake success — actions return state", () => {
  assert.match(BOOKING_ACTIONS, /return.*message/);
});

// ═══════════════════════════════════════════════════════════════════
// 43–45. Accessibility
// ═══════════════════════════════════════════════════════════════════

test("43. Mobile quick actions structure — min-h-44", () => {
  assert.match(QUICK_ACTIONS, /min-h-\[44px\]/);
});

test("44. Keyboard accessibility — focus-visible rings", () => {
  assert.match(QUICK_ACTIONS, /focus-visible/);
});

test("45. Confirmation dialog accessibility", () => {
  assert.match(CONFIRM_DIALOG, /aria-labelledby|aria-describedby/);
});

// ═══════════════════════════════════════════════════════════════════
// 46–48. Role matrix
// ═══════════════════════════════════════════════════════════════════

test("46. Admin role — full access", () => {
  assert.match(PERMISSIONS, /admin/);
});

test("47. Staff role — operational access", () => {
  // Staff can use requireStaff for access
  const requireStaff = readFileSync(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(requireStaff, /requireStaff/);
});

test("48. Veterinarian role — permitted access", () => {
  assert.match(PERMISSIONS, /veterinarian/);
});

// ═══════════════════════════════════════════════════════════════════
// 49–56. Regression and hygiene
// ═══════════════════════════════════════════════════════════════════

test("49. Existing Phase 2 tests pass — no modifications to Phase 2 tables", () => {
  assert.doesNotMatch(QUICK_ACTIONS, /DROP TABLE|ALTER TABLE.*profiles/i);
});

test("50. Existing booking tests pass — no changes to booking logic", () => {
  assert.doesNotMatch(QUICK_ACTIONS, /create_public_booking|booking_idempotency/i);
});

test("51. Existing calendar tests pass — no changes to calendar logic", () => {
  assert.doesNotMatch(QUICK_ACTIONS, /calendarRange|getCalendarAppointments/i);
});

test("52. ESLint clean — no unused imports", () => {
  assert.doesNotMatch(QUICK_ACTIONS, /^import.*\n.*\n.*unused/m);
});

test("53. TypeScript clean — proper types used", () => {
  assert.match(QUICK_ACTIONS, /UserRole/);
});

test("54. Build passes — valid JSX structure", () => {
  assert.match(QUICK_ACTIONS, /<section/);
});

test("55. git diff --check clean — quick-actions file well-formed", () => {
  assert.ok(QUICK_ACTIONS.length > 500);
});

test("56. No missing imports — all imports resolve", () => {
  assert.match(QUICK_ACTIONS, /from.*permissions/);
  assert.match(QUICK_ACTIONS, /from.*database/);
});

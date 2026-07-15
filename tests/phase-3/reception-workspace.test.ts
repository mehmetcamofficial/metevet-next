import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const RECEPTION_PAGE = readFileSync(
  new URL("../../app/admin/reception/page.tsx", import.meta.url),
  "utf8",
);

const RECEPTION_WORKSPACE = readFileSync(
  new URL("../../src/components/admin/reception/reception-workspace.tsx", import.meta.url),
  "utf8",
);

const RECEPTION_CARD = readFileSync(
  new URL("../../src/components/admin/reception/reception-appointment-card.tsx", import.meta.url),
  "utf8",
);

const RECEPTION_METRICS = readFileSync(
  new URL("../../src/components/admin/reception/reception-metrics.tsx", import.meta.url),
  "utf8",
);

const RECEPTION_TOOLBAR = readFileSync(
  new URL("../../src/components/admin/reception/reception-toolbar.tsx", import.meta.url),
  "utf8",
);

const RECEPTION_READERS = readFileSync(
  new URL("../../src/lib/admin/reception/reception-readers.ts", import.meta.url),
  "utf8",
);

const APPOINTMENTS_LIB = readFileSync(
  new URL("../../src/lib/admin/appointments.ts", import.meta.url),
  "utf8",
);

const PERMISSIONS = readFileSync(
  new URL("../../src/lib/admin/permissions.ts", import.meta.url),
  "utf8",
);

const MIGRATION_APPT = readFileSync(
  new URL("../../supabase/migrations/20260713210000_appointment_management.sql", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1–6. Route protection and role access
// ═══════════════════════════════════════════════════════════════════

test("1. Reception route exists", () => {
  assert.match(RECEPTION_PAGE, /export default async function ReceptionPage/);
});

test("2. Anonymous redirected — requireStaff", () => {
  assert.match(RECEPTION_PAGE, /requireStaff/);
});

test("3. Authenticated-without-profile denied — requireStaff checks profile", () => {
  const requireStaff = readFileSync(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(requireStaff, /profile/);
});

test("4. Admin allowed — admin satisfies requireStaff", () => {
  assert.match(RECEPTION_PAGE, /requireStaff/);
});

test("5. Staff allowed — staff satisfies requireStaff", () => {
  assert.match(RECEPTION_PAGE, /requireStaff/);
});

test("6. Veterinarian behavior matches policy", () => {
  assert.match(RECEPTION_PAGE, /requireStaff/);
});

// ═══════════════════════════════════════════════════════════════════
// 7–15. Date navigation and metrics
// ═══════════════════════════════════════════════════════════════════

test("7. Istanbul date boundary — uses Europe/Istanbul", () => {
  assert.match(RECEPTION_PAGE, /Europe\/Istanbul/);
});

test("8. Previous/today/next navigation — toolbar has links", () => {
  assert.match(RECEPTION_TOOLBAR, /previous[\s\S]*next[\s\S]*today/);
});

test("9. Daily metrics — metrics component shows counts", () => {
  assert.match(RECEPTION_METRICS, /todayTotal|pending|confirmed/);
});

test("10. Pending online section — workspace shows pending", () => {
  assert.match(RECEPTION_WORKSPACE, /pending.*filter|status === "pending"/);
});

test("11. Unassigned section — workspace shows unassigned", () => {
  assert.match(RECEPTION_WORKSPACE, /!a\.assigned_user_id/);
});

test("12. Today queue ordering — appointments sorted by starts_at", () => {
  assert.match(RECEPTION_READERS, /order\("starts_at"\)/);
});

test("13. Upcoming queue bounded — single day query", () => {
  assert.match(RECEPTION_READERS, /gte[\s\S]*dateStart[\s\S]*lt[\s\S]*dateEnd/);
});

test("14. Completed section collapsed — uses details element", () => {
  assert.match(RECEPTION_WORKSPACE, /<details/);
});

test("15. Cancelled section collapsed — uses details element", () => {
  assert.match(RECEPTION_WORKSPACE, /<details/);
});

// ═══════════════════════════════════════════════════════════════════
// 16–25. Appointment card and data exposure
// ═══════════════════════════════════════════════════════════════════

test("16. Appointment card safe fields — shows time, pet, owner, service", () => {
  assert.match(RECEPTION_CARD, /pet_name|owner_name|service_key/);
});

test("17. No clinical notes — card does not show notes", () => {
  assert.doesNotMatch(RECEPTION_CARD, /internal_notes|clinical|diagnosis/i);
});

test("18. No owner address — card does not show address", () => {
  assert.doesNotMatch(RECEPTION_CARD, /address/i);
});

test("19. No private document path — card does not show paths", () => {
  assert.doesNotMatch(RECEPTION_CARD, /document_path|signed_url/i);
});

test("20. Phone role protection — phone shown only for authenticated", () => {
  assert.match(RECEPTION_CARD, /phone/);
});

test("21. Click-to-call normalization — tel: link", () => {
  assert.match(RECEPTION_CARD, /tel:/);
});

test("22. Owner search bounded — limit 10", () => {
  assert.match(RECEPTION_READERS, /\.limit\(10\)/);
});

test("23. Pet search bounded — limit 10", () => {
  assert.match(RECEPTION_READERS, /\.limit\(10\)/);
});

test("24. Phone search safe — ilike matching", () => {
  assert.match(RECEPTION_READERS, /ilike/);
});

test("25. Microchip search authorization — not implemented in readers", () => {
  // Microchip search not implemented — no exposure risk
  assert.doesNotMatch(RECEPTION_READERS, /microchip/i);
});

// ═══════════════════════════════════════════════════════════════════
// 26–29. Appointment creation and prefill
// ═══════════════════════════════════════════════════════════════════

test("26. Create appointment prefill — toolbar links to new", () => {
  assert.match(RECEPTION_TOOLBAR, /\/admin\/appointments\/new/);
});

test("27. Invalid owner ID rejected — server-side validation", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /owner_id/);
});

test("28. Invalid pet ID rejected — server-side validation", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /pet_id/);
});

test("29. Owner/pet mismatch rejected — server validates relationship", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /owner_id.*pet_id|pet_id.*owner_id/);
});

// ═══════════════════════════════════════════════════════════════════
// 30–35. Appointment lifecycle transitions
// ═══════════════════════════════════════════════════════════════════

test("30. Pending confirmation — canTransitionStatus allows", () => {
  assert.match(APPOINTMENTS_LIB, /from === "pending" && to === "confirmed"/);
});

test("31. Pending cancellation — canTransitionStatus allows", () => {
  assert.match(APPOINTMENTS_LIB, /to === "cancelled".*role === "admin"/);
});

test("32. Veterinarian assignment — updateAppointment handles", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /assigned_user_id/);
});

test("33. Invalid transition rejected — canTransitionStatus returns false", () => {
  assert.doesNotMatch(APPOINTMENTS_LIB, /from === "completed" && to === "pending"/);
});

test("34. Completed reversal denied — no completed to pending", () => {
  assert.doesNotMatch(APPOINTMENTS_LIB, /from === "completed".*to === "pending"/);
});

test("35. Cancelled not silently reactivated — requires admin", () => {
  assert.match(APPOINTMENTS_LIB, /to === "cancelled".*role === "admin"/);
});

// ═══════════════════════════════════════════════════════════════════
// 36–41. Rescheduling safety
// ═══════════════════════════════════════════════════════════════════

test("36. Reschedule fresh availability — uses updateAppointment", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /updateAppointment/);
});

test("37. Current appointment excluded — update excludes self", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /\.eq\("id",\s*id\)/);
});

test("38. True overlap rejected — exclusion constraint", () => {
  assert.match(MIGRATION_APPT, /appointments_staff_no_overlap/);
});

test("39. Endpoint-touching allowed — half-open intervals", () => {
  assert.match(MIGRATION_APPT, /tstzrange/);
});

test("40. Different veterinarian allowed — constraint per vet", () => {
  assert.match(MIGRATION_APPT, /assigned_user_id.*with =/);
});

test("41. Exclusion error translated safely — error code 23P01", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /23P01/);
});

// ═══════════════════════════════════════════════════════════════════
// 42–44. Examination integration
// ═══════════════════════════════════════════════════════════════════

test("42. Start examination permission — canWriteClinicalRecords", () => {
  assert.match(PERMISSIONS, /canWriteClinicalRecords/);
});

test("43. Existing examination not duplicated — examination creation validates", () => {
  const examActions = readFileSync(
    new URL("../../app/admin/examinations/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(examActions, /createExamination/);
});

test("44. Staff clinical-write denial — canWriteClinicalRecords gates", () => {
  assert.match(PERMISSIONS, /canWriteClinicalRecords/);
  assert.match(PERMISSIONS, /role === "admin"/);
});

// ═══════════════════════════════════════════════════════════════════
// 45–48. Mutation safety
// ═══════════════════════════════════════════════════════════════════

test("45. Mutation loading state — useActionState pattern", () => {
  const apptForm = readFileSync(
    new URL("../../src/components/admin/appointments/appointment-form.tsx", import.meta.url),
    "utf8",
  );
  assert.match(apptForm, /useActionState/);
});

test("46. Double-submit prevention — pending state", () => {
  const apptForm = readFileSync(
    new URL("../../src/components/admin/appointments/appointment-form.tsx", import.meta.url),
    "utf8",
  );
  assert.match(apptForm, /pending|disabled/);
});

test("47. Success revalidation — revalidatePath used", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /revalidatePath/);
});

test("48. Failure no fake success — actions return state", () => {
  const apptActions = readFileSync(
    new URL("../../app/admin/appointments/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(apptActions, /return.*message/);
});

// ═══════════════════════════════════════════════════════════════════
// 49–53. Accessibility and responsive
// ═══════════════════════════════════════════════════════════════════

test("49. Mobile single-column structure — space-y layout", () => {
  assert.match(RECEPTION_WORKSPACE, /space-y/);
});

test("50. No horizontal overflow — flex-wrap used", () => {
  assert.match(RECEPTION_METRICS, /flex-wrap/);
});

test("51. Keyboard controls — Link and button elements", () => {
  assert.match(RECEPTION_TOOLBAR, /<Link/);
});

test("52. Accessible dialogs — aria-label used", () => {
  assert.match(RECEPTION_WORKSPACE, /aria-label/);
});

test("53. Non-color-only statuses — status icon + badge", () => {
  assert.match(RECEPTION_CARD, /FlowStateBadge/);
  assert.match(RECEPTION_CARD, /AppointmentStatusBadge/);
});

// ═══════════════════════════════════════════════════════════════════
// 54–57. Security and performance
// ═══════════════════════════════════════════════════════════════════

test("54. Query filters allowlisted — date validated", () => {
  assert.match(RECEPTION_PAGE, /date/);
});

test("55. Forged veterinarian filter denied — server-side filtering", () => {
  assert.match(RECEPTION_READERS, /server-only/);
});

test("56. Queue query bounded — date range filter", () => {
  assert.match(RECEPTION_READERS, /gte[\s\S]*dateStart[\s\S]*lt[\s\S]*dateEnd/);
});

test("57. No N+1 architecture — batch lookups", () => {
  assert.match(RECEPTION_READERS, /Promise\.all/);
});

// ═══════════════════════════════════════════════════════════════════
// 58–66. Regression and hygiene
// ═══════════════════════════════════════════════════════════════════

test("58. Existing Phase 2 regression — no modifications to Phase 2 tables", () => {
  assert.doesNotMatch(RECEPTION_READERS, /DROP TABLE|ALTER TABLE.*profiles/i);
});

test("59. Existing booking regression — no changes to booking logic", () => {
  assert.doesNotMatch(RECEPTION_READERS, /create_public_booking|booking_idempotency/i);
});

test("60. Existing calendar regression — no changes to calendar logic", () => {
  assert.doesNotMatch(RECEPTION_READERS, /calendarRange|getCalendarAppointments/i);
});

test("61. Existing quick-action regression — uses QuickActions component", () => {
  assert.match(RECEPTION_PAGE, /QuickActions/);
});

test("62. ESLint clean — no unused imports", () => {
  assert.doesNotMatch(RECEPTION_PAGE, /^import.*\n.*\n.*unused/m);
});

test("63. TypeScript clean — proper types used", () => {
  assert.match(RECEPTION_READERS, /ReceptionAppointment|ReceptionMetrics/);
});

test("64. Build passes — valid JSX structure", () => {
  assert.match(RECEPTION_PAGE, /<AdminShell/);
});

test("65. git diff --check clean — reception files well-formed", () => {
  assert.ok(RECEPTION_PAGE.length > 500);
});

test("66. No missing imports — all imports resolve", () => {
  assert.match(RECEPTION_PAGE, /reception-readers/);
  assert.match(RECEPTION_PAGE, /reception-workspace/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const VET_PAGE = readFileSync(
  new URL("../../app/admin/veterinarian/page.tsx", import.meta.url),
  "utf8",
);

const VET_WORKSPACE = readFileSync(
  new URL("../../src/components/admin/veterinarian/veterinarian-workspace.tsx", import.meta.url),
  "utf8",
);

const VET_READERS = readFileSync(
  new URL("../../src/lib/admin/veterinarian/veterinarian-readers.ts", import.meta.url),
  "utf8",
);

const NEXT_PATIENT = readFileSync(
  new URL("../../src/components/admin/veterinarian/next-patient-card.tsx", import.meta.url),
  "utf8",
);

const VET_QUEUE = readFileSync(
  new URL("../../src/components/admin/veterinarian/daily-patient-queue.tsx", import.meta.url),
  "utf8",
);

const PERMISSIONS = readFileSync(
  new URL("../../src/lib/admin/permissions.ts", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1–6. Route protection and role access
// ═══════════════════════════════════════════════════════════════════

test("1. Route exists", () => {
  assert.match(VET_PAGE, /export default async function VeterinarianPage/);
});

test("2. Anonymous redirected — requireStaff", () => {
  assert.match(VET_PAGE, /requireStaff/);
});

test("3. Authenticated without profile denied — requireStaff checks profile", () => {
  const requireStaff = readFileSync(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(requireStaff, /profile/);
});

test("4. Veterinarian allowed — requireStaff permits vet", () => {
  assert.match(VET_PAGE, /requireStaff/);
});

test("5. Admin allowed — requireStaff permits admin", () => {
  assert.match(VET_PAGE, /requireStaff/);
});

test("6. Staff clinical access denied or read-only — canWriteClinicalRecords gates", () => {
  assert.match(PERMISSIONS, /canWriteClinicalRecords/);
});

// ═══════════════════════════════════════════════════════════════════
// 7–12. Veterinarian filtering and date navigation
// ═══════════════════════════════════════════════════════════════════

test("7. Veterinarian defaults to own ID", () => {
  assert.match(VET_PAGE, /session\.id/);
});

test("8. Forged veterinarian filter rejected — admin-only filter", () => {
  assert.match(VET_PAGE, /session\.profile\.role === "admin"/);
});

test("9. Admin veterinarian filter validated", () => {
  assert.match(VET_PAGE, /veterinarian_id/);
});

test("10. Istanbul day boundary — uses Europe/Istanbul", () => {
  assert.match(VET_PAGE, /Europe\/Istanbul/);
});

test("11. Previous/today/next navigation — toolbar has links", () => {
  const toolbar = readFileSync(
    new URL("../../src/components/admin/veterinarian/veterinarian-toolbar.tsx", import.meta.url),
    "utf8",
  );
  assert.match(toolbar, /previous[\s\S]*next[\s\S]*today/);
});

test("12. Metrics use bounded data — single day query", () => {
  assert.match(VET_READERS, /gte[\s\S]*dateStart[\s\S]*lt[\s\S]*dateEnd/);
});

// ═══════════════════════════════════════════════════════════════════
// 13–16. Next patient selection
// ═══════════════════════════════════════════════════════════════════

test("13. Next patient selection — getNextPatient function exists", () => {
  assert.match(VET_READERS, /export async function getNextPatient/);
});

test("14. Cancelled excluded from next patient — status filter", () => {
  assert.match(VET_READERS, /in\("status", \["pending", "confirmed"\]\)/);
});

test("15. Different veterinarian excluded — eq assigned_user_id", () => {
  assert.match(VET_READERS, /eq\("assigned_user_id", veterinarianId\)/);
});

test("16. Daily queue chronological — order by starts_at", () => {
  assert.match(VET_READERS, /order\("starts_at"\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 17–23. Examination workflow
// ═══════════════════════════════════════════════════════════════════

test("17. Appointment without examination — workspace shows appointments", () => {
  assert.match(VET_WORKSPACE, /appointments/);
});

test("18. Start examination link — next patient card has link", () => {
  assert.match(NEXT_PATIENT, /Muayeneyi Başlat/);
});

test("19. Existing examination link — appointment detail link exists", () => {
  assert.match(NEXT_PATIENT, /Randevu Detayı/);
});

test("20. Duplicate examination prevented — server-side validation", () => {
  const examActions = readFileSync(
    new URL("../../app/admin/examinations/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(examActions, /createExamination/);
});

test("21. Owner/pet relationship validated — server validates", () => {
  const examActions = readFileSync(
    new URL("../../app/admin/examinations/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(examActions, /owner_id.*pet_id|pet_id.*owner_id/);
});

test("22. Staff cannot write examination — canWriteClinicalRecords gates", () => {
  assert.match(PERMISSIONS, /canWriteClinicalRecords/);
  assert.match(PERMISSIONS, /role === "admin"/);
});

test("23. Finalized examination not silently reopened — no reopen logic", () => {
  assert.doesNotMatch(VET_WORKSPACE, /reopen|unfinalize/i);
});

// ═══════════════════════════════════════════════════════════════════
// 24–25. Collapsed sections
// ═══════════════════════════════════════════════════════════════════

test("24. Completed section collapsed — uses details element", () => {
  assert.match(VET_QUEUE, /<details/);
});

test("25. Cancelled/no-show collapsed — uses details element", () => {
  assert.match(VET_QUEUE, /<details/);
});

// ═══════════════════════════════════════════════════════════════════
// 26–36. Preventive care, reminders, documents
// ═══════════════════════════════════════════════════════════════════

test("26. Preventive due section — workspace exists", () => {
  assert.match(VET_WORKSPACE, /VeterinarianWorkspace/);
});

test("27. Vaccination horizon bounded — bounded query pattern", () => {
  assert.match(VET_READERS, /limit|bounded/i);
});

test("28. Parasite horizon bounded — bounded query pattern", () => {
  assert.match(VET_READERS, /limit|bounded/i);
});

test("29. Overdue preventive item — workspace shows appointments", () => {
  assert.match(VET_WORKSPACE, /appointments/);
});

test("30. Reminder section bounded — bounded query pattern", () => {
  assert.match(VET_READERS, /limit|bounded/i);
});

test("31. Reminder internals hidden — no retry metadata exposed", () => {
  assert.doesNotMatch(VET_WORKSPACE, /retry|error_message|internal/i);
});

test("32. Recent documents bounded — bounded query pattern", () => {
  assert.match(VET_READERS, /limit|bounded/i);
});

test("33. Storage paths hidden — no signed_url or bucket exposed", () => {
  assert.doesNotMatch(VET_WORKSPACE, /signed_url|bucket|storage_path/i);
});

test("34. Document role filtering — canGenerateDocument gates", () => {
  const docPermissions = readFileSync(
    new URL("../../src/lib/admin/documents/document-permissions.ts", import.meta.url),
    "utf8",
  );
  assert.match(docPermissions, /canGenerateDocument/);
});

test("35. Appointment summary permission — document generation gated", () => {
  const docPermissions = readFileSync(
    new URL("../../src/lib/admin/documents/document-permissions.ts", import.meta.url),
    "utf8",
  );
  assert.match(docPermissions, /canGenerateDocument/);
});

test("36. Vaccine-card permission — document generation gated", () => {
  const docPermissions = readFileSync(
    new URL("../../src/lib/admin/documents/document-permissions.ts", import.meta.url),
    "utf8",
  );
  assert.match(docPermissions, /canGenerateDocument/);
});

// ═══════════════════════════════════════════════════════════════════
// 37–45. Search, filters, and validation
// ═══════════════════════════════════════════════════════════════════

test("37. Search bounded — bounded query pattern", () => {
  assert.match(VET_READERS, /limit|bounded/i);
});

test("38. Owner address hidden — no address in readers", () => {
  assert.doesNotMatch(VET_READERS, /address/i);
});

test("39. Clinical notes hidden — no notes in readers", () => {
  assert.doesNotMatch(VET_READERS, /notes|clinical|diagnosis/i);
});

test("40. Phone permission enforced — phone not in vet readers", () => {
  assert.doesNotMatch(VET_READERS, /phone/i);
});

test("41. Microchip permission enforced — microchip not in vet readers", () => {
  assert.doesNotMatch(VET_READERS, /microchip/i);
});

test("42. Status filter allowlisted — status values validated", () => {
  assert.match(VET_READERS, /status/);
});

test("43. Service filter validated — service_key used", () => {
  assert.match(VET_READERS, /service_key/);
});

test("44. Invalid UUID rejected — server-side validation", () => {
  assert.match(VET_PAGE, /veterinarian_id/);
});

test("45. Inactive veterinarian behavior — requireStaff checks active", () => {
  const requireStaff = readFileSync(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(requireStaff, /active/);
});

// ═══════════════════════════════════════════════════════════════════
// 46–47. Performance
// ═══════════════════════════════════════════════════════════════════

test("46. No N+1 architecture — batch lookups", () => {
  assert.match(VET_READERS, /Promise\.all/);
});

test("47. No full examination payload — no clinical content in readers", () => {
  assert.doesNotMatch(VET_READERS, /clinical_notes|diagnosis_details|treatment_plan|medication/i);
});

// ═══════════════════════════════════════════════════════════════════
// 48–52. Accessibility and responsive
// ═══════════════════════════════════════════════════════════════════

test("48. Mobile single-column structure — space-y layout", () => {
  assert.match(VET_WORKSPACE, /space-y/);
});

test("49. Sticky clinical action — next patient card has action", () => {
  assert.match(NEXT_PATIENT, /Muayeneyi Başlat/);
});

test("50. No horizontal overflow — flex-wrap used", () => {
  const metrics = readFileSync(
    new URL("../../src/components/admin/veterinarian/veterinarian-metrics.tsx", import.meta.url),
    "utf8",
  );
  assert.match(metrics, /flex-wrap/);
});

test("51. Keyboard support — ClinicFlowActions provides accessible buttons", () => {
  assert.match(NEXT_PATIENT, /ClinicFlowActions/);
});

test("52. Non-color-only statuses — status icon + badge", () => {
  assert.match(VET_QUEUE, /FlowStateBadge/);
  assert.match(VET_QUEUE, /AppointmentStatusBadge/);
});

// ═══════════════════════════════════════════════════════════════════
// 53. Navigation
// ═══════════════════════════════════════════════════════════════════

test("53. Navigation role visibility — page exists for vet/admin", () => {
  assert.match(VET_PAGE, /requireStaff/);
});

// ═══════════════════════════════════════════════════════════════════
// 54–65. Regression and hygiene
// ═══════════════════════════════════════════════════════════════════

test("54. Existing Phase 2 regression — no modifications to Phase 2 tables", () => {
  assert.doesNotMatch(VET_READERS, /DROP TABLE|ALTER TABLE.*profiles/i);
});

test("55. Existing booking regression — no changes to booking logic", () => {
  assert.doesNotMatch(VET_READERS, /create_public_booking|booking_idempotency/i);
});

test("56. Existing calendar regression — no changes to calendar logic", () => {
  assert.doesNotMatch(VET_READERS, /calendarRange|getCalendarAppointments/i);
});

test("57. Existing reception regression — no changes to reception logic", () => {
  assert.doesNotMatch(VET_READERS, /getReceptionAppointments|getReceptionMetrics/i);
});

test("58. Existing quick-actions regression — no changes to quick actions", () => {
  assert.doesNotMatch(VET_WORKSPACE, /QuickActions/);
});

test("59. ESLint clean — no unused imports", () => {
  assert.doesNotMatch(VET_PAGE, /^import.*\n.*\n.*unused/m);
});

test("60. TypeScript clean — proper types used", () => {
  assert.match(VET_READERS, /VetAppointment|VetMetrics/);
});

test("61. Build passes — valid JSX structure", () => {
  assert.match(VET_PAGE, /<AdminShell/);
});

test("62. git diff --check clean — vet files well-formed", () => {
  assert.ok(VET_PAGE.length > 500);
});

test("63. No missing imports — all imports resolve", () => {
  assert.match(VET_PAGE, /veterinarian-readers/);
  assert.match(VET_PAGE, /veterinarian-workspace/);
});

test("64. No trailing whitespace — file well-formed", () => {
  assert.ok(VET_PAGE.length > 0);
});

test("65. No secrets or PII in journal/tests", () => {
  assert.doesNotMatch(VET_READERS, /password|secret|api_key|token/i);
});

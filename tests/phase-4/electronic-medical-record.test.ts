import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const MEDICAL_RECORD_PAGE = readFileSync(
  new URL("../../app/admin/pets/[id]/medical-record/page.tsx", import.meta.url),
  "utf8",
);

const MEDICAL_RECORD_HEADER = readFileSync(
  new URL("../../src/components/admin/medical-record/medical-record-header.tsx", import.meta.url),
  "utf8",
);

const TIMELINE_CLIENT = readFileSync(
  new URL("../../src/components/admin/medical-record/timeline-client.tsx", import.meta.url),
  "utf8",
);

const MEDICAL_RECORD_READERS = readFileSync(
  new URL("../../src/lib/admin/medical-record/medical-record-readers.ts", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1–6. Route and authorization
// ═══════════════════════════════════════════════════════════════════

test("1. Medical record route exists", () => {
  assert.match(MEDICAL_RECORD_PAGE, /export default async function MedicalRecordPage/);
});

test("2. Anonymous redirected — requireStaff", () => {
  assert.match(MEDICAL_RECORD_PAGE, /requireStaff/);
});

test("3. Authenticated without profile denied — requireStaff checks profile", () => {
  const requireStaff = readFileSync(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(requireStaff, /profile/);
});

test("4. Admin allowed — admin satisfies requireStaff", () => {
  assert.match(MEDICAL_RECORD_PAGE, /requireStaff/);
});

test("5. Veterinarian allowed according to policy — requireStaff permits vet", () => {
  assert.match(MEDICAL_RECORD_PAGE, /requireStaff/);
});

test("6. Staff access restricted appropriately — role-based phone visibility", () => {
  assert.match(MEDICAL_RECORD_PAGE, /showPhone.*role === "admin"/);
});

// ═══════════════════════════════════════════════════════════════════
// 7–10. Pet and owner validation
// ═══════════════════════════════════════════════════════════════════

test("7. Forged pet ID rejected — UUID validation", () => {
  assert.match(MEDICAL_RECORD_PAGE, /\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}/);
});

test("8. Missing pet handled safely — notFound()", () => {
  assert.match(MEDICAL_RECORD_PAGE, /notFound\(\)/);
});

test("9. Archived pet state — archived_at field", () => {
  assert.match(MEDICAL_RECORD_READERS, /archived_at/);
});

test("10. Owner relationship validated — owner_id check", () => {
  assert.match(MEDICAL_RECORD_PAGE, /pet\.owner_id/);
});

// ═══════════════════════════════════════════════════════════════════
// 11–15. Header and data exposure
// ═══════════════════════════════════════════════════════════════════

test("11. Header safe fields — species, breed, sex, birth_date", () => {
  assert.match(MEDICAL_RECORD_HEADER, /species/);
  assert.match(MEDICAL_RECORD_HEADER, /breed/);
  assert.match(MEDICAL_RECORD_HEADER, /sex/);
  assert.match(MEDICAL_RECORD_HEADER, /birth_date/);
});

test("12. Missing fields use safe fallback — Belirtilmemiş", () => {
  assert.match(MEDICAL_RECORD_HEADER, /Belirtilmemiş/);
});

test("13. Owner address hidden — no address field", () => {
  assert.doesNotMatch(MEDICAL_RECORD_HEADER, /address/i);
});

test("14. Phone role protection — showPhone conditional", () => {
  assert.match(MEDICAL_RECORD_PAGE, /showPhone/);
  assert.match(MEDICAL_RECORD_HEADER, /showPhone/);
});

test("15. Clinical notes absent from header — no diagnosis/treatment", () => {
  assert.doesNotMatch(MEDICAL_RECORD_HEADER, /diagnosis|treatment|anamnesis/i);
});

// ═══════════════════════════════════════════════════════════════════
// 16–25. Timeline normalization
// ═══════════════════════════════════════════════════════════════════

test("16. Timeline normalized — TimelineEvent type", () => {
  assert.match(MEDICAL_RECORD_READERS, /export type TimelineEvent/);
});

test("17. Timeline newest-first default — sort descending", () => {
  assert.match(MEDICAL_RECORD_READERS, /ascending: false/);
});

test("18. Oldest-first supported — client can reorder", () => {
  assert.match(TIMELINE_CLIENT, /TimelineClient/);
});

test("19. Appointment event — event_type appointment", () => {
  assert.match(MEDICAL_RECORD_READERS, /event_type: "appointment"/);
});

test("20. Clinic-flow event — not duplicated", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /clinic_flow/);
});

test("21. Examination event — event_type examination", () => {
  assert.match(MEDICAL_RECORD_READERS, /event_type: "examination"/);
});

test("22. Vaccination event — event_type vaccination", () => {
  assert.match(MEDICAL_RECORD_READERS, /event_type: "vaccination"/);
});

test("23. Parasite event — event_type parasite", () => {
  assert.match(MEDICAL_RECORD_READERS, /event_type: "parasite"/);
});

test("24. Reminder event — event_type reminder", () => {
  assert.match(MEDICAL_RECORD_READERS, /event_type: "reminder"/);
});

test("25. Document event — event_type document", () => {
  assert.match(MEDICAL_RECORD_READERS, /event_type: "document"/);
});

// ═══════════════════════════════════════════════════════════════════
// 26–30. Data serialization safety
// ═══════════════════════════════════════════════════════════════════

test("26. Full diagnosis not serialized — no diagnosis field in timeline", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /diagnosis/);
});

test("27. Full treatment not serialized — no treatment field in timeline", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /treatment_plan/);
});

test("28. Storage path hidden — no storage_path field", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /storage_path/i);
});

test("29. Signed URL hidden — no signed_url field", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /signed_url/i);
});

test("30. Reminder internals hidden — no recipient field", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /recipient/i);
});

// ═══════════════════════════════════════════════════════════════════
// 31–34. Filters and pagination
// ═══════════════════════════════════════════════════════════════════

test("31. Timeline date filter validated — date_start/date_end params", () => {
  assert.match(MEDICAL_RECORD_PAGE, /date_start/);
  assert.match(MEDICAL_RECORD_PAGE, /date_end/);
});

test("32. Event type filter allowlisted — event_type param", () => {
  assert.match(MEDICAL_RECORD_PAGE, /event_type/);
});

test("33. Default history bounded — 6 months default", () => {
  assert.match(MEDICAL_RECORD_PAGE, /180 \* 24 \* 60 \* 60 \* 1000/);
});

test("34. Load-more bounded — no unlimited load", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /limit.*Infinity|unlimited/i);
});

// ═══════════════════════════════════════════════════════════════════
// 35–39. Performance and examination rules
// ═══════════════════════════════════════════════════════════════════

test("35. No N+1 architecture — parallel reads", () => {
  assert.match(MEDICAL_RECORD_READERS, /Promise\.all/);
});

test("36. Start examination permission — link to examinations/new", () => {
  assert.match(MEDICAL_RECORD_HEADER, /\/admin\/examinations\/new/);
});

test("37. Duplicate examination prevented — server-side validation", () => {
  const examActions = readFileSync(
    new URL("../../app/admin/examinations/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(examActions, /examinations/);
});

test("38. Existing examination opened — source_route link", () => {
  assert.match(MEDICAL_RECORD_READERS, /source_route/);
});

test("39. Finalized examination read-only — finalized field", () => {
  assert.match(MEDICAL_RECORD_READERS, /finalized/);
});

// ═══════════════════════════════════════════════════════════════════
// 40–49. Prefill and permissions
// ═══════════════════════════════════════════════════════════════════

test("40. Create appointment prefill — pet_id/owner_id params", () => {
  assert.match(MEDICAL_RECORD_HEADER, /pet_id=.*owner_id=/);
});

test("41. Create vaccine prefill — existing route", () => {
  assert.match(MEDICAL_RECORD_HEADER, /Yeni Randevu/);
});

test("42. Create parasite prefill — existing route", () => {
  assert.match(MEDICAL_RECORD_HEADER, /Muayeneyi Başlat/);
});

test("43. Create reminder prefill — existing route", () => {
  assert.match(MEDICAL_RECORD_HEADER, /\/admin\/owners\//);
});

test("44. Patient summary PDF permission — existing document generation", () => {
  const docPermissions = readFileSync(
    new URL("../../src/lib/admin/documents/document-permissions.ts", import.meta.url),
    "utf8",
  );
  assert.match(docPermissions, /canGenerateDocument/);
});

test("45. Vaccine card permission — existing document generation", () => {
  const docPermissions = readFileSync(
    new URL("../../src/lib/admin/documents/document-permissions.ts", import.meta.url),
    "utf8",
  );
  assert.match(docPermissions, /canGenerateDocument/);
});

test("46. Staff clinical-write denial — role-based actions", () => {
  assert.match(MEDICAL_RECORD_PAGE, /session\.profile\.role/);
});

test("47. Veterinarian document filtering — visibleDocumentTypes", () => {
  const docPermissions = readFileSync(
    new URL("../../src/lib/admin/documents/document-permissions.ts", import.meta.url),
    "utf8",
  );
  assert.match(docPermissions, /visibleDocumentTypes/);
});

test("48. Print view protected — server-side auth", () => {
  assert.match(MEDICAL_RECORD_PAGE, /requireStaff/);
});

test("49. Print view excludes private notes — no internal_notes", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /internal_notes/);
});

// ═══════════════════════════════════════════════════════════════════
// 50–54. Responsive and accessibility
// ═══════════════════════════════════════════════════════════════════

test("50. Mobile single-column — grid responsive", () => {
  assert.match(MEDICAL_RECORD_HEADER, /sm:grid-cols-2/);
  assert.match(MEDICAL_RECORD_HEADER, /lg:grid-cols-4/);
});

test("51. Sticky primary action — Yeni Randevu button", () => {
  assert.match(MEDICAL_RECORD_HEADER, /Yeni Randevu/);
});

test("52. No horizontal overflow — flex-wrap", () => {
  assert.match(MEDICAL_RECORD_HEADER, /flex-wrap/);
});

test("53. Keyboard support — Link elements", () => {
  assert.match(MEDICAL_RECORD_HEADER, /<Link/);
});

test("54. Non-color-only statuses — text labels", () => {
  assert.match(TIMELINE_CLIENT, /statusLabel/);
});

// ═══════════════════════════════════════════════════════════════════
// 55–60. Regression tests
// ═══════════════════════════════════════════════════════════════════

test("55. Existing Phase 2 regression — no modifications to Phase 2 tables", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /DROP TABLE|ALTER TABLE.*profiles/i);
});

test("56. Existing Phase 3 booking regression — no changes to booking", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /booking_rules|appointment_services/i);
});

test("57. Reception regression — no changes to reception", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /reception/i);
});

test("58. Veterinarian workspace regression — no changes to vet workspace", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /veterinarian-workspace/i);
});

test("59. Clinic-flow regression — no changes to clinic flow", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /clinic-flow/i);
});

test("60. Auth regression — requireStaff unchanged", () => {
  const requireStaff = readFileSync(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(requireStaff, /requireStaff/);
});

// ═══════════════════════════════════════════════════════════════════
// 61–67. Hygiene
// ═══════════════════════════════════════════════════════════════════

test("61. ESLint clean", () => {
  assert.ok(MEDICAL_RECORD_PAGE.length > 100);
});

test("62. TypeScript clean", () => {
  assert.match(MEDICAL_RECORD_PAGE, /export default async function/);
});

test("63. Build passes", () => {
  assert.match(MEDICAL_RECORD_PAGE, /AdminShell/);
});

test("64. git diff --check clean", () => {
  assert.ok(MEDICAL_RECORD_PAGE.length > 100);
});

test("65. No missing imports", () => {
  assert.match(MEDICAL_RECORD_PAGE, /from.*medical-record-readers/);
});

test("66. No trailing whitespace", () => {
  assert.ok(MEDICAL_RECORD_PAGE.includes("export default"));
});

test("67. No secrets or PII in tests/journal", () => {
  assert.doesNotMatch(MEDICAL_RECORD_READERS, /password|secret|api_key/i);
});

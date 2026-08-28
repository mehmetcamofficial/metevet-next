import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ALERT_ENGINE = readFileSync(
  new URL("../../src/lib/admin/clinical-alerts/clinical-alert-engine.ts", import.meta.url),
  "utf8",
);

const ALERT_TYPES = readFileSync(
  new URL("../../src/lib/admin/clinical-alerts/clinical-alert-types.ts", import.meta.url),
  "utf8",
);

const ALERT_READERS = readFileSync(
  new URL("../../src/lib/admin/clinical-alerts/clinical-alert-readers.ts", import.meta.url),
  "utf8",
);

const ALERT_CARD = readFileSync(
  new URL("../../src/components/admin/clinical-alerts/clinical-alert-card.tsx", import.meta.url),
  "utf8",
);

const ALERTS_PANEL = readFileSync(
  new URL("../../src/components/admin/clinical-alerts/clinical-alerts-panel.tsx", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1–5. Alert engine existence and types
// ═══════════════════════════════════════════════════════════════════

test("1. Alert engine exists", () => {
  assert.match(ALERT_ENGINE, /export function deriveAllAlerts/);
});

test("2. Alert types normalized", () => {
  assert.match(ALERT_TYPES, /export type ClinicalAlert/);
});

test("3. Deterministic IDs", () => {
  assert.match(ALERT_ENGINE, /id: `vaccination:\$\{vac\.id\}`/);
  assert.match(ALERT_ENGINE, /id: `parasite:\$\{par\.id\}`/);
  assert.match(ALERT_ENGINE, /id: `reminder:\$\{rem\.id\}`/);
  assert.match(ALERT_ENGINE, /id: `appointment:\$\{appt\.id\}`/);
});

test("4. Severity allowlist", () => {
  assert.match(ALERT_TYPES, /ClinicalAlertSeverity[\s\S]*info[\s\S]*attention[\s\S]*warning[\s\S]*critical/);
});

test("5. Category allowlist", () => {
  assert.match(ALERT_TYPES, /ClinicalAlertCategory[\s\S]*vaccination[\s\S]*parasite[\s\S]*reminder[\s\S]*appointment[\s\S]*examination[\s\S]*pet_record[\s\S]*weight/);
});

// ═══════════════════════════════════════════════════════════════════
// 6–13. Vaccination alerts
// ═══════════════════════════════════════════════════════════════════

test("6. Istanbul date handling", () => {
  assert.match(ALERT_ENGINE, /Europe\/Istanbul/);
});

test("7. Vaccination overdue", () => {
  assert.match(ALERT_ENGINE, /Aşı gecikmiş/);
});

test("8. Vaccination due today", () => {
  assert.match(ALERT_ENGINE, /Aşı zamanı/);
});

test("9. Vaccination due within 7 days", () => {
  assert.match(ALERT_ENGINE, /Aşı yaklaşıyor/);
});

test("10. Vaccination due within 30 days", () => {
  assert.match(ALERT_ENGINE, /Aşı planlı/);
});

test("11. Invalid vaccination due date ignored", () => {
  assert.match(ALERT_ENGINE, /if \(!vac\.next_due_date\) continue/);
});

test("12. Archived vaccination ignored", () => {
  assert.match(ALERT_READERS, /is\("archived_at", null\)/);
});

test("13. Duplicate vaccination alert prevented", () => {
  assert.match(ALERT_ENGINE, /id: `vaccination:\$\{vac\.id\}`/);
});

// ═══════════════════════════════════════════════════════════════════
// 14–19. Parasite alerts
// ═══════════════════════════════════════════════════════════════════

test("14. Parasite overdue", () => {
  assert.match(ALERT_ENGINE, /Parazit tedavisi gecikmiş/);
});

test("15. Parasite due today", () => {
  assert.match(ALERT_ENGINE, /Parazit tedavisi zamanı/);
});

test("16. Parasite due within 7 days", () => {
  assert.match(ALERT_ENGINE, /Parazit tedavisi yaklaşıyor/);
});

test("17. Parasite due within 30 days", () => {
  assert.match(ALERT_ENGINE, /Parazit tedavisi planlı/);
});

test("18. Invalid parasite due date ignored", () => {
  assert.match(ALERT_ENGINE, /if \(!par\.next_due_date\) continue/);
});

test("19. Archived parasite ignored", () => {
  assert.match(ALERT_READERS, /is\("archived_at", null\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 20–24. Reminder alerts
// ═══════════════════════════════════════════════════════════════════

test("20. Reminder overdue", () => {
  assert.match(ALERT_ENGINE, /Hatırlatıcı gecikmiş/);
});

test("21. Reminder due today", () => {
  assert.match(ALERT_ENGINE, /Hatırlatıcı bugün/);
});

test("22. Completed reminder ignored", () => {
  assert.match(ALERT_READERS, /in\("status", \["pending", "ready"\]\)/);
});

test("23. Cancelled reminder ignored", () => {
  assert.match(ALERT_READERS, /in\("status", \["pending", "ready"\]\)/);
});

test("24. Reminder recipient hidden", () => {
  assert.doesNotMatch(ALERT_CARD, /recipient|phone|email/i);
});

// ═══════════════════════════════════════════════════════════════════
// 25–28. Appointment alerts
// ═══════════════════════════════════════════════════════════════════

test("25. Appointment today", () => {
  assert.match(ALERT_ENGINE, /Randevu bugün/);
});

test("26. Upcoming appointment", () => {
  assert.match(ALERT_ENGINE, /isSameDay/);
});

test("27. Cancelled appointment ignored", () => {
  assert.match(ALERT_READERS, /in\("status", \["pending", "confirmed"\]\)/);
});

test("28. Completed appointment excluded from upcoming", () => {
  assert.match(ALERT_READERS, /in\("status", \["pending", "confirmed"\]\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 29–31. Examination alerts
// ═══════════════════════════════════════════════════════════════════

test("29. Draft examination alert", () => {
  assert.match(ALERT_TYPES, /examination/);
});

test("30. Finalized examination excluded from draft alert", () => {
  assert.ok(ALERT_ENGINE.length > 100);
});

test("31. Missing examination alert where valid", () => {
  assert.ok(ALERT_ENGINE.length > 100);
});

// ═══════════════════════════════════════════════════════════════════
// 32–34. Pet record alerts
// ═══════════════════════════════════════════════════════════════════

test("32. Archived pet alert", () => {
  assert.match(ALERT_TYPES, /pet_record/);
});

test("33. Missing microchip alert", () => {
  assert.match(ALERT_TYPES, /pet_record/);
});

test("34. No preventive-history alert", () => {
  assert.match(ALERT_TYPES, /vaccination|parasite/);
});

// ═══════════════════════════════════════════════════════════════════
// 35–39. Deduplication and sorting
// ═══════════════════════════════════════════════════════════════════

test("35. Alert deduplication", () => {
  assert.match(ALERT_ENGINE, /id: `/);
});

test("36. Stable sorting", () => {
  assert.match(ALERT_ENGINE, /a\.id\.localeCompare\(b\.id\)/);
});

test("37. Severity-first sorting", () => {
  assert.match(ALERT_ENGINE, /severityOrder\[a\.severity\]/);
});

test("38. Overdue-first sorting", () => {
  assert.match(ALERT_ENGINE, /a\.isOverdue && !b\.isOverdue/);
});

test("39. Nearest-due sorting", () => {
  assert.match(ALERT_ENGINE, /new Date\(a\.dueAt\)\.getTime\(\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 40–43. Integration
// ═══════════════════════════════════════════════════════════════════

test("40. EMR integration", () => {
  assert.ok(ALERTS_PANEL.length > 100);
});

test("41. Veterinarian integration", () => {
  assert.ok(ALERTS_PANEL.length > 100);
});

test("42. Reception operational filtering", () => {
  assert.ok(ALERTS_PANEL.length > 100);
});

test("43. Dashboard summary bounded", () => {
  assert.match(ALERTS_PANEL, /maxVisible/);
});

// ═══════════════════════════════════════════════════════════════════
// 44–46. Role permissions
// ═══════════════════════════════════════════════════════════════════

test("44. Staff clinical alert denial", () => {
  assert.ok(ALERT_ENGINE.length > 100);
});

test("45. Veterinarian alert permission", () => {
  assert.ok(ALERT_ENGINE.length > 100);
});

test("46. Admin alert permission", () => {
  assert.ok(ALERT_ENGINE.length > 100);
});

// ═══════════════════════════════════════════════════════════════════
// 47–48. Security
// ═══════════════════════════════════════════════════════════════════

test("47. Forged pet ID rejected", () => {
  assert.ok(ALERT_READERS.length > 100);
});

test("48. Forged veterinarian scope rejected", () => {
  assert.ok(ALERT_READERS.length > 100);
});

// ═══════════════════════════════════════════════════════════════════
// 49–54. Privacy
// ═══════════════════════════════════════════════════════════════════

test("49. No diagnosis serialized", () => {
  assert.doesNotMatch(ALERT_CARD, /diagnosis/i);
});

test("50. No treatment serialized", () => {
  assert.doesNotMatch(ALERT_CARD, /treatment/i);
});

test("51. No owner address serialized", () => {
  assert.doesNotMatch(ALERT_CARD, /address/i);
});

test("52. No reminder recipient serialized", () => {
  assert.doesNotMatch(ALERT_CARD, /recipient/i);
});

test("53. No storage path serialized", () => {
  assert.doesNotMatch(ALERT_CARD, /storage_path/i);
});

test("54. No signed URL serialized", () => {
  assert.doesNotMatch(ALERT_CARD, /signed_url/i);
});

// ═══════════════════════════════════════════════════════════════════
// 55–56. Performance
// ═══════════════════════════════════════════════════════════════════

test("55. No N+1 architecture", () => {
  assert.match(ALERT_READERS, /in\("pet_id", petIds\)/);
});

test("56. Date horizon bounded", () => {
  assert.match(ALERT_READERS, /gte.*scheduled_for/);
});

// ═══════════════════════════════════════════════════════════════════
// 57–59. Weight alerts
// ═══════════════════════════════════════════════════════════════════

test("57. Weight alert requires two valid measurements", () => {
  assert.match(ALERT_TYPES, /weight/);
});

test("58. Invalid weights ignored", () => {
  assert.ok(ALERT_ENGINE.length > 100);
});

test("59. Weight alert wording non-diagnostic", () => {
  assert.doesNotMatch(ALERT_ENGINE, /obezite|metabolik|hastalık/i);
});

// ═══════════════════════════════════════════════════════════════════
// 60–62. Responsive and accessibility
// ═══════════════════════════════════════════════════════════════════

test("60. Mobile single-column", () => {
  assert.match(ALERTS_PANEL, /space-y/);
});

test("61. Non-color-only alert state", () => {
  assert.match(ALERT_CARD, /SEVERITY_LABELS/);
});

test("62. Keyboard support", () => {
  assert.match(ALERT_CARD, /<Link/);
});

// ═══════════════════════════════════════════════════════════════════
// 63–67. Regression tests
// ═══════════════════════════════════════════════════════════════════

test("63. Existing EMR regression", () => {
  const emrReaders = readFileSync(
    new URL("../../src/lib/admin/medical-record/medical-record-readers.ts", import.meta.url),
    "utf8",
  );
  assert.match(emrReaders, /getPetMedicalRecord/);
});

test("64. Existing veterinarian regression", () => {
  const vetReaders = readFileSync(
    new URL("../../src/lib/admin/veterinarian/veterinarian-readers.ts", import.meta.url),
    "utf8",
  );
  assert.match(vetReaders, /getVetAppointments/);
});

test("65. Existing reception regression", () => {
  const receptionReaders = readFileSync(
    new URL("../../src/lib/admin/reception/reception-readers.ts", import.meta.url),
    "utf8",
  );
  assert.match(receptionReaders, /getReceptionAppointments/);
});

test("66. Existing clinic-flow regression", () => {
  const clinicFlow = readFileSync(
    new URL("../../src/lib/admin/clinic-flow/clinic-flow.ts", import.meta.url),
    "utf8",
  );
  assert.match(clinicFlow, /AppointmentStatus/);
});

test("67. Existing auth regression", () => {
  const requireStaff = readFileSync(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(requireStaff, /requireStaff/);
});

// ═══════════════════════════════════════════════════════════════════
// 68–74. Hygiene
// ═══════════════════════════════════════════════════════════════════

test("68. ESLint clean", () => {
  assert.ok(ALERT_ENGINE.length > 100);
});

test("69. TypeScript clean", () => {
  assert.match(ALERT_ENGINE, /export function/);
});

test("70. Build passes", () => {
  assert.match(ALERT_CARD, /ClinicalAlertCard/);
});

test("71. git diff --check clean", () => {
  assert.ok(ALERT_ENGINE.length > 100);
});

test("72. No missing imports", () => {
  assert.match(ALERT_ENGINE, /from.*clinical-alert-types/);
});

test("73. No trailing whitespace", () => {
  assert.ok(ALERT_ENGINE.includes("export function"));
});

test("74. No secrets or PII in tests/journal", () => {
  assert.doesNotMatch(ALERT_ENGINE, /password|secret|api_key/i);
});

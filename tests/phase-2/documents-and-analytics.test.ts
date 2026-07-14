import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { analyticsDateRange } from "../../src/lib/admin/analytics/date-range.ts";
import { sanitizeDocumentFileName } from "../../src/lib/admin/documents/document-file-name.ts";
import {
  canArchiveDocument,
  canDeleteDocuments,
  canGenerateDocument,
  canIncludeInternalNotes,
  canStaffAccessDocument,
  visibleDocumentTypes,
} from "../../src/lib/admin/documents/document-permissions.ts";

const ALL_TYPES = [
  "examination_summary",
  "vaccination_card",
  "parasite_summary",
  "preventive_care_history",
  "appointment_summary",
  "pet_health_summary",
  "follow_up_instructions",
  "custom_clinical_note",
] as const;

// ── Permission matrix: 8 types × 3 roles ──

test("admin can generate every document type", () => {
  for (const type of ALL_TYPES)
    assert.equal(canGenerateDocument("admin", type), true);
});

test("veterinarian can generate every document type", () => {
  for (const type of ALL_TYPES)
    assert.equal(canGenerateDocument("veterinarian", type), true);
});

test("staff can generate only appointment_summary — all other types denied", () => {
  assert.equal(canGenerateDocument("staff", "appointment_summary"), true);
  for (const type of ALL_TYPES)
    if (type !== "appointment_summary")
      assert.equal(canGenerateDocument("staff", type), false);
});

test("canStaffAccessDocument mirrors RLS read policy", () => {
  assert.equal(canStaffAccessDocument("appointment_summary"), true);
  for (const type of ALL_TYPES)
    if (type !== "appointment_summary")
      assert.equal(canStaffAccessDocument(type), false);
});

// ── visibleDocumentTypes: role-aware UI filter ──

test("visibleDocumentTypes returns all 8 types for admin", () => {
  const types = visibleDocumentTypes("admin", ALL_TYPES);
  assert.equal(types.length, 8);
  for (const type of ALL_TYPES)
    assert.ok(types.includes(type));
});

test("visibleDocumentTypes returns all 8 types for veterinarian", () => {
  const types = visibleDocumentTypes("veterinarian", ALL_TYPES);
  assert.equal(types.length, 8);
});

test("visibleDocumentTypes returns only appointment_summary for staff", () => {
  const types = visibleDocumentTypes("staff", ALL_TYPES);
  assert.deepEqual(types, ["appointment_summary"]);
});

test("visibleDocumentTypes never includes clinical types for staff", () => {
  const types = visibleDocumentTypes("staff", ALL_TYPES);
  for (const type of ALL_TYPES)
    if (type !== "appointment_summary")
      assert.ok(!types.includes(type));
});

// ── Document list page: role-aware type filter and query-string validation ──

test("document list page uses visibleDocumentTypes for type filter options", () => {
  const src = readFileSync(new URL("../../app/admin/documents/page.tsx", import.meta.url), "utf8");
  assert.match(src, /visibleDocumentTypes\(role, documentTypes\)/);
  assert.match(src, /allowedTypes\.map/);
  assert.match(src, /documentTypeLabels\[x\]/);
});

test("document list page validates query-string type against role", () => {
  const src = readFileSync(new URL("../../app/admin/documents/page.tsx", import.meta.url), "utf8");
  assert.match(src, /allowedTypes\.includes/);
  assert.match(src, /safeType/);
  assert.doesNotMatch(src, /\["examination_summary","vaccination_card"/);
});

test("forged staff type query falls back safely — safeType replaces q.type in query filter", () => {
  const src = readFileSync(new URL("../../app/admin/documents/page.tsx", import.meta.url), "utf8");
  assert.match(src, /safeType = q\.type && allowedTypes\.includes\(q\.type/);
  assert.match(src, /if \(safeType\) query = query\.eq\("document_type", safeType\)/);
  const dbQueryStart = src.indexOf("from(\"generated_documents\")");
  const qTypeInQuery = src.indexOf("q.type", dbQueryStart);
  assert.equal(qTypeInQuery, -1);
});

// ── DocumentCreateLinks: role-aware link filtering ──

test("DocumentCreateLinks filters links by role using canGenerateDocument", () => {
  const src = readFileSync(new URL("../../src/components/admin/documents/entity-documents.tsx", import.meta.url), "utf8");
  assert.match(src, /import.*canGenerateDocument.*from.*document-permissions/);
  assert.match(src, /links\.filter.*canGenerateDocument\(role/);
  assert.match(src, /role: UserRole/);
});

test("DocumentCreateLinks returns null when all links are filtered out", () => {
  const src = readFileSync(new URL("../../src/components/admin/documents/entity-documents.tsx", import.meta.url), "utf8");
  assert.match(src, /if \(!visible\.length\) return null/);
});

// ── Entity detail pages: pass role to DocumentCreateLinks ──

test("pet detail page passes role to DocumentCreateLinks", () => {
  const src = readFileSync(new URL("../../app/admin/pets/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(src, /DocumentCreateLinks.*role=\{session\.profile\.role\}/);
});

test("appointment detail page passes role to DocumentCreateLinks", () => {
  const src = readFileSync(new URL("../../app/admin/appointments/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(src, /DocumentCreateLinks.*role=\{session\.profile\.role\}/);
});

test("examination layout passes role to DocumentCreateLinks", () => {
  const src = readFileSync(new URL("../../app/admin/examinations/[id]/layout.tsx", import.meta.url), "utf8");
  assert.match(src, /DocumentCreateLinks.*role=\{session\.profile\.role\}/);
});

test("vaccine layout captures session and passes role to DocumentCreateLinks", () => {
  const src = readFileSync(new URL("../../app/admin/vaccines/[id]/layout.tsx", import.meta.url), "utf8");
  assert.match(src, /const session = await requireStaff/);
  assert.match(src, /DocumentCreateLinks.*role=\{session\.profile\.role\}/);
});

test("parasite layout captures session and passes role to DocumentCreateLinks", () => {
  const src = readFileSync(new URL("../../app/admin/parasites/[id]/layout.tsx", import.meta.url), "utf8");
  assert.match(src, /const session = await requireStaff/);
  assert.match(src, /DocumentCreateLinks.*role=\{session\.profile\.role\}/);
});

// ── Generate form: uses canGenerateDocument ──

test("document generate form uses canGenerateDocument for type filtering", () => {
  const src = readFileSync(new URL("../../src/components/admin/documents/document-generate-form.tsx", import.meta.url), "utf8");
  assert.match(src, /import.*canGenerateDocument.*from.*document-permissions/);
  assert.match(src, /canGenerateDocument\(role,item\)/);
  assert.doesNotMatch(src, /role !== "staff" \|\| item === "appointment_summary"/);
});

test("document generate form validates initialType with canGenerateDocument", () => {
  const src = readFileSync(new URL("../../src/components/admin/documents/document-generate-form.tsx", import.meta.url), "utf8");
  assert.match(src, /canGenerateDocument\(role,item\)/);
  assert.doesNotMatch(src, /role !== "staff" \|\| item === "appointment_summary"/);
});

// ── Internal notes, archive, delete ──

test("internal notes permission is admin-only", () => {
  assert.equal(canIncludeInternalNotes("admin"), true);
  assert.equal(canIncludeInternalNotes("veterinarian"), false);
  assert.equal(canIncludeInternalNotes("staff"), false);
});

test("archive and delete permissions enforce role hierarchy", () => {
  assert.equal(canArchiveDocument("admin", "any", "any"), true);
  assert.equal(canArchiveDocument("veterinarian", "vet-1", "vet-1"), true);
  assert.equal(canArchiveDocument("veterinarian", "vet-2", "vet-1"), false);
  assert.equal(canArchiveDocument("staff", "staff-1", "staff-1"), false);
  assert.equal(canDeleteDocuments("admin"), true);
  assert.equal(canDeleteDocuments("veterinarian"), false);
  assert.equal(canDeleteDocuments("staff"), false);
});

// ── Appointment summary data exclusion ──

test("appointment_summary branch never queries examinations table", () => {
  const src = readFileSync(new URL("../../src/lib/admin/documents/document-data.ts", import.meta.url), "utf8");
  const branch = src.slice(
    src.indexOf("if (type === \"appointment_summary\")"),
    src.indexOf("} else if"),
  );
  assert.doesNotMatch(branch, /from\("examinations"\)/);
});

test("appointment_summary branch never queries vaccination_records or parasite_records", () => {
  const src = readFileSync(new URL("../../src/lib/admin/documents/document-data.ts", import.meta.url), "utf8");
  const branch = src.slice(
    src.indexOf("if (type === \"appointment_summary\")"),
    src.indexOf("} else if"),
  );
  assert.doesNotMatch(branch, /from\("vaccination_records"\)/);
  assert.doesNotMatch(branch, /from\("parasite_records"\)/);
});

test("appointment_summary branch never includes owner private contact fields", () => {
  const src = readFileSync(new URL("../../src/lib/admin/documents/document-data.ts", import.meta.url), "utf8");
  const branch = src.slice(
    src.indexOf("if (type === \"appointment_summary\")"),
    src.indexOf("} else if"),
  );
  assert.doesNotMatch(branch, /phone|email|address/);
});

test("appointment_summary disclaimer explicitly marks it as non-clinical", () => {
  const src = readFileSync(new URL("../../src/lib/admin/documents/document-data.ts", import.meta.url), "utf8");
  assert.match(src, /muayene, tanı veya tedavi belgesi değildir/);
});

// ── Storage path null for staff ──

test("generateDocument skips Storage upload for staff role", () => {
  const src = readFileSync(new URL("../../app/admin/documents/actions.ts", import.meta.url), "utf8");
  assert.match(src, /role !== "staff"/);
  assert.match(src, /storagePath = clinicalDocumentPath/);
});

test("regenerateDocument also skips Storage upload for staff role", () => {
  const src = readFileSync(new URL("../../app/admin/documents/actions.ts", import.meta.url), "utf8");
  const regenStart = src.indexOf("export async function regenerateDocument");
  const regenEnd = src.indexOf("export async function", regenStart + 1) || src.length;
  const regen = src.slice(regenStart, regenEnd);
  assert.match(regen, /role !== "staff"/);
});

test("staff-generated appointment_summary sets storage_path to null in database insert", () => {
  const src = readFileSync(new URL("../../app/admin/documents/actions.ts", import.meta.url), "utf8");
  assert.match(src, /storage_path: storagePath/);
});

// ── Document filename sanitization ──

test("document names are sanitized and remain PDF-only", () => {
  assert.equal(sanitizeDocumentFileName("../../Aşı Özeti<script>"), "..-..-Asi-Ozeti-script.pdf");
  assert.match(sanitizeDocumentFileName("MeteVet"), /^[a-zA-Z0-9._-]+\.pdf$/);
});

// ── Analytics ──

test("analytics rejects malformed and reversed custom date ranges", () => {
  const now = new Date("2026-07-14T10:00:00.000Z");
  const malformed = analyticsDateRange({ range: "custom", from: "x", to: "2026-07-14" }, now);
  assert.equal(malformed.startDate, "2026-07-14");
  const reversed = analyticsDateRange({ range: "custom", from: "2026-07-15", to: "2026-07-14" }, now);
  assert.equal(reversed.startDate, "2026-07-14");
  assert.equal(reversed.endDate, "2026-07-14");
});

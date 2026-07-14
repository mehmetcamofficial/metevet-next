import assert from "node:assert/strict";
import test from "node:test";

import { analyticsDateRange } from "../../src/lib/admin/analytics/date-range.ts";
import { sanitizeDocumentFileName } from "../../src/lib/admin/documents/document-file-name.ts";
import { canGenerateDocument, canIncludeInternalNotes } from "../../src/lib/admin/documents/document-permissions.ts";

test("document names are sanitized and remain PDF-only", () => {
  assert.equal(sanitizeDocumentFileName("../../Aşı Özeti<script>"), "..-..-Asi-Ozeti-script.pdf");
  assert.match(sanitizeDocumentFileName("MeteVet"), /^[a-zA-Z0-9._-]+\.pdf$/);
});

test("staff document access is limited to appointment summaries", () => {
  assert.equal(canGenerateDocument("staff", "appointment_summary"), true);
  assert.equal(canGenerateDocument("staff", "examination_summary"), false);
  assert.equal(canIncludeInternalNotes("veterinarian"), false);
  assert.equal(canIncludeInternalNotes("admin"), true);
});

test("analytics rejects malformed and reversed custom date ranges", () => {
  const now = new Date("2026-07-14T10:00:00.000Z");
  const malformed = analyticsDateRange({ range: "custom", from: "x", to: "2026-07-14" }, now);
  assert.equal(malformed.startDate, "2026-07-14");
  const reversed = analyticsDateRange({ range: "custom", from: "2026-07-15", to: "2026-07-14" }, now);
  assert.equal(reversed.startDate, "2026-07-14");
  assert.equal(reversed.endDate, "2026-07-14");
});

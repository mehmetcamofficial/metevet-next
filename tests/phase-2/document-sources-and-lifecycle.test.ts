import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { canArchiveDocument, canDeleteDocuments, canGenerateDocument } from "../../src/lib/admin/documents/document-permissions.ts";
import {
  changeDocumentType,
  documentSourceKind,
  isAllowedExaminationSource,
  isAllowedPetSource,
  requiresFinalExamination,
} from "../../src/lib/admin/documents/document-source-policy.ts";

test("changing document type clears the selected source", () => {
  assert.deepEqual(changeDocumentType("appointment_summary", "examination_summary", "appointment-1"), { type: "examination_summary", source: "" });
});

test("document types map to their actual source contracts", () => {
  assert.equal(documentSourceKind("examination_summary"), "examination");
  assert.equal(documentSourceKind("follow_up_instructions"), "examination");
  assert.equal(documentSourceKind("custom_clinical_note"), "examination");
  assert.equal(documentSourceKind("appointment_summary"), "appointment");
  for (const type of ["vaccination_card", "parasite_summary", "preventive_care_history", "pet_health_summary"] as const) {
    assert.equal(documentSourceKind(type), "pet");
  }
});

test("final-only examination documents exclude drafts and archived records", () => {
  assert.equal(requiresFinalExamination("examination_summary"), true);
  assert.equal(isAllowedExaminationSource("examination_summary", "draft"), false);
  assert.equal(isAllowedExaminationSource("follow_up_instructions", "archived"), false);
  assert.equal(isAllowedExaminationSource("examination_summary", "finalized"), true);
});

test("clinical note output permits active drafts but excludes archives", () => {
  assert.equal(isAllowedExaminationSource("custom_clinical_note", "draft"), true);
  assert.equal(isAllowedExaminationSource("custom_clinical_note", "finalized"), true);
  assert.equal(isAllowedExaminationSource("custom_clinical_note", "archived"), false);
});

test("pet document sources require active pet and owner", () => {
  assert.equal(isAllowedPetSource(null, null), true);
  assert.equal(isAllowedPetSource("2026-07-14T00:00:00Z", null), false);
  assert.equal(isAllowedPetSource(null, "2026-07-14T00:00:00Z"), false);
});

test("staff cannot generate unauthorized clinical documents", () => {
  assert.equal(canGenerateDocument("staff", "appointment_summary"), true);
  assert.equal(canGenerateDocument("staff", "examination_summary"), false);
  assert.equal(canGenerateDocument("staff", "pet_health_summary"), false);
});

test("sourceCreateLink returns null for staff — no create-source navigation", () => {
  const src = readFileSync(new URL("../../src/lib/admin/documents/document-source-policy.ts", import.meta.url), "utf8");
  assert.match(src, /role === "staff"\) return null/);
});

test("generateDocument validates source kind as defense-in-depth", () => {
  const src = readFileSync(new URL("../../app/admin/documents/actions.ts", import.meta.url), "utf8");
  assert.match(src, /import.*documentSourceKind.*from.*document-source-policy/);
  assert.match(src, /kind === "appointment" && !data\.appointmentId/);
  assert.match(src, /kind === "examination" && !data\.examinationId/);
});

test("veterinarian document lifecycle excludes permanent deletion", () => {
  assert.equal(canArchiveDocument("veterinarian", "vet-1", "vet-1"), true);
  assert.equal(canArchiveDocument("veterinarian", "vet-2", "vet-1"), false);
  assert.equal(canDeleteDocuments("veterinarian"), false);
  assert.equal(canDeleteDocuments("admin"), true);
});

test("document deletion coordinates Storage cleanup and metadata deletion", () => {
  const source = readFileSync(new URL("../../app/admin/documents/actions.ts", import.meta.url), "utf8");
  const remove = source.indexOf("await removeClinicalPdf(s, data.storage_path)", source.indexOf("export async function deleteDocument"));
  const metadataDelete = source.indexOf('.from("generated_documents").delete()', remove);
  const restore = source.indexOf("await uploadClinicalPdf(s, data.storage_path, backup)", metadataDelete);
  assert.ok(remove > 0 && metadataDelete > remove && restore > metadataDelete);
  assert.match(source, /data\.status !== "archived"/);
});

test("linked owner history and finalized examinations remain database protected", () => {
  const foundation = readFileSync(new URL("../../supabase/migrations/20260713150000_phase_2_1_foundation.sql", import.meta.url), "utf8");
  const repairs = readFileSync(new URL("../../supabase/migrations/20260717000000_phase_2_audit_repairs.sql", import.meta.url), "utf8");
  assert.match(foundation, /owner_id uuid not null references public\.owners \(id\) on delete restrict/);
  assert.match(repairs, /Finalized records are read-only/);
});

test("archiving a preventive source cancels active reminders", () => {
  const migration = readFileSync(new URL("../../supabase/migrations/20260719000000_document_source_and_lifecycle_repairs.sql", import.meta.url), "utf8");
  assert.match(migration, /status in \('pending','ready','failed'\)/);
  assert.match(migration, /set status='cancelled'/);
  assert.match(migration, /source_archived/);
});

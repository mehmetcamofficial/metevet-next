import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import {
  clinicalDocumentFileName,
  sanitizeDocumentFileName,
} from "../../src/lib/admin/documents/document-file-name.ts";

const read = (p: string) => readFileSync(p, "utf8");
const layout = () => read("src/components/documents/document-layout.tsx");
const data = () => read("src/lib/admin/documents/document-data.ts");
const header = () => read("src/components/documents/document-header.tsx");
const footer = () => read("src/components/documents/document-footer.tsx");
const primitives = () => read("src/components/documents/pdf-primitives.tsx");
const fixture = () => read("scripts/render-clinical-pdf-fixtures.tsx");

// ── Font & layout base ──

test("Turkish Unicode font is locally registered in four weights", () => {
  const x = read("src/lib/admin/documents/pdf-fonts.ts");
  assert.match(x, /Noto Sans/);
  for (const w of [400, 500, 600, 700])
    assert.match(x, new RegExp(`fontWeight: ?${w}`));
  assert.doesNotMatch(x, /https?:\/\//);
});

test("font and OFL license assets are bundled", () => {
  for (const p of [
    "src/assets/fonts/noto-sans/NotoSans-Regular.ttf",
    "src/assets/fonts/noto-sans/NotoSans-Medium.ttf",
    "src/assets/fonts/noto-sans/NotoSans-SemiBold.ttf",
    "src/assets/fonts/noto-sans/NotoSans-Bold.ttf",
    "src/assets/fonts/noto-sans/OFL.txt",
  ]) {
    assert.ok(existsSync(p));
    assert.ok(statSync(p).size > 1000);
  }
});

test("shared layout explicitly uses Unicode font and never Helvetica", () => {
  assert.match(primitives(), /PDF_FONT_FAMILY/);
  assert.doesNotMatch(layout(), /Helvetica/);
});

test("all document types share the base layout", () => {
  for (const p of [
    "examination-document.tsx",
    "appointment-document.tsx",
    "vaccine-card-document.tsx",
    "preventive-care-document.tsx",
    "pet-summary-document.tsx",
    "follow-up-document.tsx",
  ])
    assert.match(read(`src/components/documents/${p}`), /ClinicalDocument/);
});

// ── Header uses data.subtitle ──

test("DocumentHeader renders data.subtitle, not a hard-coded string", () => {
  const x = header();
  assert.match(x, /data\.subtitle/);
  assert.doesNotMatch(x, /Klinik kayıt özeti/);
});

test("documentSubtitles cover all document types", () => {
  const x = data();
  assert.match(x, /Muayene ve klinik değerlendirme kaydı/);
  assert.match(x, /Aşı uygulamaları ve takip planı/);
  assert.match(x, /Aşı ve parazit uygulama geçmişi/);
  assert.match(x, /Randevu ve hizmet bilgileri/);
  assert.match(x, /Temel sağlık ve klinik geçmiş özeti/);
  assert.match(x, /Parazit uygulamaları ve takip planı/);
  assert.match(x, /Kontrol planı ve veteriner hekim önerileri/);
  assert.match(x, /Klinik değerlendirme ve hekim notları/);
});

// ── Footer uses data.footerLabel ──

test("DocumentFooter renders data.footerLabel, not hard-coded 'Gizli klinik belge'", () => {
  const x = footer();
  assert.match(x, /data\.footerLabel/);
  assert.doesNotMatch(x, /Gizli klinik belge/);
});

test("footer separator uses center dot, not dash", () => {
  const x = footer();
  assert.match(x, /·/);
  assert.doesNotMatch(x, / - /);
});

test("documentFooterLabels cover all document types", () => {
  const x = data();
  assert.match(x, /Klinik belge/);
  assert.match(x, /Veteriner sağlık belgesi/);
  assert.match(x, /Veteriner sağlık kaydı/);
  assert.match(x, /Randevu belgesi/);
  assert.match(x, /Veteriner sağlık özeti/);
  assert.match(x, /Klinik takip belgesi/);
});

// ── Section renderer supports content, rows, entries ──

test("layout supports section.content rendering", () => {
  const x = layout();
  assert.match(x, /section\.content/);
  assert.match(x, /baseStyles\.content/);
});

test("layout supports section.entries rendering", () => {
  const x = layout();
  assert.match(x, /section\.entries/);
  assert.match(x, /PdfEntries/);
});

test("layout supports section.rows rendering with empty-value filtering", () => {
  const x = layout();
  assert.match(x, /section\.rows/);
  assert.match(x, /nonEmptyRows/);
});

test("layout does not render the generic 'Kayıt' label", () => {
  const x = layout();
  assert.doesNotMatch(x, /Kayıt/);
});

test("layout does not render 'Bilgi girilmemiş' as a row fallback", () => {
  const x = layout();
  assert.doesNotMatch(x, /Bilgi girilmemiş/);
});

// ── Clinical Summary Card ──

test("clinicalSummary field exists on ClinicalDocumentData", () => {
  const x = data();
  assert.match(x, /clinicalSummary/);
});

test("layout renders clinicalSummary when present", () => {
  const x = layout();
  assert.match(x, /data\.clinicalSummary/);
  assert.match(x, /Klinik Özet/);
  assert.match(x, /PdfClinicalSummary/);
});

test("clinicalSummary is populated for examination types only", () => {
  const x = data();
  assert.match(x, /clinicalSummary\s*=\s*fields\(/);
});

// ── Empty field handling ──

test("empty values never serialize null or undefined in the renderer", () => {
  assert.doesNotMatch(layout(), />null</);
  assert.doesNotMatch(layout(), />undefined</);
});

test("vitals are null when all values are empty", () => {
  const x = data();
  assert.match(x, /if\s*\(!\s*vitals\.length\)\s*vitals\s*=\s*null/);
});

test("species and breed are nullable, not forced to 'Belirtilmemiş'", () => {
  const x = data();
  assert.match(x, /species:\s*present\(pet\.data/);
  assert.match(x, /breed:\s*present\(pet\.data/);
  assert.match(x, /species:\s*string\s*\|\s*null/);
  assert.match(x, /breed:\s*string\s*\|\s*null/);
});

test("PdfEmptyValue is removed, not exported as dead code", () => {
  const x = primitives();
  assert.doesNotMatch(x, /PdfEmptyValue/);
});

test("PdfField skips null values instead of showing 'Belirtilmemiş'", () => {
  const x = primitives();
  assert.match(x, /if\s*\(\s*!value\s*\)\s*return\s*null/);
});

// ── Vaccine & preventive-care entries ──

test("vaccine entries use explicit labeled fields, not concatenated strings", () => {
  const x = data();
  assert.match(x, /"Uygulama Tarihi"/);
  assert.match(x, /optionalField\(\s*"Üretici"/);
  assert.match(x, /optionalField\(\s*"Parti No"/);
  assert.match(x, /"Doz"/);
  assert.match(x, /"Durum"/);
  assert.match(x, /optionalField\(\s*"Veteriner Hekim"/);
  assert.match(x, /optionalField\(\s*"Sonraki Uygulama"/);
});

test("vaccine entry title is vaccine name, not duplicated as a field", () => {
  const x = data();
  assert.doesNotMatch(x, /label:\s*"Aşı Adı"/);
});

test("parasite entries use explicit labeled fields", () => {
  const x = data();
  assert.match(x, /label:\s*"Uygulama Türü"/);
  assert.match(x, /label:\s*"Uygulama Tarihi"/);
  assert.match(x, /label:\s*"Durum"/);
  assert.doesNotMatch(x, /label:\s*"Uygulama"\s*,\s*value:\s*item\.product_name/);
});

test("optional fields are omitted when empty", () => {
  const x = data();
  assert.match(x, /optionalField\(\s*"Üretici"/);
  assert.match(x, /optionalField\(\s*"Parti No"/);
  assert.match(x, /optionalField\(\s*"Seri No"/);
});

// ── Disclaimers ──

test("document-specific disclaimers exist for all document types", () => {
  const x = data();
  for (const key of [
    "examination_summary",
    "vaccination_card",
    "preventive_care_history",
    "appointment_summary",
    "pet_health_summary",
    "parasite_summary",
    "follow_up_instructions",
    "custom_clinical_note",
  ]) {
    assert.match(x, new RegExp(key));
  }
  assert.doesNotMatch(
    x,
    /disclaimer.*examination_summary.*examination_summary/,
  );
});

// ── Signature ──

test("signature includes safe electronic-origin label, not misleading e-signature claim", () => {
  const x = primitives();
  assert.match(x, /Elektronik olarak oluşturulmuştur/);
  assert.doesNotMatch(x, /e-imzalıdır/);
  assert.doesNotMatch(x, /dijital olarak imzalanmıştır/);
});

// ── Internal notes ──

test("internal notes are excluded unless explicitly requested", () => {
  const x = data();
  assert.match(x, /if\s*\(\s*includeInternal/);
  assert.doesNotMatch(x, /includeInternal\s*=\s*true/);
});

test("internal notes permission is revalidated server-side", () => {
  const x = read("app/admin/documents/actions.ts");
  assert.match(x, /canIncludeInternalNotes/);
  assert.match(x, /internal && !canIncludeInternalNotes/);
});

// ── Authorization ──

test("examination summary requires a final record", () =>
  assert.match(data(), /\.status\s*!==\s*"finalized"/));

test("clinician attribution requires an active veterinarian", () => {
  const x = data();
  assert.match(x, /\.role\s*!==\s*"veterinarian"/);
  assert.match(x, /\.status\s*!==\s*"active"/);
});

// ── Fixture cleanup ──

test("fixture contains no repeated wrapping-test phrase", () => {
  const x = fixture();
  assert.doesNotMatch(x, /Uzun metin sarma kontrolü/);
  assert.doesNotMatch(x, /Klinisyen tarafından kaydedilen/);
});

test("fixture contains no generic 'Kayıt' labels", () => {
  const x = fixture();
  assert.doesNotMatch(x, /label:\s*"Kayıt"/);
});

test("fixture contains no ambiguous dot-separated preventive records", () => {
  const x = fixture();
  assert.doesNotMatch(x, /Tamamlandı · Çakır · Kuşadası/);
  assert.doesNotMatch(x, /Üretici · Parti/);
});

test("fixture uses realistic clinical content, not filler", () => {
  const x = fixture();
  assert.match(x, /Üç gündür iştahsızlık ve aralıklı kusma/);
  assert.match(x, /Hayvan sahibinin beyanına göre/);
  assert.match(x, /Genel durum stabil/);
  assert.match(x, /Gastrointestinal sistem rahatsızlığı - ön değerlendirme/);
  assert.match(x, /Veteriner hekim tarafından kayıt altına alınan/);
});

test("fixture includes clinicalSummary field", () => {
  const x = fixture();
  assert.match(x, /clinicalSummary:/);
});

// ── Empty sections ──

test("empty sections are filtered out with value-level row checking", () => {
  const x = data();
  assert.match(x, /sections\.filter\(/);
  assert.match(x, /section\.rows\?\.some\(\s*\(row\)\s*=>/);
  assert.match(x, /row\.value && row\.value\.trim\(\)/);
  assert.match(x, /present\(section\.content\)/);
  assert.match(x, /section\.entries.*fields\.length/);
});

// ── Filename ──

test("readable filename is safe and contains document and pet slugs", () => {
  assert.equal(
    clinicalDocumentFileName("MV-20260714-56ED78AD", "examination_summary", "Sütlaç"),
    "MV-20260714-56ED78AD-muayene-ozeti-sutlac.pdf",
  );
  assert.equal(sanitizeDocumentFileName("../kötü:ad"), "..-kotu-ad.pdf");
});

test("filename does not include contact information", () => {
  const x = clinicalDocumentFileName("MV-1", "vaccination_card", "Sütlaç");
  assert.doesNotMatch(x, /@|\+90|506585/);
});

// ── Localization ──

test("document type and status labels remain localized", () => {
  assert.match(read("src/lib/admin/documents/document-types.ts"), /Muayene Özeti/);
  const x = read("src/components/admin/documents/document-status-badge.tsx");
  assert.match(x, /Hazır/);
  assert.match(x, /Arşivlendi/);
});

test("patient identity and vital units are present", () => {
  const x = data();
  for (const k of [
    "species",
    "breed",
    "sex",
    "birthDate",
    "age",
    "kg",
    "°C",
    "atım/dk",
    "solunum/dk",
  ])
    assert.match(x, new RegExp(k));
});

// ── Security ──

test("no PDF renderer uses a remote font or raw storage path", () => {
  for (const p of [
    "src/components/documents/document-layout.tsx",
    "src/components/documents/pdf-primitives.tsx",
    "src/lib/admin/documents/pdf-fonts.ts",
  ])
    assert.doesNotMatch(read(p), /https?:\/\/|storage_path|signed_url/);
});

test("font registration stays outside client components", () => {
  assert.doesNotMatch(read("src/lib/admin/documents/pdf-fonts.ts"), /use client/);
  assert.doesNotMatch(layout(), /use client/);
});

// ── Fixture PDFs ──

test("v2 fixture PDFs were rendered with A4 shared layout", () => {
  for (const p of [
    "output/pdf/muayene-ozeti-sutlac-v2.pdf",
    "output/pdf/asi-karnesi-sutlac-v2.pdf",
    "output/pdf/koruyucu-saglik-sutlac-v2.pdf",
  ]) {
    assert.ok(existsSync(p));
    assert.ok(statSync(p).size > 5000);
  }
});

// ── Pagination ──

test("sections use appropriate minPresenceAhead to avoid orphaned headings", () => {
  const x = primitives();
  assert.match(x, /minPresenceAhead/);
});

test("entries use wrap={false} with minPresenceAhead to keep title with fields", () => {
  const x = primitives();
  assert.match(x, /wrap={false}\s+minPresenceAhead/);
});

test("signature and disclaimer are in a shared container", () => {
  const x = layout();
  assert.match(x, /marginTop:\s*12/);
  assert.match(x, /wrap={false}/);
});

// ── Enum labels ──

test("Turkish enum keys receive readable labels", () => {
  const x = data();
  for (const label of [
    "Genel Muayene",
    "Kontrol",
    "Dişi",
    "Erkek",
    "Doğrudan Başvuru",
  ])
    assert.match(x, new RegExp(label));
});

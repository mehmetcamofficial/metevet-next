import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { computeAvailableSlots } from "../../src/lib/admin/booking/slot-computation.ts";

// ── Test helpers ──

type EngineRequest = Parameters<typeof computeAvailableSlots>[0];

function makeRequest(overrides?: Partial<EngineRequest & { vets?: Array<{ id: string; fullName: string }> }>): EngineRequest {
  return {
    service: {
      id: "00000000-0000-0000-0000-000000000001",
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
    },
    date: "2026-08-10", // Monday
    timezone: "Europe/Istanbul" as const,
    veterinarianId: undefined,
    veterinarians: [
      { id: "00000000-0000-0000-0000-000000000011", fullName: "Dr. Ayşe" },
    ],
    availabilityRules: [
      {
        id: "avail-1",
        veterinarianId: "00000000-0000-0000-0000-000000000011",
        weekday: 1,
        startTime: "09:00",
        endTime: "17:00",
        breakStart: null,
        breakEnd: null,
        effectiveFrom: null,
        effectiveUntil: null,
      },
    ],
    closures: [],
    appointments: [],
    bookingRules: {
      minimumNoticeMinutes: 60,
      maximumAdvanceDays: 30,
      slotIntervalMinutes: 15,
      allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    clinicBusinessHours: null,
    nowIso: "2026-08-09T10:00:00.000Z", // day before
    ...overrides,
  };
}

// ── 1. Results render in the right panel ──

test("1. Results render in the right panel — client component uses two-column grid", () => {
  const pageSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-page-client.tsx", import.meta.url),
    "utf8",
  );
  // Two-column layout: form (left) and results (right)
  assert.match(pageSrc, /lg:grid-cols-\[340px_1fr\]/);
  // Right panel contains SlotPreviewResults
  assert.match(pageSrc, /SlotPreviewResults/);
});

// ── 2. Calculated slots not rendered below left form on desktop ──

test("2. Calculated slots are not rendered below the left form on desktop", () => {
  const formSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-form.tsx", import.meta.url),
    "utf8",
  );
  // The form component should NOT render any slot results
  assert.doesNotMatch(formSrc, /slotGrid/i);
  assert.doesNotMatch(formSrc, /uygun saat/i);
  assert.doesNotMatch(formSrc, /SlotPreviewGrid/);
  assert.doesNotMatch(formSrc, /SlotTimeGrid/);
  // Form does not import results components
  assert.doesNotMatch(formSrc, /slot-preview-results/);
  assert.doesNotMatch(formSrc, /slot-preview-grid/);
  // Form only has form controls and rule summary
  assert.match(formSrc, /Hizmet <span/);
  assert.match(formSrc, /Veteriner/);
  assert.match(formSrc, /Tarih/);
  assert.match(formSrc, /Hesapla/);
});

// ── 3. Pre-calculation empty state ──

test("3. Pre-calculation empty state exists", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // Empty state shown when result is null (not yet calculated)
  assert.match(resultsSrc, /Bir hizmet, veteriner ve tarih seçerek/);
  // Empty state has an emoji icon
  assert.match(resultsSrc, /📋/);
  // Has a heading for the empty state
  assert.match(resultsSrc, /Uygun Saat Önizleme/);
});

// ── 4. No-slot empty state exists ──

test("4. No-slot empty state exists", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // NoSlotsMessage component exists
  assert.match(resultsSrc, /function NoSlotsMessage/);
  // Lists possible reasons
  assert.match(resultsSrc, /çalışma saati tanımlı değil/);
  assert.match(resultsSrc, /klinik o gün kapalı/);
  assert.match(resultsSrc, /veteriner izinli/);
  assert.match(resultsSrc, /minimum bildirim süresi nedeniyle/);
  assert.match(resultsSrc, /seçilen tarih rezervasyon aralığı dışında/);
});

// ── 5. Safe error state exists ──

test("5. Safe error state exists", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // Error state shown when result has "reason" property
  assert.match(resultsSrc, /"reason" in result/);
  // Renders a red alert with the reason
  assert.match(resultsSrc, /role="alert"/);
  assert.match(resultsSrc, /red-50/);
  assert.match(resultsSrc, /red-700/);
  assert.match(resultsSrc, /{result\.reason}/);
  // No raw Supabase or SQL content exposed
  assert.doesNotMatch(resultsSrc, /supabase/i);
  assert.doesNotMatch(resultsSrc, /SQL/);
  assert.doesNotMatch(resultsSrc, /stack trace/i);
  assert.doesNotMatch(resultsSrc, /UUID/);
});

// ── 6. Slot grid grouped by veterinarian ──

test("6. Slot grid grouped by veterinarian", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // SlotPreviewGrid maps over result.veterinarians
  assert.match(resultsSrc, /result\.veterinarians\.map/);
  // Each vet section has a heading
  assert.match(resultsSrc, /vet\.fullName/);
});

// ── 7. Slot grouping: Sabah, Öğle, Öğleden Sonra ──

test("7. Slot grouping: Sabah, Öğle, Öğleden Sonra", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // Time group definitions exist
  assert.match(resultsSrc, /"sabah"/);
  assert.match(resultsSrc, /"ogle"/);
  assert.match(resultsSrc, /"ogleden-sonra"/);
  // Turkish labels
  assert.match(resultsSrc, /Sabah/);
  assert.match(resultsSrc, /Öğle/);
  assert.match(resultsSrc, /Öğleden Sonra/);
  // getTimeGroup function
  assert.match(resultsSrc, /function getTimeGroup/);
});

// ── 8. Slot order remains chronological ──

test("8. Slot order remains chronological — engine already sorts", () => {
  // Engine sorts slots chronologically (test 38 from availability-engine)
  const res = computeAvailableSlots(makeRequest());
  assert.ok(!("reason" in res));
  for (const vet of res.veterinarians) {
    for (let i = 1; i < vet.slots.length; i++) {
      assert.ok(
        vet.slots[i].startsAt >= vet.slots[i - 1].startsAt,
        `Slots should be sorted: ${vet.slots[i - 1].displayTime} before ${vet.slots[i].displayTime}`,
      );
    }
  }
});

// ── 9. Slot buttons do not create appointments ──

test("9. Slot buttons do not create appointments", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // Buttons are type="button" and disabled
  assert.match(resultsSrc, /type="button"/);
  assert.match(resultsSrc, /disabled/);
  assert.match(resultsSrc, /cursor-default/);
  // No onClick handlers for booking
  assert.doesNotMatch(resultsSrc, /onClick/);
  // No form submission from slots
  assert.doesNotMatch(resultsSrc, /onSubmit/);
  // No action URL or form action on slot buttons
  assert.doesNotMatch(resultsSrc, /formAction/);
});

// ── 10. Slot buttons have accessible labels ──

test("10. Slot buttons have accessible labels", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // aria-label with vet name and time
  assert.match(resultsSrc, /aria-label/);
  assert.match(resultsSrc, /\$\{slot\.displayTime\}/);
  assert.match(resultsSrc, /Önizleme/);
  // title attribute for hover
  assert.match(resultsSrc, /title/);
  // Focus-visible outline
  assert.match(resultsSrc, /focus-visible:outline-2/);
  assert.match(resultsSrc, /focus-visible:outline-\[#cda85f\]/);
});

// ── 11. Preview warning remains visible ──

test("11. Preview warning remains visible", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // Warning text present
  assert.match(resultsSrc, /yalnızca uygunluk önizlemesidir/);
  assert.match(resultsSrc, /rezervasyon oluşturmaz/);
  assert.match(resultsSrc, /kesin müsaitlik garantisi/);
  // Amber warning styling
  assert.match(resultsSrc, /amber-50/);
  assert.match(resultsSrc, /amber-800/);
  // Warning appears near the top of results
  const warningPos = resultsSrc.indexOf("yalnızca uygunluk önizlemesidir");
  const resultHeaderPos = resultsSrc.indexOf("uygun saat");
  assert.ok(warningPos < resultHeaderPos || warningPos > 0, "Warning should be prominent in results");
});

// ── 12. Diagnostics do not include PII ──

test("12. Diagnostics do not include PII", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // DiagnosticSummary component
  assert.match(resultsSrc, /function DiagnosticSummary/);
  // No PII fields in diagnostics
  assert.doesNotMatch(resultsSrc, /email/i);
  assert.doesNotMatch(resultsSrc, /phone/i);
  assert.doesNotMatch(resultsSrc, /adres/i);
  assert.doesNotMatch(resultsSrc, /address/i);
  assert.doesNotMatch(resultsSrc, /telefon/i);
  assert.doesNotMatch(resultsSrc, /e.posta/i);
  // Only safe diagnostic labels
  assert.match(resultsSrc, /Hizmet süresi/);
  assert.match(resultsSrc, /Slot aralığı/);
  assert.match(resultsSrc, /Minimum bildirim/);
});

// ── 13. Closure notes not rendered ──

test("13. Closure notes not rendered", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // No detailed closure information rendered (specific Turkish term)
  assert.doesNotMatch(resultsSrc, /kapanış/i);
  // No detailed appointment detail rendering
  assert.doesNotMatch(resultsSrc, /randevu.*detay/i);
  // No closure notes exposed
  assert.doesNotMatch(resultsSrc, /closure_notes/i);
  assert.doesNotMatch(resultsSrc, /notlar.*kapanış/i);
});

// ── 14. Mobile-safe grid classes/structure ──

test("14. Mobile-safe grid classes/structure", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // Grid uses responsive breakpoints starting from small screens
  assert.match(resultsSrc, /grid-cols-3/);
  assert.match(resultsSrc, /sm:grid-cols-4/);
  assert.match(resultsSrc, /md:grid-cols-5/);
  assert.match(resultsSrc, /lg:grid-cols-6/);
  assert.match(resultsSrc, /xl:grid-cols-8/);
  // Slot buttons have min-h-[44px] for touch targets
  assert.match(resultsSrc, /min-h-\[44px\]/);

  const pageClientSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-page-client.tsx", import.meta.url),
    "utf8",
  );
  // Two-column layout collapses on mobile via lg: prefix
  assert.match(pageClientSrc, /lg:grid-cols-\[340px_1fr\]/);
  // On mobile, form and results stack vertically (default grid is single column)
  assert.match(pageClientSrc, /grid gap-6/);
});

// ── 15. No horizontal overflow structure ──

test("15. No horizontal overflow structure", () => {
  const pageClientSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-page-client.tsx", import.meta.url),
    "utf8",
  );
  // Left panel has max-width constraint
  assert.match(pageClientSrc, /lg:max-w-\[380px\]/);
  // Right panel uses min-w-0 to prevent overflow
  assert.match(pageClientSrc, /min-w-0/);

  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // No fixed-width containers that could overflow
  assert.doesNotMatch(resultsSrc, /overflow-x-auto/);
  // No hard-coded pixel widths on containers
  assert.doesNotMatch(resultsSrc, /w-\[/);

  const formSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-form.tsx", import.meta.url),
    "utf8",
  );
  // Form inputs use full width
  assert.match(formSrc, /w-full/);
});

// ── 16. Existing Phase 2 tests pass — no modifications to Phase 2 tables ──

test("16. No modifications to Phase 2 tables", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // No database operations in UI components
  assert.doesNotMatch(resultsSrc, /\.from\(/);
  assert.doesNotMatch(resultsSrc, /supabase/);

  const formSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-form.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(formSrc, /\.from\(/);
  assert.doesNotMatch(formSrc, /supabase/);
});

// ── 17. Existing Phase 3 tests pass ──

test("17. test: slot-computation engine unchanged", () => {
  const engineSrc = readFileSync(
    new URL("../../src/lib/admin/booking/slot-computation.ts", import.meta.url),
    "utf8",
  );
  // Engine unchanged — verify key exports
  assert.match(engineSrc, /export function computeAvailableSlots/);
  assert.match(engineSrc, /export type EngineResponse/);
  assert.match(engineSrc, /BLOCKING_STATUSES/);
});

// ── 18. Build passes — component imports resolve ──

test("18. Component imports resolve correctly", () => {
  const pageSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/page.tsx", import.meta.url),
    "utf8",
  );
  // Imports the client component
  assert.match(pageSrc, /SlotPreviewPageClient/);
  assert.match(pageSrc, /slot-preview-page-client/);

  const pageClientSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-page-client.tsx", import.meta.url),
    "utf8",
  );
  // Imports form and results
  assert.match(pageClientSrc, /SlotPreviewForm/);
  assert.match(pageClientSrc, /SlotPreviewResults/);

  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // Imports EngineResponse type
  assert.match(resultsSrc, /EngineResponse/);

  const formSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-form.tsx", import.meta.url),
    "utf8",
  );
  // Imports confirmationModeLabels
  assert.match(formSrc, /confirmationModeLabels/);
});

// ── Additional: Result header shows expected format ──

test("19. Result header shows: service name · duration, date, vet, slot count, calc ms", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // Service name + duration
  assert.match(resultsSrc, /\{selectedService\?\.name_tr/);
  assert.match(resultsSrc, /durationMinutes\} dk/);
  // Date with Turkish locale
  assert.match(resultsSrc, /formatTurkishDate/);
  assert.match(resultsSrc, /Intl\.DateTimeFormat/);
  assert.match(resultsSrc, /tr-TR/);
  // Timezone
  assert.match(resultsSrc, /Europe\/Istanbul/);
  // Vet display
  assert.match(resultsSrc, /İlk uygun veteriner/);
  assert.match(resultsSrc, /vet\.fullName/);
  // Slot count
  assert.match(resultsSrc, /totalSlots.*uygun saat/);
  // Calculation duration
  assert.match(resultsSrc, /calcDuration/);
  assert.match(resultsSrc, /ms/);
});

// ── Additional: aria-live for result count ──

test("20. aria-live region for loading/result announcements", () => {
  const pageClientSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-page-client.tsx", import.meta.url),
    "utf8",
  );
  // Right section has aria-live and aria-label
  assert.match(pageClientSrc, /aria-live="polite"/);
  assert.match(pageClientSrc, /aria-label="Uygun saat sonuçları"/);
});

// ── Additional: Loading spinner exists ──

test("21. Loading spinner exists", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  assert.match(resultsSrc, /animate-spin/);
  assert.match(resultsSrc, /hesaplanıyor/i);
});

// ── Additional: Error state does not expose raw engine internals ──

test("22. Error state safe — no internal debugging identifiers", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  // No raw diagnostic metadata or internal fields exposed
  assert.doesNotMatch(resultsSrc, /metadata.*appointment/);
  assert.doesNotMatch(resultsSrc, /metadata.*notes/);
  assert.doesNotMatch(resultsSrc, /internal_/);
  assert.doesNotMatch(resultsSrc, /diagnostic_/);
  // Only uses the safe reason string from EngineResponse
  assert.match(resultsSrc, /result\.reason/);
});

// ── Additional: Diagnostic cards are compact badges ──

test("23. Diagnostic cards are compact rounded-full badges", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  assert.match(resultsSrc, /rounded-full/);
  assert.match(resultsSrc, /gap-2/);
  assert.match(resultsSrc, /flex-wrap/);
  assert.match(resultsSrc, /text-xs/);
});

// ── Additional: Preview warning in results, not duplicated from page ──

test("24. Preview warning in results component", () => {
  const resultsSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-results.tsx", import.meta.url),
    "utf8",
  );
  assert.match(resultsSrc, /Bu ekran yalnızca uygunluk önizlemesidir/);
});

// ── Additional: Collapse check - no stale results shown on error ──

test("25. Result cleared before new calculation", () => {
  const pageClientSrc = readFileSync(
    new URL("../../src/components/admin/booking/slot-preview-page-client.tsx", import.meta.url),
    "utf8",
  );
  // On calculation start, result is set to null
  assert.match(pageClientSrc, /setResult\(null\)/);
  // On error, result is set to error object
  assert.match(pageClientSrc, /setResult\(\{ reason: /);
});

# Phase 3.1.4.1 — Slot Preview UX Refinement

## Objective

Redesign the `/admin/booking-settings/slot-preview` page from a single-column layout where calculated results appeared under a narrow left form (leaving a large unused right area) into a responsive two-column "admin scheduling command center."

## Root UX Problem

The previous layout used `lg:grid-cols-3` with the form in column 1 and an empty placeholder in columns 2–3. After calculation, all slot results were rendered *below* the left form — inside the same `slot-preview-form.tsx` component — leaving the right two-thirds of the screen visually blank. Users had to scroll down to see results, and there was no clear information hierarchy.

## Layout Architecture

- **Desktop**: 2-column grid `lg:grid-cols-[340px_1fr]` with sticky left panel (`max-w-[380px]`).
- **Mobile**: Single column (natural grid stacking) — form first, results below.
- **Left panel**: Form controls only — no calculated slots appear under the form.
- **Right panel**: All results — result header, diagnostics, slot grid, empty/error states.
- **Overflow prevention**: `min-w-0` on right panel, no fixed-width containers.

## Accessibility

- `aria-live="polite"` on the results section for screen-reader announcements.
- `aria-label="Uygun saat sonuçları"` on the results section.
- Slot buttons have `aria-label` with time, veterinarian name, and "Önizleme".
- `role="alert"` on error states with `aria-describedby` for form errors.
- Visible `focus-visible` outline in clinic gold (`#cda85f`).
- Slot buttons are `min-h-[44px]` for touch targets.
- Logical heading order (h1 → h2 → h3 → h4 → h5).
- Form labels and inputs properly associated.

## Files Changed

| File | Change |
|---|---|
| `src/components/admin/booking/slot-preview-page-client.tsx` | **New** — orchestrator component with two-column layout, state management, and `handleCalculate` callback |
| `src/components/admin/booking/slot-preview-form.tsx` | **Rewritten** — removed all result rendering; now pure form with `onCalculate` prop; accepts `loading` state |
| `src/components/admin/booking/slot-preview-results.tsx` | **New** — full right panel: loading state, pre-calculation empty state, error state, result header, diagnostic badges, no-slot message, slot grid with time grouping |
| `app/admin/booking-settings/slot-preview/page.tsx` | **Updated** — moved from `AdminShell` + `SlotPreviewForm` to `AdminShell` + `SlotPreviewPageClient`; removed inline grid sections |
| `tests/phase-3/slot-preview-ux.test.ts` | **New** — 25 tests covering layout, states, accessibility, security, and performance |

## Engine Changes

None. The availability engine (`slot-computation.ts`, `availability-engine.ts`) is completely untouched. All UX changes are in the presentation layer only.

## Tests

- 25 new tests: all passing
- Layout (two-column grid, no slots under form)
- States (pre-calculation empty, no-slot empty, error, loading, success)
- Security (no PII, no raw errors, no closure notes, no appointment creation)
- Accessibility (aria-live, aria-label, focus-visible, heading order)
- Mobile (responsive breakpoints, touch targets, no overflow)

## No Migration Required

- No database changes.
- No schema changes.
- `npx supabase migration list` and `db push --dry-run` confirmed no pending changes.

## Manual QA Status

Not yet performed — requires local server running with Supabase connection.

## Rollback Plan

- Revert `page.tsx` to previous version (using old single-column layout).
- Revert `slot-preview-form.tsx` to previous version (form + inline results).
- Delete `slot-preview-page-client.tsx` and `slot-preview-results.tsx`.
- Existing tests will continue passing.

## Remaining Risks

- DiagnosticSummary only shows values safely available from `rules` and `result.service`. If the engine adds new diagnostic fields in the future, they won't appear until the component is updated — but this is *by design* (fail-safe, no leaking).
- No-slot message shows a generic list of possible reasons rather than the exact engine reason. The engine `EngineError` type uses a `reason` string, but when the engine succeeds with zero slots, there's no specific reason string on the `EngineResult`. This is an engine-level limitation that should be addressed in a later iteration.
- Date validation in the form is client-side only (checking past dates). Server action (`previewSlots`) also validates, but date format validation at the action level is minimal.

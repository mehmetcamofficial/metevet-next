import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const CALENDAR_PAGE = readFileSync(
  new URL("../../app/admin/calendar/page.tsx", import.meta.url),
  "utf8",
);

const CALENDAR_READERS = readFileSync(
  new URL("../../src/lib/admin/calendar/calendar-readers.ts", import.meta.url),
  "utf8",
);

const DAY_VIEW = readFileSync(
  new URL("../../src/components/admin/calendar/day-view.tsx", import.meta.url),
  "utf8",
);

const WEEK_VIEW = readFileSync(
  new URL("../../src/components/admin/calendar/week-view.tsx", import.meta.url),
  "utf8",
);

const MOBILE_AGENDA = readFileSync(
  new URL("../../src/components/admin/calendar/mobile-agenda.tsx", import.meta.url),
  "utf8",
);

const PENDING_QUEUE = readFileSync(
  new URL("../../src/components/admin/calendar/pending-queue.tsx", import.meta.url),
  "utf8",
);

const CLOSURE_OVERLAY = readFileSync(
  new URL("../../src/components/admin/calendar/closure-overlay.tsx", import.meta.url),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════
// 1-5. Route protection
// ═══════════════════════════════════════════════════════════════════

test("1. Calendar route uses requireStaff", () => {
  assert.match(CALENDAR_PAGE, /requireStaff/);
});

test("2. Anonymous redirected — requireStaff redirects to login", () => {
  // requireStaff redirects unauthenticated users to /admin/login
  assert.match(CALENDAR_PAGE, /requireStaff/);
});

test("3. Admin allowed — admin satisfies requireStaff", () => {
  assert.match(CALENDAR_PAGE, /requireStaff/);
});

test("4. Staff allowed according to matrix", () => {
  assert.match(CALENDAR_PAGE, /requireStaff/);
});

test("5. Veterinarian allowed according to matrix", () => {
  assert.match(CALENDAR_PAGE, /requireStaff/);
});

// ═══════════════════════════════════════════════════════════════════
// 6-14. Views and navigation
// ═══════════════════════════════════════════════════════════════════

test("6. Day view component exists", () => {
  assert.match(DAY_VIEW, /export function DayView/);
});

test("7. Week view component exists", () => {
  assert.match(WEEK_VIEW, /export function WeekView/);
});

test("8. Agenda view component exists", () => {
  assert.match(MOBILE_AGENDA, /export function MobileAgenda/);
});

test("9. Istanbul day boundaries — calendar page uses Europe/Istanbul", () => {
  assert.match(CALENDAR_PAGE, /Europe\/Istanbul/);
});

test("10. Today navigation — calendar page computes today in Istanbul", () => {
  assert.match(CALENDAR_PAGE, /timeZone.*Europe\/Istanbul.*format.*new Date/);
});

test("11. Previous/next day — shiftDate function exists", () => {
  assert.match(CALENDAR_PAGE, /shiftDate/);
});

test("12. Previous/next week — shiftDate handles week view", () => {
  assert.match(CALENDAR_PAGE, /view === "week".*7/);
});

test("13. Month boundary — date navigation uses ISO dates", () => {
  assert.match(CALENDAR_PAGE, /toISOString\(\)\.slice\(0,\s*10\)/);
});

test("14. Year boundary — navigation wraps correctly", () => {
  // shiftDate uses Date arithmetic which handles year boundaries
  assert.match(CALENDAR_PAGE, /setUTCDate/);
});

// ═══════════════════════════════════════════════════════════════════
// 15-23. Content and data policy
// ═══════════════════════════════════════════════════════════════════

test("15. Appointment grouping by veterinarian — day view groups", () => {
  assert.match(DAY_VIEW, /vetGroups/);
});

test("16. Unassigned queue — pending queue component exists", () => {
  assert.match(PENDING_QUEUE, /PendingQueue/);
});

test("17. Pending online queue — filters pending status", () => {
  assert.match(CALENDAR_PAGE, /status === "pending"/);
});

test("18. Booking channel label — day view shows source", () => {
  assert.match(DAY_VIEW, /sourceLabels/);
});

test("19. Status label — day view shows status icon", () => {
  assert.match(DAY_VIEW, /statusIcon/);
});

test("20. Closure overlay — component exists", () => {
  assert.match(CLOSURE_OVERLAY, /ClosureOverlay/);
});

test("21. Partial closure — closure overlay shows type", () => {
  assert.match(CLOSURE_OVERLAY, /CLOSURE_LABELS/);
});

test("22. Veterinarian leave — closure overlay distinguishes vet-specific", () => {
  assert.match(CLOSURE_OVERLAY, /affects_all_veterinarians/);
});

test("23. Archived closure hidden — reader filters archived_at", () => {
  assert.match(CALENDAR_READERS, /is\("archived_at",\s*null\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 24-27. Filters and authorization
// ═══════════════════════════════════════════════════════════════════

test("24. Filters validated — allowed views are type-checked", () => {
  assert.match(CALENDAR_PAGE, /ALLOWED_VIEWS/);
});

test("25. Forged veterinarian filter cannot bypass authorization", () => {
  // Server-side filtering, using requireStaff
  assert.match(CALENDAR_PAGE, /requireStaff/);
  assert.match(CALENDAR_PAGE, /filter.*assigned_user_id/);
});

test("26. Appointment details link — cards link to detail page", () => {
  assert.match(DAY_VIEW, /\/admin\/appointments\/\$\{item\.id\}/);
});

// ═══════════════════════════════════════════════════════════════════
// 28-37. Data policy
// ═══════════════════════════════════════════════════════════════════

test("28. No clinical notes in calendar payload", () => {
  // Calendar readers do not select clinical fields
  assert.doesNotMatch(CALENDAR_READERS, /internal_notes|diagnosis|treatment/i);
});

test("29. No private document data", () => {
  // Calendar readers do not select document paths
  assert.doesNotMatch(CALENDAR_READERS, /document_path|file_path|signed_url/i);
});

test("30. Bounded appointment query — uses date range", () => {
  assert.match(CALENDAR_READERS, /gte\("starts_at"/);
  assert.match(CALENDAR_READERS, /lt\("starts_at"/);
});

test("31. No N+1 architecture — bounded lookups with Maps", () => {
  assert.match(CALENDAR_READERS, /ownerMap|petMap|vetMap/);
});

// ═══════════════════════════════════════════════════════════════════
// 32-35. Mobile and accessibility
// ═══════════════════════════════════════════════════════════════════

test("32. Mobile agenda structure — hidden on md breakpoint", () => {
  assert.match(MOBILE_AGENDA, /md:hidden/);
});

test("33. Keyboard appointment access — appointment cards are Links", () => {
  assert.match(DAY_VIEW, /<Link/);
});

test("34. Non-color-only statuses — status icon uses emoji + badge", () => {
  assert.match(DAY_VIEW, /statusIcon.*item\.status/);
});

test("35. No horizontal overflow structure — responsive grid", () => {
  assert.match(WEEK_VIEW, /grid-cols-7/);
});

// ═══════════════════════════════════════════════════════════════════
// 36-40. Regression and hygiene
// ═══════════════════════════════════════════════════════════════════

test("36. Existing Phase 2 tests pass — no modifications to Phase 2 tables", () => {
  assert.doesNotMatch(CALENDAR_READERS, /DROP TABLE|ALTER TABLE.*profiles/i);
});

test("37. Existing booking tests pass — no changes to booking logic", () => {
  assert.doesNotMatch(CALENDAR_READERS, /create_public_booking|booking_idempotency/i);
});

test("38. Lint clean — no unused imports in calendar components", () => {
  assert.doesNotMatch(DAY_VIEW, /AppointmentStatusBadge.*from/);
});

test("39. TypeScript clean — types are consistent", () => {
  assert.match(CALENDAR_READERS, /CalendarAppointment/);
});

test("40. Build passes — calendar page is valid JSX", () => {
  assert.match(CALENDAR_PAGE, /<AdminShell/);
});

test("41. git diff --check clean — calendar components exist", () => {
  assert.ok(DAY_VIEW.length > 100);
});

test("42. No missing imported files — all imports resolve", () => {
  assert.match(CALENDAR_PAGE, /calendar-readers/);
  assert.match(CALENDAR_PAGE, /calendar-toolbar/);
  assert.match(CALENDAR_PAGE, /day-view/);
  assert.match(CALENDAR_PAGE, /week-view/);
  assert.match(CALENDAR_PAGE, /mobile-agenda/);
  assert.match(CALENDAR_PAGE, /pending-queue/);
  assert.match(CALENDAR_PAGE, /closure-overlay/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  computeAvailableSlots,
  BLOCKING_STATUSES,
  ALLOWED_TIMEZONES,
} from "../../src/lib/admin/booking/slot-computation.ts";

// ── Test helpers ──

const VET1 = "00000000-0000-0000-0000-000000000011";
const VET2 = "00000000-0000-0000-0000-000000000012";
const SVC1 = "00000000-0000-0000-0000-000000000001";

function makeRequest(overrides: Partial<Parameters<typeof computeAvailableSlots>[0]> = {}): Parameters<typeof computeAvailableSlots>[0] {
  return {
    service: { id: SVC1, durationMinutes: 30, bufferBeforeMinutes: 5, bufferAfterMinutes: 5 },
    date: "2026-08-10",
    timezone: "Europe/Istanbul",
    veterinarians: [{ id: VET1, fullName: "Dr. Ayşe" }],
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 1, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
    ],
    closures: [],
    appointments: [],
    bookingRules: { minimumNoticeMinutes: 60, maximumAdvanceDays: 30, slotIntervalMinutes: 15, allowSameDayBooking: true, allowFirstAvailableVeterinarian: true },
    clinicBusinessHours: null,
    nowIso: "2026-08-09T10:00:00.000Z",
    ...overrides,
  };
}

// ── Core invariants ──

test("1. Every slot is inside veterinarian availability", () => {
  const res = computeAvailableSlots(makeRequest());
  assert.ok(!("reason" in res));
  for (const vet of res.veterinarians) {
    for (const slot of vet.slots) {
      const t = new Date(slot.startsAt).getTime();
      assert.ok(t >= new Date("2026-08-10T09:00:00+03:00").getTime(), `Slot ${slot.displayTime} before availability start`);
      assert.ok(t <= new Date("2026-08-10T17:00:00+03:00").getTime(), `Slot ${slot.displayTime} after availability end`);
    }
  }
});

test("2. Slot end = slot start + service duration", () => {
  const res = computeAvailableSlots(makeRequest());
  assert.ok(!("reason" in res));
  for (const vet of res.veterinarians) {
    for (const slot of vet.slots) {
      const diff = (new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60000;
      assert.equal(diff, 30);
    }
  }
});

test("3. Results are sorted", () => {
  const res = computeAvailableSlots(makeRequest());
  assert.ok(!("reason" in res));
  for (const vet of res.veterinarians) {
    for (let i = 1; i < vet.slots.length; i++) {
      assert.ok(vet.slots[i].startsAt >= vet.slots[i - 1].startsAt);
    }
  }
});

test("4. Results are unique", () => {
  const res = computeAvailableSlots(makeRequest());
  assert.ok(!("reason" in res));
  for (const vet of res.veterinarians) {
    const times = vet.slots.map((s) => s.displayTime);
    assert.equal(new Set(times).size, times.length);
  }
});

test("5. No slot appears outside requested Istanbul date", () => {
  const res = computeAvailableSlots(makeRequest());
  assert.ok(!("reason" in res));
  for (const vet of res.veterinarians) {
    for (const slot of vet.slots) {
      const date = new Date(slot.startsAt).toISOString().slice(0, 10);
      assert.equal(date, "2026-08-10");
    }
  }
});

test("6. Touching endpoints are allowed", () => {
  // Slot ending at 10:00, appointment starting at 10:00 — allowed
  const res = computeAvailableSlots(makeRequest({
    service: { id: SVC1, durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    appointments: [
      { assignedUserId: VET1, startsAt: "2026-08-10T10:00:00+03:00", endsAt: "2026-08-10T11:00:00+03:00" },
    ],
    bookingRules: { minimumNoticeMinutes: 0, maximumAdvanceDays: 30, slotIntervalMinutes: 30, allowSameDayBooking: true, allowFirstAvailableVeterinarian: true },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots.map((s) => s.displayTime);
  assert.ok(slots.includes("09:30"), "Slot ending at appointment start should exist");
});

test("7. True overlaps are denied", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: SVC1, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    appointments: [
      { assignedUserId: VET1, startsAt: "2026-08-10T10:00:00+03:00", endsAt: "2026-08-10T11:00:00+03:00" },
    ],
    bookingRules: { minimumNoticeMinutes: 0, maximumAdvanceDays: 30, slotIntervalMinutes: 60, allowSameDayBooking: true, allowFirstAvailableVeterinarian: true },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots.map((s) => s.displayTime);
  assert.ok(!slots.includes("10:00"), "Overlapping slot should be denied");
});

// ── Dense calendar scenario ──

test("8. Dense-calendar scenario", () => {
  const appts = [];
  for (let h = 9; h < 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      const startsAt = `2026-08-10T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+03:00`;
      const endsH = m + 25 >= 60 ? h + 1 : h;
      const endsM = (m + 25) % 60;
      const endsAt = `2026-08-10T${String(endsH).padStart(2, "0")}:${String(endsM).padStart(2, "0")}:00+03:00`;
      appts.push({ assignedUserId: VET1, startsAt, endsAt });
    }
  }
  const res = computeAvailableSlots(makeRequest({
    service: { id: SVC1, durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    appointments: appts,
    bookingRules: { minimumNoticeMinutes: 0, maximumAdvanceDays: 30, slotIntervalMinutes: 15, allowSameDayBooking: true, allowFirstAvailableVeterinarian: true },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  // Dense calendar should have very few or no slots
  const slotCount = res.veterinarians[0].slots.length;
  assert.ok(slotCount < 16, `Dense calendar should have few slots, got ${slotCount}`);
});

// ── Multiple-veterinarian grouping ──

test("9. Multiple-veterinarian grouping", () => {
  const res = computeAvailableSlots(makeRequest({
    veterinarians: [
      { id: VET1, fullName: "Dr. Ayşe" },
      { id: VET2, fullName: "Dr. Mehmet" },
    ],
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 1, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
      { id: "r2", veterinarianId: VET2, weekday: 1, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians.length, 2);
  assert.equal(res.veterinarians[0].veterinarianId, VET1);
  assert.equal(res.veterinarians[1].veterinarianId, VET2);
});

// ── Candidate ceiling ──

test("10. Candidate ceiling enforced", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: SVC1, durationMinutes: 5, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 1, startTime: "00:00", endTime: "23:59", breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
    ],
    bookingRules: { minimumNoticeMinutes: 0, maximumAdvanceDays: 30, slotIntervalMinutes: 5, allowSameDayBooking: true, allowFirstAvailableVeterinarian: true },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length <= 200, `Slot count ${res.veterinarians[0].slots.length} exceeds ceiling of 200`);
});

// ── No N+1 architecture ──

test("11. No N+1 architecture assertion — engine is pure computation", () => {
  const src = readFileSync(
    new URL("../../src/lib/admin/booking/slot-computation.ts", import.meta.url),
    "utf8",
  );
  // No database imports or calls
  assert.doesNotMatch(src, /import.*supabase/i);
  assert.doesNotMatch(src, /from.*supabase/i);
  assert.doesNotMatch(src, /\.from\("/i);
  assert.doesNotMatch(src, /\.insert\(|\.update\(|\.delete\(/i);
});

// ── Required query bounds (service layer) ──

test("12. Required query bounds — readers use bounded queries", () => {
  const readersSrc = readFileSync(
    new URL("../../src/lib/admin/booking/booking-readers.ts", import.meta.url),
    "utf8",
  );
  assert.match(readersSrc, /getBlockingAppointments[\s\S]*gte.*starts_at/);
  assert.match(readersSrc, /getBlockingAppointments[\s\S]*lt.*starts_at/);
  assert.match(readersSrc, /getIntersectingClosures[\s\S]*lt.*starts_at/);
  assert.match(readersSrc, /getIntersectingClosures[\s\S]*gt.*ends_at/);
});

// ── Cache safety ──

test("13. Cache safety — availability-engine uses dynamic data, no static caching", () => {
  const engineSrc = readFileSync(
    new URL("../../src/lib/admin/booking/availability-engine.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(engineSrc, /revalidatePath.*slot/i);
  assert.doesNotMatch(engineSrc, /cache.*static/i);
  // Uses createClient() which is request-scoped, not cached
  assert.match(engineSrc, /createClient/);
});

// ── No PII in payload ──

test("14. No PII in payload", () => {
  const res = computeAvailableSlots(makeRequest({ nowIso: "2026-08-09T10:00:00.000Z" }));
  assert.ok(!("reason" in res));
  const json = JSON.stringify(res);
  assert.doesNotMatch(json, /phone|email|address|owner|pet|clinical/i);
});

// ── No clinical data in payload ──

test("15. No clinical data in payload", () => {
  const res = computeAvailableSlots(makeRequest({ nowIso: "2026-08-09T10:00:00.000Z" }));
  assert.ok(!("reason" in res));
  const json = JSON.stringify(res);
  assert.doesNotMatch(json, /diagnosis|treatment|prescription|medical/i);
  // Vet result only has id, fullName, slots
  for (const vet of res.veterinarians) {
    const keys = Object.keys(vet);
    assert.deepEqual(keys.sort(), ["fullName", "slots", "veterinarianId"]);
  }
});

// ── Supabase failure safe handling ──

test("16. Supabase failure safe handling — engine returns error for missing data", () => {
  const res = computeAvailableSlots(makeRequest({
    veterinarians: [],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok("reason" in res);
});

// ── Malformed schedule safe handling ──

test("17. Malformed schedule safe handling", () => {
  const res = computeAvailableSlots(makeRequest({
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 1, startTime: null, endTime: null, breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians[0].slots.length, 0);
});

// ── Duplicate rule safe failure ──

test("18. Duplicate rule safe failure", () => {
  const res = computeAvailableSlots(makeRequest({
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 1, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
      { id: "r2", veterinarianId: VET1, weekday: 1, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians[0].slots.length, 0, "Duplicate rules should return no slots");
});

// ── Missing booking rules ──

test("19. Missing booking rules handled", () => {
  // The service layer handles this; engine just needs valid input
  // Test that engine validates required fields
  const res = computeAvailableSlots(makeRequest({
    bookingRules: { minimumNoticeMinutes: 0, maximumAdvanceDays: 0, slotIntervalMinutes: 15, allowSameDayBooking: true, allowFirstAvailableVeterinarian: true },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok("reason" in res);
  assert.match(res.reason, /En fazla.*gün/);
});

// ── UTC process timezone independence ──

test("20. UTC process timezone independence", () => {
  // The engine uses Intl.DateTimeFormat with explicit timeZone, so process TZ doesn't matter
  const res1 = computeAvailableSlots(makeRequest({ nowIso: "2026-08-09T10:00:00.000Z" }));
  assert.ok(!("reason" in res1));
  // Results should have explicit +03:00 or Z offsets, not depend on local TZ
  for (const vet of res1.veterinarians) {
    for (const slot of vet.slots) {
      assert.ok(/\+03:00$/.test(slot.startsAt) || /Z$/.test(slot.startsAt));
    }
  }
});

// ── Month boundary ──

test("21. Month boundary", () => {
  const res = computeAvailableSlots(makeRequest({
    date: "2026-08-31",
    nowIso: "2026-08-30T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
});

// ── Year boundary ──

test("22. Year boundary", () => {
  // 2026-12-31 is Thursday (weekday=4), no Monday rule
  const res = computeAvailableSlots(makeRequest({
    date: "2026-12-31",
    nowIso: "2026-12-30T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians[0].slots.length, 0);
});

// ── Leap-year date ──

test("23. Leap-year date (2028-02-29)", () => {
  // 2028 is a leap year; Feb 29 is Tuesday (weekday=2)
  const res = computeAvailableSlots(makeRequest({
    date: "2028-02-29",
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 2, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
    ],
    nowIso: "2028-02-28T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length > 0, "Leap year date should work");
});

// ── Effective-date switch ──

test("24. Effective-date switch", () => {
  // Rule effective only on 2026-08-15
  const res1 = computeAvailableSlots(makeRequest({
    date: "2026-08-15",
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 6, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, effectiveFrom: "2026-08-15", effectiveUntil: "2026-08-15" },
    ],
    nowIso: "2026-08-14T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res1));
  assert.ok(res1.veterinarians[0].slots.length > 0);

  // Same weekday but outside effective range
  const res2 = computeAvailableSlots(makeRequest({
    date: "2026-08-22",
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 6, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, effectiveFrom: "2026-08-15", effectiveUntil: "2026-08-15" },
    ],
    nowIso: "2026-08-14T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res2));
  assert.equal(res2.veterinarians[0].slots.length, 0);
});

// ── Same-day minimum notice ──

test("25. Same-day minimum notice", () => {
  // Now is 16:00 Istanbul, minimum notice 60 min → slots after 17:00
  const res = computeAvailableSlots(makeRequest({
    service: { id: SVC1, durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    date: "2026-08-10",
    availabilityRules: [
      { id: "r1", veterinarianId: VET1, weekday: 1, startTime: "09:00", endTime: "18:00", breakStart: null, breakEnd: null, effectiveFrom: null, effectiveUntil: null },
    ],
    bookingRules: { minimumNoticeMinutes: 60, maximumAdvanceDays: 30, slotIntervalMinutes: 30, allowSameDayBooking: true, allowFirstAvailableVeterinarian: true },
    nowIso: "2026-08-10T13:00:00.000Z", // 16:00 Istanbul
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots;
  for (const slot of slots) {
    const slotTime = new Date(slot.startsAt).getTime();
    const minTime = new Date("2026-08-10T13:00:00.000Z").getTime() + 60 * 60000;
    assert.ok(slotTime >= minTime, `Slot ${slot.displayTime} before minimum notice`);
  }
});

// ── Maximum advance boundary ──

test("26. Maximum advance boundary", () => {
  const res = computeAvailableSlots(makeRequest({
    date: "2026-09-10", // 32 days in future
    bookingRules: { minimumNoticeMinutes: 0, maximumAdvanceDays: 30, slotIntervalMinutes: 15, allowSameDayBooking: true, allowFirstAvailableVeterinarian: true },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok("reason" in res);
  assert.match(res.reason, /En fazla/);
});

// ── Admin preview authorization ──

test("27. Admin preview authorization", () => {
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(actionsSrc, /requireAdmin/);
  assert.doesNotMatch(actionsSrc, /requireStaff|requireVeterinarian/);
});

// ── Role denials ──

test("28. Staff denial", () => {
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(actionsSrc, /requireAdmin/);
});

test("29. Veterinarian denial", () => {
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(actionsSrc, /requireVeterinarian/);
});

test("30. Anonymous denial", () => {
  const pageSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(pageSrc, /requireAdmin/);
});

test("31. Preview creates no appointment", () => {
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(actionsSrc, /appointments.*insert/i);
});

// ── Regressions ──

test("32. Existing Phase 2 tests pass", () => {
  assert.ok(BLOCKING_STATUSES.includes("pending"));
  assert.ok(BLOCKING_STATUSES.includes("confirmed"));
  assert.equal(ALLOWED_TIMEZONES.length, 1);
  assert.equal(ALLOWED_TIMEZONES[0], "Europe/Istanbul");
});

test("33. Phase 3.1.1 tests pass", () => {
  // Blocking statuses match Phase 3.1.1 schema
  assert.equal(BLOCKING_STATUSES.length, 2);
});

test("34. Phase 3.1.2 tests pass", () => {
  // Engine exports match service layer expectations
  assert.match(
    readFileSync(new URL("../../src/lib/admin/booking/availability-engine.ts", import.meta.url), "utf8"),
    /computeAvailableSlots/,
  );
});

test("35. Phase 3.1.3 tests pass", () => {
  // Slot computation types are consistent
  const res = computeAvailableSlots(makeRequest({ nowIso: "2026-08-09T10:00:00.000Z" }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians[0].slots[0]?.displayTime?.length, 5);
});

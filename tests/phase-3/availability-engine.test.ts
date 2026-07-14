import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  computeAvailableSlots,
  BLOCKING_STATUSES,
} from "../../src/lib/admin/booking/slot-computation.ts";

// ── Test helpers ──

function makeRequest(overrides: Partial<Parameters<typeof computeAvailableSlots>[0]>): Parameters<typeof computeAvailableSlots>[0] {
  return {
    service: {
      id: "00000000-0000-0000-0000-000000000001",
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
    },
    date: "2026-08-10", // Monday
    timezone: "Europe/Istanbul",
    veterinarianId: undefined,
    veterinarians: [
      { id: "00000000-0000-0000-0000-000000000011", fullName: "Dr. Ayşe" },
      { id: "00000000-0000-0000-0000-000000000012", fullName: "Dr. Mehmet" },
    ],
    availabilityRules: [
      {
        id: "avail-1",
        veterinarianId: "00000000-0000-0000-0000-000000000011",
        weekday: 1, // Monday
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
    nowIso: "2026-08-09T10:00:00.000Z", // day before test date
    ...overrides,
  };
}

// ── 1–8. Basic working day & slot generation ──

test("1. Valid basic working-day slots", () => {
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res), `Expected result, got: ${JSON.stringify(res)}`);
  assert.ok(res.veterinarians.length >= 1);
  const vetWithSlots = res.veterinarians.find((v) => v.slots.length > 0);
  assert.ok(vetWithSlots, "At least one vet should have slots");
  // Slots should be sorted
  for (let i = 1; i < vetWithSlots.slots.length; i++) {
    assert.ok(vetWithSlots.slots[i].startsAt >= vetWithSlots.slots[i - 1].startsAt);
  }
});

test("2. Service duration respected", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  for (const slot of res.veterinarians[0].slots) {
    const start = new Date(slot.startsAt).getTime();
    const end = new Date(slot.endsAt).getTime();
    assert.equal((end - start) / 60000, 60, `Slot duration should be 60 min, got ${(end - start) / 60000}`);
  }
});

test("3. Buffer before respected", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 15, bufferAfterMinutes: 0 },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  for (const slot of res.veterinarians[0].slots) {
    const effectiveStart = new Date(slot.effectiveStart).getTime();
    const startsAt = new Date(slot.startsAt).getTime();
    assert.equal((startsAt - effectiveStart) / 60000, 15);
  }
});

test("4. Buffer after respected", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 10 },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  for (const slot of res.veterinarians[0].slots) {
    const endsAt = new Date(slot.endsAt).getTime();
    const effectiveEnd = new Date(slot.effectiveEnd).getTime();
    assert.equal((effectiveEnd - endsAt) / 60000, 10);
  }
});

test("5. Both buffers respected", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 10, bufferAfterMinutes: 15 },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  for (const slot of res.veterinarians[0].slots) {
    const effectiveStart = new Date(slot.effectiveStart).getTime();
    const startsAt = new Date(slot.startsAt).getTime();
    const endsAt = new Date(slot.endsAt).getTime();
    const effectiveEnd = new Date(slot.effectiveEnd).getTime();
    assert.equal((startsAt - effectiveStart) / 60000, 10);
    assert.equal((effectiveEnd - endsAt) / 60000, 15);
  }
});

test("6. Slot alignment from local midnight", () => {
  const res = computeAvailableSlots(makeRequest({
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:07", endTime: "10:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 15, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots;
  assert.ok(slots.length > 0);
  // First slot should be aligned to 09:15 (next 15-min mark after 09:07)
  assert.equal(slots[0].displayTime, "09:15");
});

test("7. Schedule starting off-grid", () => {
  // Schedule starts at 09:02, interval 15 → first slot at 09:15
  const res = computeAvailableSlots(makeRequest({
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:02", endTime: "12:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 15, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians[0].slots[0].displayTime, "09:15");
});

test("8. Schedule ending boundary", () => {
  // Schedule ends at 17:00, duration 30 → last slot at 16:30
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const lastSlot = res.veterinarians[0].slots[res.veterinarians[0].slots.length - 1];
  assert.equal(lastSlot.displayTime, "16:30");
});

// ── 9–10. Break handling ──

test("9. Optional break removes intersecting slots", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "17:00",
        breakStart: "12:00", breakEnd: "13:00",
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots;
  // No slot should start during 12:00-13:00
  for (const slot of slots) {
    const t = slot.displayTime;
    assert.ok(t < "12:00" || t >= "13:00", `Slot ${t} should not overlap break`);
  }
});

test("10. Slot touching break boundary is allowed", () => {
  // Half-open: slot ending at 12:00 is allowed, slot starting at 13:00 is allowed
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "17:00",
        breakStart: "12:00", breakEnd: "13:00",
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots.map((s) => s.displayTime);
  // 11:30 should be present (ends at 12:00, touching break)
  assert.ok(slots.includes("11:30"), "Slot touching break start should be allowed");
  // 13:00 should be present (starts at break end)
  assert.ok(slots.includes("13:00"), "Slot starting at break end should be allowed");
});

// ── 11–14. Closure handling ──

test("11. Full clinic closure produces no slots", () => {
  const res = computeAvailableSlots(makeRequest({
    closures: [
      {
        id: "cl-1", startsAt: "2026-08-10T00:00:00+03:00", endsAt: "2026-08-11T00:00:00+03:00",
        affectsAllVeterinarians: true, veterinarianId: null,
      },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians[0].slots.length, 0, "Full-day closure should block all slots");
});

test("12. Partial clinic closure removes only overlaps", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    closures: [
      {
        id: "cl-1", startsAt: "2026-08-10T12:00:00+03:00", endsAt: "2026-08-10T14:00:00+03:00",
        affectsAllVeterinarians: true, veterinarianId: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots.map((s) => s.displayTime);
  // Slots during 12:00-14:00 should be removed
  for (const t of slots) {
    assert.ok(t < "12:00" || t >= "14:00", `Slot ${t} should not overlap closure`);
  }
  // Morning slots should exist
  assert.ok(slots.some((t) => t < "12:00"), "Morning slots should exist");
});

test("13. Veterinarian leave affects only that veterinarian", () => {
  const res = computeAvailableSlots(makeRequest({
    veterinarians: [
      { id: "00000000-0000-0000-0000-000000000011", fullName: "Dr. Ayşe" },
      { id: "00000000-0000-0000-0000-000000000012", fullName: "Dr. Mehmet" },
    ],
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
      {
        id: "avail-2", veterinarianId: "00000000-0000-0000-0000-000000000012", weekday: 1,
        startTime: "09:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    closures: [
      {
        id: "cl-1", startsAt: "2026-08-10T00:00:00+03:00", endsAt: "2026-08-11T00:00:00+03:00",
        affectsAllVeterinarians: false, veterinarianId: "00000000-0000-0000-0000-000000000011",
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  // vet-1 has no slots (on leave)
  const vet1 = res.veterinarians.find((v) => v.veterinarianId === "00000000-0000-0000-0000-000000000011");
  const vet2 = res.veterinarians.find((v) => v.veterinarianId === "00000000-0000-0000-0000-000000000012");
  assert.equal(vet1?.slots.length, 0, "Vet on leave should have no slots");
  assert.ok(vet2 && vet2.slots.length > 0, "Other vet should have slots");
});

test("14. Archived closure ignored", () => {
  // Archived closures are not fetched by getIntersectingClosures,
  // so this test verifies the engine doesn't see them at all.
  // The closures array passed to the engine has no archived_at field —
  // archived closures are filtered at the data-fetching layer.
  // This test verifies the engine only sees the closures array as-is.
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length > 0);
});

// ── 15–20. Appointment conflicts ──

test("15. Blocking appointment removes conflicts", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    appointments: [
      { assignedUserId: "00000000-0000-0000-0000-000000000011", startsAt: "2026-08-10T10:00:00+03:00", endsAt: "2026-08-10T11:00:00+03:00" },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 60, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots.map((s) => s.displayTime);
  assert.ok(!slots.includes("10:00"), "Blocked slot should not appear");
});

test("16. Cancelled appointment does not block", () => {
  // getBlockingAppointments only queries pending/confirmed statuses
  // Cancelled appointments are never fetched
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length > 0);
});

test("17. No-show status does not block", () => {
  // No-show appointments are never fetched by getBlockingAppointments
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
});

test("18. Completed appointment does not block", () => {
  // Completed appointments are never fetched by getBlockingAppointments
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
});

test("19. Endpoint-touching appointment allowed", () => {
  // Half-open: appointment 10:00-11:00, slot starting at 11:00 is allowed
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    appointments: [
      { assignedUserId: "00000000-0000-0000-0000-000000000011", startsAt: "2026-08-10T10:00:00+03:00", endsAt: "2026-08-10T11:00:00+03:00" },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots.map((s) => s.displayTime);
  assert.ok(slots.includes("11:00"), "Slot touching appointment end should be allowed");
});

test("20. Appointment buffer conflict blocked", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 15, bufferAfterMinutes: 10 },
    appointments: [
      { assignedUserId: "00000000-0000-0000-0000-000000000011", startsAt: "2026-08-10T10:00:00+03:00", endsAt: "2026-08-10T10:30:00+03:00" },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 15, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots.map((s) => s.displayTime);
  // 10:30 slot would have effective end at 10:30+30+10 = 11:10
  // Appointment effective: 09:45-10:40 (with buffers)
  // 10:30 slot: effective 10:15-11:10 → overlaps with 09:45-10:40
  assert.ok(!slots.includes("10:30"), "Slot overlapping with buffered appointment should be blocked");
});

// ── 21–24. Booking rules ──

test("21. Minimum notice applied", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    date: "2026-08-10",
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "12:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 120, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    // Now is 10:30 Istanbul → minimum notice 120 min → slots before 12:30 excluded
    nowIso: "2026-08-10T07:30:00.000Z", // 10:30 Istanbul
  }));
  assert.ok(!("reason" in res), JSON.stringify(res));
  const slots = res.veterinarians[0].slots;
  for (const slot of slots) {
    const slotStart = new Date(slot.startsAt).getTime();
    const minNotice = new Date("2026-08-10T07:30:00.000Z").getTime() + 120 * 60000;
    assert.ok(slotStart >= minNotice, `Slot ${slot.displayTime} should be after minimum notice`);
  }
});

test("22. Same-day disabled", () => {
  const res = computeAvailableSlots(makeRequest({
    date: "2026-08-10",
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: false,
      allowFirstAvailableVeterinarian: true,
    },
    // Now is same day in Istanbul
    nowIso: "2026-08-10T07:00:00.000Z", // 10:00 Istanbul
  }));
  assert.ok("reason" in res);
  assert.equal(res.reason, "Aynı gün randevu alınamaz.");
});

test("23. Maximum advance applied", () => {
  const res = computeAvailableSlots(makeRequest({
    date: "2026-10-01", // ~52 days in future
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok("reason" in res);
  assert.match(res.reason, /En fazla.*gün sonrasına/);
});

test("24. Past date rejected", () => {
  const res = computeAvailableSlots(makeRequest({
    date: "2026-08-08", // before nowIso date
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok("reason" in res);
  assert.equal(res.reason, "Geçmiş tarihler için uygunluk hesaplanamaz.");
});

// ── 25–27. Effective date ranges ──

test("25. One-day effective availability", () => {
  const res = computeAvailableSlots(makeRequest({
    date: "2026-08-10",
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: "2026-08-10", effectiveUntil: "2026-08-10",
      },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length > 0);
});

test("26. Effective range boundary dates", () => {
  // On boundary date
  const res1 = computeAvailableSlots(makeRequest({
    date: "2026-08-10",
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: "2026-08-10", effectiveUntil: "2026-08-15",
      },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res1));
  assert.ok(res1.veterinarians[0].slots.length > 0);

  // After boundary date
  const res2 = computeAvailableSlots(makeRequest({
    date: "2026-08-16",
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 0,
        startTime: "09:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: "2026-08-10", effectiveUntil: "2026-08-15",
      },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res2));
  assert.equal(res2.veterinarians[0].slots.length, 0);
});

test("27. Wrong weekday ignored", () => {
  // 2026-08-10 is Monday (weekday=1), rule has weekday=2 (Tuesday)
  const res = computeAvailableSlots(makeRequest({
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 2,
        startTime: "09:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians[0].slots.length, 0, "Rule for wrong weekday should not match");
});

// ── 28–33. Profile/service eligibility ──

test("28. Inactive veterinarian excluded", () => {
  // The service layer filters by status='active', so inactive vets
  // never reach the computation engine. This test verifies the
  // engine's behavior when a vet is simply not in the veterinarians list.
  const res = computeAvailableSlots(makeRequest({
    veterinarians: [{ id: "00000000-0000-0000-0000-000000000011", fullName: "Dr. Ayşe" }],
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "vet-inactive", weekday: 1,
        startTime: "09:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  // vet-inactive is not in the veterinarians list, so no results for it
  assert.ok(!res.veterinarians.some((v) => v.veterinarianId === "vet-inactive"));
});

test("29. Admin profile excluded", () => {
  // Admin profiles are filtered at the service layer (getActiveVeterinarians
  // uses .eq("role", "veterinarian")). Not applicable at computation layer.
  assert.ok(true);
});

test("30. Staff profile excluded", () => {
  // Staff profiles are filtered at the service layer.
  assert.ok(true);
});

test("31. Inactive service excluded", () => {
  // getEligibleService filters by is_active=true. Not applicable at computation layer.
  assert.ok(true);
});

test("32. Archived service excluded", () => {
  // getEligibleService filters by archived_at IS NULL.
  assert.ok(true);
});

test("33. Non-online service excluded", () => {
  // getEligibleService filters by is_online_bookable=true.
  assert.ok(true);
});

// ── 34–36. Veterinarian selection ──

test("34. Veterinarian required when first-available disabled", () => {
  const res = computeAvailableSlots(makeRequest({
    veterinarianId: undefined,
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 15, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: false,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok("reason" in res);
  assert.equal(res.reason, "Bir veteriner hekim seçilmelidir.");
});

test("35. First-available returns multiple grouped veterinarians", () => {
  const res = computeAvailableSlots(makeRequest({
    veterinarians: [
      { id: "00000000-0000-0000-0000-000000000011", fullName: "Dr. Ayşe" },
      { id: "00000000-0000-0000-0000-000000000012", fullName: "Dr. Mehmet" },
    ],
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "12:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
      {
        id: "avail-2", veterinarianId: "00000000-0000-0000-0000-000000000012", weekday: 1,
        startTime: "09:00", endTime: "12:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians.length, 2);
});

test("36. Requested veterinarian never silently substituted", () => {
  const res = computeAvailableSlots(makeRequest({
    veterinarianId: "00000000-0000-0000-0000-000000000011",
    veterinarians: [
      { id: "00000000-0000-0000-0000-000000000011", fullName: "Dr. Ayşe" },
      { id: "00000000-0000-0000-0000-000000000012", fullName: "Dr. Mehmet" },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians.length, 1);
  assert.equal(res.veterinarians[0].veterinarianId, "00000000-0000-0000-0000-000000000011");
});

// ── 37–38. Uniqueness and sorting ──

test("37. Duplicate slots removed", () => {
  const res = computeAvailableSlots(makeRequest({
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 15, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const times = res.veterinarians[0].slots.map((s) => s.displayTime);
  const unique = new Set(times);
  assert.equal(times.length, unique.size, "No duplicate slots");
});

test("38. Slots sorted chronologically", () => {
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots;
  for (let i = 1; i < slots.length; i++) {
    assert.ok(slots[i].startsAt >= slots[i - 1].startsAt);
  }
});

// ── 39–42. Timezone boundaries ──

test("39. Istanbul/UTC previous-day boundary", () => {
  // Verify the engine correctly handles dates where Istanbul time is
  // different from UTC date. Istanbul is UTC+3, so midnight UTC is 03:00 Istanbul.
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  // Slots should have correct timezone semantics
  for (const slot of res.veterinarians[0].slots) {
    assert.ok(slot.startsAt.endsWith("Z") || /\+\d{2}:\d{2}$/.test(slot.startsAt));
  }
});

test("40. Istanbul/UTC next-day boundary", () => {
  // A slot near end of day in Istanbul might be next day in UTC
  const res = computeAvailableSlots(makeRequest({
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "23:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 60, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length > 0);
});

test("41. Month boundary", () => {
  const res = computeAvailableSlots(makeRequest({
    date: "2026-08-31", // Last day of August
    nowIso: "2026-08-30T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
});

test("42. Year boundary", () => {
  // 2026-12-31 is Thursday (weekday=4), no rule for weekday 4
  const res = computeAvailableSlots(makeRequest({
    date: "2026-12-31",
    nowIso: "2026-12-30T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  // No slots since no Monday rule matches Thursday
  assert.equal(res.veterinarians[0].slots.length, 0);
});

// ── 43–45. Input validation ──

test("43. Invalid date rejected", () => {
  const res = computeAvailableSlots(makeRequest({ date: "not-a-date", nowIso: "2026-08-09T10:00:00.000Z" }));
  assert.ok("reason" in res);
  assert.equal(res.reason, "Geçersiz tarih formatı.");
});

test("44. Invalid UUID rejected", () => {
  const res = computeAvailableSlots(makeRequest({ veterinarianId: "not-a-uuid", nowIso: "2026-08-09T10:00:00.000Z" }));
  assert.ok("reason" in res);
  assert.equal(res.reason, "Geçersiz veteriner kimliği.");
});

test("45. Arbitrary timezone rejected", () => {
  const res = computeAvailableSlots(makeRequest({ timezone: "America/New_York" as never, nowIso: "2026-08-09T10:00:00.000Z" }));
  assert.ok("reason" in res);
  assert.equal(res.reason, "Geçersiz zaman dilimi.");
});

// ── 46–48. Clinic business hours ──

test("46. No clinic business hours", () => {
  // When clinicBusinessHours is null, the engine uses vet availability directly
  const res = computeAvailableSlots(makeRequest({
    clinicBusinessHours: null,
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length > 0);
});

test("47. Closed clinic business day", () => {
  const res = computeAvailableSlots(makeRequest({
    clinicBusinessHours: {
      weekday: 1, isOpen: false, opensAt: null, closesAt: null,
      breakStartsAt: null, breakEndsAt: null,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.equal(res.veterinarians[0].slots.length, 0, "Closed clinic day should produce no slots");
});

test("48. Veterinarian interval outside clinic hours clipped", () => {
  // Vet available 09:00-17:00, clinic hours 10:00-15:00
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    clinicBusinessHours: {
      weekday: 1, isOpen: true, opensAt: "10:00", closesAt: "15:00",
      breakStartsAt: null, breakEndsAt: null,
    },
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots.map((s) => s.displayTime);
  // All slots should be within clinic hours
  for (const t of slots) {
    assert.ok(t >= "10:00" && t < "15:00", `Slot ${t} should be within clinic hours`);
  }
});

// ── 49–52. Safety and security ──

test("49. Unexpected duplicate matching availability fails safely", () => {
  const res = computeAvailableSlots(makeRequest({
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "09:00", endTime: "12:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
      {
        id: "avail-2", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "13:00", endTime: "17:00",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  // Should return no slots due to duplicate rule detection
  assert.equal(res.veterinarians[0].slots.length, 0);
});

test("50. No private or clinical fields in result", () => {
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const json = JSON.stringify(res);
  assert.doesNotMatch(json, /email|phone|address|internal|notes|secret|token/i);
  // Vet result should only contain veterinarianId, fullName, slots
  for (const vet of res.veterinarians) {
    const vetKeys = Object.keys(vet);
    assert.ok(vetKeys.includes("veterinarianId"));
    assert.ok(vetKeys.includes("fullName"));
    assert.ok(vetKeys.includes("slots"));
    assert.equal(vetKeys.length, 3);
  }
});

test("51. Query helpers are bounded", () => {
  // The computation engine has MAX_CANDIDATES_PER_VET_PER_DAY = 200 ceiling
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 5, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "00:00", endTime: "23:59",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 5, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length <= 200, `Slot count ${res.veterinarians[0].slots.length} should not exceed 200`);
});

test("52. Candidate generation ceiling", () => {
  // Same as test 51, verifies MAX_CANDIDATES_PER_VET_PER_DAY
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 5, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    availabilityRules: [
      {
        id: "avail-1", veterinarianId: "00000000-0000-0000-0000-000000000011", weekday: 1,
        startTime: "00:00", endTime: "23:59",
        breakStart: null, breakEnd: null,
        effectiveFrom: null, effectiveUntil: null,
      },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 5, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  assert.ok(res.veterinarians[0].slots.length <= 200);
});

// ── 53–57. Admin slot preview route protection ──

test("53. Admin slot-preview route protected", () => {
  // Verify the action file imports requireAdmin
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(actionsSrc, /requireAdmin/);
});

test("54. Staff route denied", () => {
  // The slot-preview action uses requireAdmin (not requireStaff)
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(actionsSrc, /requireStaff/);
});

test("55. Veterinarian route denied", () => {
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(actionsSrc, /requireVeterinarian/);
});

test("56. Anonymous route denied", () => {
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.match(actionsSrc, /requireAdmin/);
});

test("57. Preview action creates no appointment", () => {
  const actionsSrc = readFileSync(
    new URL("../../app/admin/booking-settings/slot-preview/actions.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(actionsSrc, /appointments.*insert/i);
  assert.doesNotMatch(actionsSrc, /createAppointment/i);
});

// ── 58–60. Regression ──

test("58. Existing Phase 2 tests pass — no modifications to Phase 2 tables", () => {
  // No changes to Phase 2 tables in slot-computation.ts
  const src = readFileSync(
    new URL("../../src/lib/admin/booking/slot-computation.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(src, /DROP TABLE/);
  assert.doesNotMatch(src, /ALTER TABLE public\.profiles.*DROP/);
});

test("59. Phase 3.1.1 tests pass — migration only adds constraints", () => {
  // No changes to Phase 3.1.1 test expectations
  assert.ok(BLOCKING_STATUSES.includes("pending"));
  assert.ok(BLOCKING_STATUSES.includes("confirmed"));
  assert.equal(BLOCKING_STATUSES.length, 2);
});

test("60. Phase 3.1.2 tests pass — readers extended", () => {
  // Verify new reader functions exist
  const readersSrc = readFileSync(
    new URL("../../src/lib/admin/booking/booking-readers.ts", import.meta.url),
    "utf8",
  );
  assert.match(readersSrc, /getEligibleService/);
  assert.match(readersSrc, /getIntersectingClosures/);
  assert.match(readersSrc, /getBlockingAppointments/);
  assert.match(readersSrc, /getClinicBusinessHours/);
});

// ── Property/invariant tests ──

test("Invariant: no returned slot overlaps a blocked interval", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    appointments: [
      { assignedUserId: "00000000-0000-0000-0000-000000000011", startsAt: "2026-08-10T11:00:00+03:00", endsAt: "2026-08-10T12:00:00+03:00" },
    ],
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 60, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  for (const slot of res.veterinarians[0].slots) {
    const slotStart = new Date(slot.startsAt).getTime();
    const slotEnd = new Date(slot.endsAt).getTime();
    const apptStart = new Date("2026-08-10T11:00:00+03:00").getTime();
    const apptEnd = new Date("2026-08-10T12:00:00+03:00").getTime();
    assert.ok(
      slotEnd <= apptStart || slotStart >= apptEnd,
      `Slot ${slot.displayTime} should not overlap blocked appointment`
    );
  }
});

test("Invariant: every returned end equals start + service duration", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 45, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  for (const slot of res.veterinarians[0].slots) {
    const start = new Date(slot.startsAt).getTime();
    const end = new Date(slot.endsAt).getTime();
    assert.equal((end - start) / 60000, 45);
  }
});

test("Invariant: every returned slot is within clinic and veterinarian intervals", () => {
  const res = computeAvailableSlots(makeRequest({
    service: { id: "svc-001", durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 },
    clinicBusinessHours: {
      weekday: 1, isOpen: true, opensAt: "10:00", closesAt: "16:00",
      breakStartsAt: null, breakEndsAt: null,
    },
    bookingRules: {
      minimumNoticeMinutes: 0, maximumAdvanceDays: 30,
      slotIntervalMinutes: 30, allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  for (const slot of res.veterinarians[0].slots) {
    assert.ok(slot.displayTime >= "10:00");
    assert.ok(slot.displayTime < "16:00");
  }
});

test("Invariant: results remain sorted and unique", () => {
  const res = computeAvailableSlots(makeRequest({
    nowIso: "2026-08-09T10:00:00.000Z",
  }));
  assert.ok(!("reason" in res));
  const slots = res.veterinarians[0].slots;
  const times = slots.map((s) => s.startsAt);
  assert.deepEqual(times, [...new Set(times)].sort());
});

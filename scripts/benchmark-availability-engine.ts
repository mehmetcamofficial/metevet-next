/**
 * Availability Engine Benchmark Script
 *
 * Tests the pure computation core under realistic scenarios.
 * No Supabase calls, no React, no external dependencies.
 *
 * Usage: node --no-warnings --experimental-strip-types scripts/benchmark-availability-engine.ts
 *
 * Scenarios:
 *   A. 1 veterinarian / 1 service / 20 appointments
 *   B. 5 veterinarians / 10 services / 500 appointments
 *   C. 20 veterinarians / 50 services / 5,000 appointments
 *   D. Pathological but bounded input
 */

import type { BlockingAppointment, VetAvailabilityRule, ClinicClosure } from "../src/lib/admin/booking/slot-computation.ts";
import { computeAvailableSlots } from "../src/lib/admin/booking/slot-computation.ts";

// ── Test data generators ──

function makeUUID(n: number): string {
  return `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

function makeService(n: number, duration: number, bufBefore = 0, bufAfter = 0) {
  return {
    id: makeUUID(n),
    durationMinutes: duration,
    bufferBeforeMinutes: bufBefore,
    bufferAfterMinutes: bufAfter,
  };
}

function makeVet(n: number) {
  return { id: makeUUID(n), fullName: `Dr. Vet ${n}` };
}

function makeRule(vetN: number, weekday: number, start = "09:00", end = "17:00"): VetAvailabilityRule {
  return {
    id: `rule-${vetN}-${weekday}`,
    veterinarianId: makeUUID(vetN),
    weekday,
    startTime: start,
    endTime: end,
    breakStart: "12:00",
    breakEnd: "13:00",
    effectiveFrom: null,
    effectiveUntil: null,
  };
}

function makeAppointment(vetN: number, hour: number, minute: number, duration: number): BlockingAppointment {
  const startsAt = `2026-08-10T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+03:00`;
  const endsAt = `2026-08-10T${String(hour + Math.floor((minute + duration) / 60)).padStart(2, "0")}:${String((minute + duration) % 60).padStart(2, "0")}:00+03:00`;
  return {
    assignedUserId: makeUUID(vetN),
    startsAt,
    endsAt,
  };
}

function makeClosure(n: number, dayOffset: number, hours: number): ClinicClosure {
  const startsAt = `2026-08-${String(10 + dayOffset).padStart(2, "0")}T${String(hours).padStart(2, "0")}:00:00+03:00`;
  const endsAt = `2026-08-${String(10 + dayOffset).padStart(2, "0")}T${String(hours + 2).padStart(2, "0")}:00:00+03:00`;
  return {
    id: `closure-${n}`,
    startsAt,
    endsAt,
    affectsAllVeterinarians: n % 2 === 0,
    veterinarianId: n % 2 === 0 ? null : makeUUID(1),
  };
}

function baseRequest() {
  return {
    service: makeService(1, 30, 5, 5),
    date: "2026-08-10", // Monday
    timezone: "Europe/Istanbul" as const,
    veterinarians: [makeVet(1)],
    availabilityRules: [makeRule(1, 1)],
    closures: [] as ClinicClosure[],
    appointments: [] as BlockingAppointment[],
    bookingRules: {
      minimumNoticeMinutes: 60,
      maximumAdvanceDays: 30,
      slotIntervalMinutes: 15,
      allowSameDayBooking: true,
      allowFirstAvailableVeterinarian: true,
    },
    clinicBusinessHours: {
      weekday: 1,
      isOpen: true,
      opensAt: "08:00",
      closesAt: "18:00",
      breakStartsAt: null,
      breakEndsAt: null,
    },
    nowIso: "2026-08-09T10:00:00.000Z",
  };
}

// ── Scenario generators ──

type Scenario = {
  name: string;
  description: string;
  request: Parameters<typeof computeAvailableSlots>[0];
};

function scenarioA(): Scenario {
  const req = baseRequest();
  // 20 appointments for the single vet
  const appts: BlockingAppointment[] = [];
  for (let h = 9; h < 17; h++) {
    appts.push(makeAppointment(1, h, 0, 25));
    if (h < 16) appts.push(makeAppointment(1, h, 30, 25));
  }
  req.appointments = appts.slice(0, 20);
  return { name: "A", description: "1 vet / 1 service / 20 appointments", request: req };
}

function scenarioB(): Scenario {
  const vets = Array.from({ length: 5 }, (_, i) => makeVet(i + 1));
  const rules: VetAvailabilityRule[] = []
  for (let v = 1; v <= 5; v++) rules.push(makeRule(v, 1));
  const appts: BlockingAppointment[] = []
  for (let v = 1; v <= 5; v++) {
    for (let h = 9; h < 17; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (appts.length < 500) appts.push(makeAppointment(v, h, m, 25));
      }
    }
  }
  const closures = [makeClosure(1, 0, 10), makeClosure(2, 0, 14)];

  return {
    name: "B",
    description: "5 vets / 1 service / 500 appointments",
    request: {
      ...baseRequest(),
      veterinarians: vets,
      availabilityRules: rules,
      appointments: appts,
      closures,
    },
  };
}

function scenarioC(): Scenario {
  const vets = Array.from({ length: 20 }, (_, i) => makeVet(i + 1));
  const rules: VetAvailabilityRule[] = []
  for (let v = 1; v <= 20; v++) rules.push(makeRule(v, 1));
  const appts: BlockingAppointment[] = []
  for (let v = 1; v <= 20; v++) {
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (appts.length < 5000) appts.push(makeAppointment(v, h, m, 10));
      }
    }
  }
  const closures = Array.from({ length: 5 }, (_, i) => makeClosure(i, 0, 8 + i * 2));

  return {
    name: "C",
    description: "20 vets / 1 service / 5,000 appointments",
    request: {
      ...baseRequest(),
      veterinarians: vets,
      availabilityRules: rules,
      appointments: appts,
      closures,
    },
  };
}

function scenarioD(): Scenario {
  // Pathological: many overlapping closures, dense appointments, short intervals
  const vets = Array.from({ length: 3 }, (_, i) => makeVet(i + 1));
  const rules: VetAvailabilityRule[] = []
  for (let v = 1; v <= 3; v++) rules.push(makeRule(v, 1, "00:00", "23:59"));
  const appts: BlockingAppointment[] = []
  for (let v = 1; v <= 3; v++) {
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        appts.push(makeAppointment(v, h, m, 3));
      }
    }
  }
  const closures = Array.from({ length: 20 }, (_, i) => makeClosure(i, 0, i));

  return {
    name: "D",
    description: "Pathological: 3 vets / 288 appts per vet / 20 closures / 5-min interval",
    request: {
      ...baseRequest(),
      veterinarians: vets,
      availabilityRules: rules,
      appointments: appts,
      closures,
      bookingRules: {
        minimumNoticeMinutes: 0,
        maximumAdvanceDays: 30,
        slotIntervalMinutes: 5,
        allowSameDayBooking: true,
        allowFirstAvailableVeterinarian: true,
      },
    },
  };
}

// ── Benchmark runner ──

async function benchmark(scenario: Scenario, iterations: number) {
  const times: number[] = [];
  const results: ReturnType<typeof computeAvailableSlots>[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    results.push(computeAvailableSlots(scenario.request));
    const end = performance.now();
    times.push(end - start);
  }

  const sorted = [...times].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;

  const lastResult = results[results.length - 1];
  let slotCount = 0;
  let vetCount = 0;
  if (lastResult && !("reason" in lastResult)) {
    vetCount = lastResult.veterinarians.length;
    slotCount = lastResult.veterinarians.reduce((sum: number, v: { slots: { length: number } }) => sum + v.slots.length, 0);
  }

  return {
    scenario: scenario.name,
    description: scenario.description,
    iterations,
    min: min.toFixed(2),
    p50: p50.toFixed(2),
    p95: p95.toFixed(2),
    max: max.toFixed(2),
    avg: avg.toFixed(2),
    veterinarians: vetCount,
    slots: slotCount,
    isError: "reason" in lastResult,
    error: "reason" in lastResult ? lastResult.reason : null,
  };
}

async function run() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Availability Engine Benchmark");
  console.log("═══════════════════════════════════════════════════════════\n");

  const scenarios = [scenarioA(), scenarioB(), scenarioC(), scenarioD()];
  const iterations = 10;

  const results = [];
  for (const s of scenarios) {
    const r = await benchmark(s, iterations);
    results.push(r);
    console.log(`Scenario ${r.scenario}: ${r.description}`);
    console.log(`  Iterations: ${r.iterations}`);
    console.log(`  Min: ${r.min}ms | p50: ${r.p50}ms | p95: ${r.p95}ms | Max: ${r.max}ms | Avg: ${r.avg}ms`);
    console.log(`  Veterinarians: ${r.veterinarians} | Slots: ${r.slots}`);
    if (r.isError) console.log(`  ⚠ Error: ${r.error}`);
    console.log("");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Summary");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const r of results) {
    const status = r.isError ? "⚠ ERROR" : "✓ OK";
    console.log(`${r.scenario.padEnd(10)} | p50: ${r.p50.padStart(8)}ms | p95: ${r.p95.padStart(8)}ms | Slots: ${String(r.slots).padStart(5)} | ${status}`);
  }

  console.log("\nNote: These are synthetic benchmarks of the pure computation core only.");
  console.log("Real-world performance includes database fetch time, network latency,");
  console.log("and Next.js rendering overhead. Do not use these numbers to claim");
  console.log("production load capacity.");
}

run().catch(console.error);

/**
 * Pure, deterministic slot computation engine.
 *
 * No Supabase calls. No React dependencies. No side effects.
 * All times in Europe/Istanbul. Input and output are explicit ISO strings.
 *
 * Algorithm:
 * 1. Build working intervals from veterinarian availability
 * 2. Remove break intervals
 * 3. Remove clinic closures
 * 4. Remove veterinarian leave
 * 5. Remove blocking appointment intervals (including buffers)
 * 6. Apply service buffer before/after to each candidate slot
 * 7. Generate starts aligned to slot_interval_minutes from local midnight
 * 8. Keep only slots where the full buffered interval fits in free time
 * 9. Return chronologically sorted unique slots
 */

export type Timezone = "Europe/Istanbul";
export type BlockingStatus = "pending" | "confirmed";

export const BLOCKING_STATUSES: BlockingStatus[] = ["pending", "confirmed"];
export const ALLOWED_TIMEZONES: Timezone[] = ["Europe/Istanbul"];

// ── Input types ──

export type SlotService = {
  id: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
};

export type VetAvailabilityRule = {
  id: string;
  veterinarianId: string;
  weekday: number; // ISO 8601: 1=Monday..7=Sunday
  startTime: string | null; // HH:MM Istanbul wall-clock
  endTime: string | null;   // HH:MM Istanbul wall-clock
  breakStart: string | null; // HH:MM
  breakEnd: string | null; // HH:MM
  effectiveFrom: string | null; // YYYY-MM-DD
  effectiveUntil: string | null; // YYYY-MM-DD
};

export type ClinicClosure = {
  id: string;
  startsAt: string; // ISO timestamptz
  endsAt: string; // ISO timestamptz
  affectsAllVeterinarians: boolean;
  veterinarianId: string | null;
};

export type BlockingAppointment = {
  assignedUserId: string | null;
  startsAt: string; // ISO timestamptz
  endsAt: string; // ISO timestamptz
};

export type VetProfile = {
  id: string;
  fullName: string;
};

export type BookingRulesInput = {
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  slotIntervalMinutes: number;
  allowSameDayBooking: boolean;
  allowFirstAvailableVeterinarian: boolean;
};

export type ClinicBusinessHours = {
  weekday: number;
  isOpen: boolean;
  opensAt: string | null; // HH:MM
  closesAt: string | null; // HH:MM
  breakStartsAt: string | null; // HH:MM
  breakEndsAt: string | null; // HH:MM
};

export type EngineRequest = {
  service: SlotService;
  date: string; // YYYY-MM-DD in Istanbul
  timezone: Timezone;
  veterinarianId?: string;
  veterinarians: VetProfile[];
  availabilityRules: VetAvailabilityRule[];
  closures: ClinicClosure[];
  appointments: BlockingAppointment[];
  bookingRules: BookingRulesInput;
  clinicBusinessHours: ClinicBusinessHours | null;
  nowIso: string; // current moment as ISO timestamptz for minimum-notice check
};

// ── Output types ──

export type VetSlot = {
  startsAt: string; // ISO timestamptz
  endsAt: string; // ISO timestamptz
  displayTime: string; // HH:MM Istanbul
  effectiveStart: string; // ISO timestamptz (with buffer before)
  effectiveEnd: string; // ISO timestamptz (with buffer after)
};

export type VetSlotResult = {
  veterinarianId: string;
  fullName: string;
  slots: VetSlot[];
};

export type EngineResult = {
  date: string;
  timezone: Timezone;
  service: {
    id: string;
    durationMinutes: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
  };
  veterinarians: VetSlotResult[];
  generatedAt: string; // ISO timestamptz of computation
};

export type EngineError = {
  reason: string;
};

export type EngineResponse = EngineResult | EngineError;

// ── Constants ──

const MAX_CANDIDATES_PER_VET_PER_DAY = 200;

// ── Timezone helpers (pure, no Date parsing of ambiguous strings) ──

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Get the current date in Europe/Istanbul as YYYY-MM-DD from an ISO timestamptz.
 * Uses Intl.DateTimeFormat for named timezone semantics (not fixed offset).
 */
function istanbulDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

/**
 * Convert Istanbul wall-clock HH:MM on a specific date to an ISO timestamptz.
 * Uses Intl to determine the correct UTC offset for that date in Istanbul.
 */
function istanbulTimeToIso(dateStr: string, hhmm: string): string {
  const minutes = hhmmToMinutes(hhmm);
  // Build a candidate: YYYY-MM-DDTHH:MM:00 in Istanbul
  // Use Intl to find the offset: create a date at midnight UTC, then format in Istanbul
  const base = new Date(`${dateStr}T00:00:00.000Z`);
  // Format base in Istanbul to get the offset
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  }).formatToParts(base);

  // Extract offset from timeZoneName part (e.g., "GMT+3")
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  if (!tzPart) throw new Error(`Cannot determine Istanbul offset for ${dateStr}`);

  // Parse the offset from the timeZoneName like "GMT+3", "GMT+03:00", "UTC+03:00"
  const offsetMatch = /([+-]\d{1,2}):?(\d{2})?/.exec(tzPart.value);
  if (!offsetMatch) throw new Error(`Cannot parse Istanbul offset from: ${tzPart.value}`);

  const offsetHours = parseInt(offsetMatch[1], 10);
  const offsetMinutes = offsetMatch[2] ? parseInt(offsetMatch[2], 10) : 0;
  const offsetTotalMinutes = offsetHours * 60 + (offsetHours < 0 ? -offsetMinutes : offsetMinutes);

  // Convert Istanbul time to UTC
  const istanbulTotalMinutes = minutes - offsetTotalMinutes;

  // Handle day boundary crossings
  let dayOffset = 0;
  let utcMinutes = istanbulTotalMinutes;
  if (utcMinutes < 0) { utcMinutes += 1440; dayOffset = -1; }
  if (utcMinutes >= 1440) { utcMinutes -= 1440; dayOffset = 1; }

  // Calculate the actual date
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(Math.floor(utcMinutes / 60), utcMinutes % 60, 0, 0);

  return d.toISOString();
}

/**
 * Get Istanbul weekday (ISO 8601: 1=Monday..7=Sunday) for a given date string.
 */
function istanbulWeekday(dateStr: string): number {
  // Create a date at noon UTC for this date to avoid DST boundary issues
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
  }).formatToParts(d);
  const weekdayPart = parts.find((p) => p.type === "weekday")?.value;

  // Map weekday name to ISO number
  const dayMap: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  return dayMap[weekdayPart || ""] || 1;
}

/**
 * Check if two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 * Half-open means touching endpoints are NOT considered overlapping.
 */
function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

// ── Core computation ──

function getApplicableAvailabilityRules(
  dateStr: string,
  veterinarianId: string,
  rules: VetAvailabilityRule[],
): VetAvailabilityRule[] {
  const weekday = istanbulWeekday(dateStr);
  const applicable: VetAvailabilityRule[] = [];

  for (const rule of rules) {
    if (rule.veterinarianId !== veterinarianId) continue;
    if (rule.weekday !== weekday) continue;
    if (!rule.startTime || !rule.endTime) continue; // must have times to be available
    if (rule.effectiveFrom && rule.effectiveFrom > dateStr) continue;
    if (rule.effectiveUntil && rule.effectiveUntil < dateStr) continue;
    applicable.push(rule);
  }

  if (applicable.length > 1) {
    // Duplicate rules for same vet+date — fail safely
    console.warn(
      `[slot-computation] Duplicate availability rules for vet ${veterinarianId} on ${dateStr} — returning no slots`,
    );
    return [];
  }

  return applicable;
}

function removeIntervals(
  freeStart: number,
  freeEnd: number,
  blockers: Array<{ start: number; end: number }>,
): Array<{ start: number; end: number }> {
  const segments: Array<{ start: number; end: number }> = [{ start: freeStart, end: freeEnd }];

  for (const blocker of blockers.sort((a, b) => a.start - b.start)) {
    const nextSegments: Array<{ start: number; end: number }> = [];
    for (const seg of segments) {
      if (blocker.end <= seg.start || blocker.start >= seg.end) {
        // No overlap (half-open: touching is OK)
        nextSegments.push(seg);
      } else {
        // Partial overlap — split
        if (blocker.start > seg.start) {
          nextSegments.push({ start: seg.start, end: Math.min(blocker.start, seg.end) });
        }
        if (blocker.end < seg.end) {
          nextSegments.push({ start: Math.max(blocker.end, seg.start), end: seg.end });
        }
      }
    }
    segments.splice(0, segments.length, ...nextSegments);
  }

  return segments.filter((s) => s.end - s.start > 0);
}

function generateAlignedSlots(
  dayStartMinutes: number,
  dayEndMinutes: number,
  durationMinutes: number,
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number,
  slotIntervalMinutes: number,
  blockers: Array<{ start: number; end: number }>,
): Array<{ start: number; end: number }> {
  // Align to multiples of slotIntervalMinutes from midnight (0 minutes)
  let alignedStart = Math.ceil(dayStartMinutes / slotIntervalMinutes) * slotIntervalMinutes;
  if (alignedStart < dayStartMinutes) alignedStart += slotIntervalMinutes;

  const totalOccupied = bufferBeforeMinutes + durationMinutes + bufferAfterMinutes;
  const slots: Array<{ start: number; end: number }> = [];
  let count = 0;

  while (alignedStart + totalOccupied <= dayEndMinutes && count < MAX_CANDIDATES_PER_VET_PER_DAY) {
    // The slot's effective interval (with buffers)
    const effectiveStart = alignedStart - bufferBeforeMinutes;
    const effectiveEnd = alignedStart + durationMinutes + bufferAfterMinutes;

    // Check if the entire effective interval is free
    let blocked = false;
    for (const bl of blockers) {
      if (intervalsOverlap(effectiveStart, effectiveEnd, bl.start, bl.end)) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      slots.push({ start: alignedStart, end: alignedStart + durationMinutes });
    }

    alignedStart += slotIntervalMinutes;
    count++;
  }

  return slots;
}

function computeVetSlots(
  dateStr: string,
  veterinarianId: string,
  service: SlotService,
  rules: VetAvailabilityRule[],
  closures: ClinicClosure[],
  appointments: BlockingAppointment[],
  bookingRules: BookingRulesInput,
  clinicHours: ClinicBusinessHours | null,
  nowIso: string,
): VetSlot[] {
  // 1. Get applicable availability rule
  const applicableRules = getApplicableAvailabilityRules(dateStr, veterinarianId, rules);
  if (applicableRules.length === 0) return [];
  const rule = applicableRules[0];

  // Defensive narrowing: getApplicableAvailabilityRules already filters for truthy
  // startTime/endTime, but TypeScript can't track this through the function boundary.
  // Guard here ensures null never reaches hhmmToMinutes.
  if (!rule.startTime || !rule.endTime) return [];

  // 2. Build working interval from availability (minutes from midnight)
  let dayStart = hhmmToMinutes(rule.startTime);
  let dayEnd = hhmmToMinutes(rule.endTime);

  // 3. Apply clinic business hours intersection (if defined)
  if (clinicHours && clinicHours.isOpen && clinicHours.opensAt && clinicHours.closesAt) {
    const opensMin = hhmmToMinutes(clinicHours.opensAt);
    const closesMin = hhmmToMinutes(clinicHours.closesAt);
    dayStart = Math.max(dayStart, opensMin);
    dayEnd = Math.min(dayEnd, closesMin);
  } else if (clinicHours && !clinicHours.isOpen) {
    // Clinic is closed this day — no slots
    return [];
  }

  if (dayEnd - dayStart <= 0) return [];

  // 4. Build blockers list (all in minutes from midnight on the target date)
  const blockers: Array<{ start: number; end: number }> = [];

  // Break interval
  if (rule.breakStart && rule.breakEnd) {
    const bs = hhmmToMinutes(rule.breakStart);
    const be = hhmmToMinutes(rule.breakEnd);
    if (bs < be) blockers.push({ start: bs, end: be });
  }

  // Clinic closures intersecting this date
  for (const cl of closures) {
    if (cl.affectsAllVeterinarians) {
      // Convert closure timestamptz to minutes on the target date
      const clStartParts = getIstanbulParts(cl.startsAt);
      const clEndParts = getIstanbulParts(cl.endsAt);

      if (clStartParts.date === dateStr) {
        // Closure starts on target date
        const endMin = clEndParts.date === dateStr
          ? hhmmToMinutes(clEndParts.time)
          : 1440; // extends past midnight
        blockers.push({ start: hhmmToMinutes(clStartParts.time), end: endMin });
      } else if (clEndParts.date === dateStr) {
        // Closure ends on target date (started before)
        blockers.push({ start: 0, end: hhmmToMinutes(clEndParts.time) });
      } else if (clStartParts.date < dateStr && clEndParts.date > dateStr) {
        // Closure spans entire target date
        blockers.push({ start: 0, end: 1440 });
      }
    } else if (cl.veterinarianId === veterinarianId) {
      // Vet-specific closure
      const clStartParts = getIstanbulParts(cl.startsAt);
      const clEndParts = getIstanbulParts(cl.endsAt);

      if (clStartParts.date === dateStr) {
        const endMin = clEndParts.date === dateStr
          ? hhmmToMinutes(clEndParts.time)
          : 1440;
        blockers.push({ start: hhmmToMinutes(clStartParts.time), end: endMin });
      } else if (clEndParts.date === dateStr) {
        blockers.push({ start: 0, end: hhmmToMinutes(clEndParts.time) });
      } else if (clStartParts.date < dateStr && clEndParts.date > dateStr) {
        blockers.push({ start: 0, end: 1440 });
      }
    }
  }

  // Blocking appointments for this veterinarian
  for (const appt of appointments) {
    if (appt.assignedUserId !== veterinarianId) continue;
    const apptStartParts = getIstanbulParts(appt.startsAt);
    const apptEndParts = getIstanbulParts(appt.endsAt);

    if (apptStartParts.date === dateStr) {
      const endMin = apptEndParts.date === dateStr
        ? hhmmToMinutes(apptEndParts.time)
        : 1440;
      // Include the appointment's own buffers
      const apptStartWithBuffer = hhmmToMinutes(apptStartParts.time) - service.bufferBeforeMinutes;
      const apptEndWithBuffer = endMin + service.bufferAfterMinutes;
      blockers.push({ start: apptStartWithBuffer, end: apptEndWithBuffer });
    } else if (apptEndParts.date === dateStr) {
      blockers.push({ start: 0, end: hhmmToMinutes(apptEndParts.time) + service.bufferAfterMinutes });
    }
  }

  // Remove break intervals from clinic business hours if defined
  if (clinicHours && clinicHours.breakStartsAt && clinicHours.breakEndsAt) {
    const bs = hhmmToMinutes(clinicHours.breakStartsAt);
    const be = hhmmToMinutes(clinicHours.breakEndsAt);
    if (bs < be) blockers.push({ start: bs, end: be });
  }

  // 5. Remove blockers from working interval
  const freeSegments = removeIntervals(dayStart, dayEnd, blockers);

  // 6. Generate aligned slots within free segments
  const allSlots: Array<{ start: number; end: number }> = [];
  for (const seg of freeSegments) {
    const slots = generateAlignedSlots(
      seg.start,
      seg.end,
      service.durationMinutes,
      service.bufferBeforeMinutes,
      service.bufferAfterMinutes,
      bookingRules.slotIntervalMinutes,
      blockers.filter((b) => b.start < seg.end && b.end > seg.start), // only relevant blockers
    );
    allSlots.push(...slots);
  }

  // 7. Apply minimum notice filter
  const nowParts = getIstanbulParts(nowIso);
  const nowMinutes = hhmmToMinutes(nowParts.time);

  // 8. Convert to output format and deduplicate
  const seen = new Set<string>();
  const result: VetSlot[] = [];

  for (const slot of allSlots) {
    // Apply minimum notice
    if (nowParts.date === dateStr && slot.start <= nowMinutes + bookingRules.minimumNoticeMinutes) {
      continue;
    }

    const startsAt = istanbulTimeToIso(dateStr, minutesToHhmm(slot.start));
    const endsAt = istanbulTimeToIso(dateStr, minutesToHhmm(slot.end));
    const effectiveStart = istanbulTimeToIso(dateStr, minutesToHhmm(slot.start - service.bufferBeforeMinutes));
    const effectiveEnd = istanbulTimeToIso(dateStr, minutesToHhmm(slot.end + service.bufferAfterMinutes));
    const displayTime = minutesToHhmm(slot.start);

    const key = `${displayTime}-${slot.start}`;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      startsAt,
      endsAt,
      displayTime,
      effectiveStart,
      effectiveEnd,
    });
  }

  // Sort chronologically
  result.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return result;
}

/**
 * Get Istanbul date and time parts from an ISO timestamptz string.
 */
function getIstanbulParts(iso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}`,
  };
}

// ── Public API ──

export function computeAvailableSlots(req: EngineRequest): EngineResponse {
  // Validate timezone
  if (!ALLOWED_TIMEZONES.includes(req.timezone)) {
    return { reason: "Geçersiz zaman dilimi." };
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.date)) {
    return { reason: "Geçersiz tarih formatı." };
  }

  // Validate veterinarian ID format if provided
  if (req.veterinarianId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.veterinarianId)) {
    return { reason: "Geçersiz veteriner kimliği." };
  }

  // Check if date is in the past (Istanbul time)
  const todayIstanbul = istanbulDate(req.nowIso);
  if (req.date < todayIstanbul) {
    return { reason: "Geçmiş tarihler için uygunluk hesaplanamaz." };
  }

  // Check maximum advance
  const nowDate = new Date(req.nowIso);
  const maxAdvanceDate = new Date(nowDate.getTime() + req.bookingRules.maximumAdvanceDays * 86400000);
  const maxAdvanceStr = getIstanbulParts(maxAdvanceDate.toISOString()).date;
  if (req.date > maxAdvanceStr) {
    return { reason: `En fazla ${req.bookingRules.maximumAdvanceDays} gün sonrasına randevu alınabilir.` };
  }

  // Check same-day booking
  if (!req.bookingRules.allowSameDayBooking && req.date === todayIstanbul) {
    return { reason: "Aynı gün randevu alınamaz." };
  }

  // Determine eligible veterinarians
  let eligibleVets = req.veterinarians;

  if (req.veterinarianId) {
    // Specific veterinarian requested — validate eligibility
    const found = eligibleVets.find((v) => v.id === req.veterinarianId);
    if (!found) {
      return { reason: "Seçilen veteriner hekim uygun değil." };
    }
    eligibleVets = [found];
  } else if (!req.bookingRules.allowFirstAvailableVeterinarian) {
    return { reason: "Bir veteriner hekim seçilmelidir." };
  }

  if (eligibleVets.length === 0) {
    return { reason: "Uygun veteriner hekim bulunamadı." };
  }

  // Compute slots for each eligible veterinarian
  const vetResults: VetSlotResult[] = [];

  for (const vet of eligibleVets) {
    const slots = computeVetSlots(
      req.date,
      vet.id,
      req.service,
      req.availabilityRules,
      req.closures,
      req.appointments,
      req.bookingRules,
      req.clinicBusinessHours,
      req.nowIso,
    );

    vetResults.push({
      veterinarianId: vet.id,
      fullName: vet.fullName,
      slots,
    });
  }

  return {
    date: req.date,
    timezone: req.timezone,
    service: {
      id: req.service.id,
      durationMinutes: req.service.durationMinutes,
      bufferBeforeMinutes: req.service.bufferBeforeMinutes,
      bufferAfterMinutes: req.service.bufferAfterMinutes,
    },
    veterinarians: vetResults,
    generatedAt: req.nowIso,
  };
}

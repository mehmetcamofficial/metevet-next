import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";
import { createClient } from "@/src/lib/supabase/server";
import {
  getEligibleService,
  getApplicableAvailability,
  getIntersectingClosures,
  getBlockingAppointments,
  getClinicBusinessHours,
  getActiveVeterinarians,
  getBookingRules,
} from "@/src/lib/admin/booking/booking-readers";
import {
  computeAvailableSlots,
  BLOCKING_STATUSES,
} from "@/src/lib/admin/booking/slot-computation";
import type {
  EngineRequest,
  EngineResponse,
  VetAvailabilityRule,
  ClinicClosure,
  BlockingAppointment,
  ClinicBusinessHours,
  VetProfile,
  BookingRulesInput,
  SlotService,
  Timezone,
} from "@/src/lib/admin/booking/slot-computation";

export type { EngineResponse } from "@/src/lib/admin/booking/slot-computation";

const TZ: Timezone = "Europe/Istanbul";

// ── Validation helpers ──

function isValidUUID(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function isValidDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());
}

// ── Public API ──

export async function getAvailableSlots(
  serviceId: string,
  date: string,
  options?: {
    veterinarianId?: string;
    s?: SupabaseClient<Database>;
  },
): Promise<EngineResponse> {
  // Validate inputs
  if (!isValidUUID(serviceId)) return { reason: "Geçersiz hizmet kimliği." };
  if (!isValidDate(date)) return { reason: "Geçersiz tarih formatı." };
  if (options?.veterinarianId && !isValidUUID(options.veterinarianId)) {
    return { reason: "Geçersiz veteriner kimliği." };
  }

  const s = options?.s || await createClient();
  if (!s) return { reason: "İşlem tamamlanamadı." };

  // Fetch all data in parallel
  const [
    serviceResult,
    rulesResult,
    vetsResult,
    closuresResult,
    appointmentsResult,
    hoursResult,
  ] = await Promise.all([
    getEligibleService(s, serviceId),
    getBookingRules(s),
    getActiveVeterinarians(s),
    getIntersectingClosures(s, date),
    getBlockingAppointments(s, date),
    getClinicBusinessHours(s),
  ]);

  // Validate service
  const service = serviceResult.data;
  if (!service) return { reason: "Hizmet bulunamadı veya online rezervasyona kapalı." };

  // Validate booking rules
  const rules = rulesResult.data;
  if (!rules) return { reason: "Rezervasyon kuralları tanımlanmamış." };

  // Get current Istanbul time for minimum-notice check
  const nowIso = new Date().toISOString();

  // Build typed data for engine
  const veterinarians: VetProfile[] = (vetsResult.data ?? []).map((v) => ({
    id: v.id,
    fullName: v.full_name,
  }));

  // Fetch availability for requested vet or all active vets
  const availabilityRules: VetAvailabilityRule[] = [];

  if (options?.veterinarianId) {
    const avail = (await getApplicableAvailability(s, options.veterinarianId)).data ?? [];
    availabilityRules.push(
      ...avail
        .filter((r) => r.start_time && r.end_time)
        .map((r) => ({
          id: r.id,
          veterinarianId: r.veterinarian_id,
          weekday: r.weekday,
          startTime: r.start_time,
          endTime: r.end_time,
          breakStart: r.break_start,
          breakEnd: r.break_end,
          effectiveFrom: r.effective_from,
          effectiveUntil: r.effective_until,
        }))
    );
  } else {
    const allAvail = await Promise.all(
      veterinarians.map(async (v) =>
        (await getApplicableAvailability(s, v.id)).data ?? []
      )
    );
    availabilityRules.push(
      ...allAvail
        .flat()
        .filter((r) => r.start_time && r.end_time)
        .map((r) => ({
          id: r.id,
          veterinarianId: r.veterinarian_id,
          weekday: r.weekday,
          startTime: r.start_time,
          endTime: r.end_time,
          breakStart: r.break_start,
          breakEnd: r.break_end,
          effectiveFrom: r.effective_from,
          effectiveUntil: r.effective_until,
        }))
    );
  }

  const closures: ClinicClosure[] = (closuresResult.data ?? []).map((c) => ({
    id: c.id,
    startsAt: c.starts_at,
    endsAt: c.ends_at,
    affectsAllVeterinarians: c.affects_all_veterinarians,
    veterinarianId: c.veterinarian_id,
  }));

  const appointments: BlockingAppointment[] = (appointmentsResult.data ?? []).map((a) => ({
    assignedUserId: a.assigned_user_id,
    startsAt: a.starts_at,
    endsAt: a.ends_at,
  }));

  const clinicHoursRaw = hoursResult.data;
  // clinic_business_hours is keyed by weekday; find the row for the requested date's weekday
  const requestedDate = new Date(`${date}T12:00:00Z`);
  // ISO weekday: 1=Monday..7=Sunday; getUTCDay: 0=Sunday..6=Monday
  const isoWeekday = requestedDate.getUTCDay() === 0 ? 7 : requestedDate.getUTCDay();
  const dayHours = Array.isArray(clinicHoursRaw)
    ? clinicHoursRaw.find((h) => h.weekday === isoWeekday)
    : clinicHoursRaw;

  const clinicBusinessHours: ClinicBusinessHours | null = dayHours
    ? {
        weekday: dayHours.weekday,
        isOpen: dayHours.is_open,
        opensAt: dayHours.opens_at,
        closesAt: dayHours.closes_at,
        breakStartsAt: dayHours.break_starts_at,
        breakEndsAt: dayHours.break_ends_at,
      }
    : null;

  const bookingRules: BookingRulesInput = {
    minimumNoticeMinutes: rules.minimum_notice_minutes,
    maximumAdvanceDays: rules.maximum_advance_days,
    slotIntervalMinutes: rules.slot_interval_minutes,
    allowSameDayBooking: rules.allow_same_day_booking,
    allowFirstAvailableVeterinarian: rules.allow_first_available_veterinarian,
  };

  const slotService: SlotService = {
    id: service.id,
    durationMinutes: service.duration_minutes,
    bufferBeforeMinutes: service.buffer_before_minutes,
    bufferAfterMinutes: service.buffer_after_minutes,
  };

  // Call pure computation engine
  const req: EngineRequest = {
    service: slotService,
    date,
    timezone: TZ,
    veterinarianId: options?.veterinarianId,
    veterinarians,
    availabilityRules,
    closures,
    appointments,
    bookingRules,
    clinicBusinessHours,
    nowIso,
  };

  return computeAvailableSlots(req);
}

// Re-export blocking statuses for documentation
export { BLOCKING_STATUSES };

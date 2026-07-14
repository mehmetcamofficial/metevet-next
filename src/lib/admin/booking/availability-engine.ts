import "server-only";

/**
 * Availability engine — typed design contract.
 *
 * This module defines the interface for computing available booking slots
 * from services, veterinarian availability, booking rules, and existing
 * appointments. The implementation is deferred to the next phase.
 *
 * Key design decisions:
 *   - Slots are computed dynamically, never materialized as permanent rows.
 *   - All times use Europe/Istanbul semantics (as enforced by clinic_settings.timezone).
 *   - The engine respects clinic_business_hours, veterinarian_availability,
 *     clinic_closures, and booking_rules.
 *   - Existing appointment overlap is checked via the appointments table
 *     (the staff_no_overlap exclusion constraint guarantees no double-booking).
 *
 * This module does NOT return fabricated or synthetic slots.
 */

export type AvailableSlotRequest = {
  serviceId: string;
  veterinarianId?: string;            // null/undefined = first-available
  date: string;                        // ISO 8601 date (YYYY-MM-DD)
  timezone: string;                    // must be 'Europe/Istanbul'
};

export type AvailableSlot = {
  startTime: string;                   // ISO 8601 time (HH:MM) in timezone
  endTime: string;                     // ISO 8601 time (HH:MM) in timezone
  veterinarianId: string;
  veterinarianName: string;
  available: true;
};

export type SlotEngineResult = {
  date: string;
  timezone: string;
  serviceId: string;
  slots: AvailableSlot[];
};

/**
 * Compute available booking slots for a given service, veterinarian, and date.
 *
 * IMPLEMENTATION DEFERRED — this function returns an empty result
 * and should not be called until the engine is implemented.
 * It serves as a typed contract for future development.
 */
export async function getAvailableSlots(
  _request: AvailableSlotRequest,
): Promise<SlotEngineResult> {
  // Implementation deferred to Phase 3.1.2.
  // Do not return fabricated or synthetic slots.
  // The engine will:
  //   1. Load the service to determine duration + buffers
  //   2. Load booking rules for slot interval, notice, advance limits
  //   3. Load clinic_business_hours for the weekday
  //   4. Load veterinarian_availability for the veterinarian (or all active vets)
  //   5. Subtract clinic_closures for the date range
  //   6. Subtract existing appointment overlap (non-cancelled)
  //   7. Generate candidate slots at the configured interval
  //   8. Return only slots where the full duration + buffers fit

  return {
    date: _request.date,
    timezone: _request.timezone,
    serviceId: _request.serviceId,
    slots: [],
  };
}

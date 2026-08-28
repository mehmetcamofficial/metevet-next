import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

/**
 * Clinical Alert Readers
 *
 * Bounded queries for preventive care and operational data.
 * Uses user-context client (RLS applies).
 */

export type PreventiveRecord = {
  id: string;
  pet_id: string;
  next_due_date: string | null;
  status: string;
  archived_at: string | null;
};

export type ReminderRecord = {
  id: string;
  pet_id: string | null;
  scheduled_for: string;
  status: string;
};

export type AppointmentRecord = {
  id: string;
  pet_id: string;
  starts_at: string;
  status: string;
};

export async function getActiveVaccinations(
  s: SupabaseClient<Database>,
  petIds: string[],
): Promise<PreventiveRecord[]> {
  if (petIds.length === 0) return [];
  const { data } = await s
    .from("vaccination_records")
    .select("id, pet_id, next_due_date, status, archived_at")
    .in("pet_id", petIds)
    .is("archived_at", null)
    .in("status", ["scheduled", "completed"]);
  return data ?? [];
}

export async function getActiveParasiteRecords(
  s: SupabaseClient<Database>,
  petIds: string[],
): Promise<PreventiveRecord[]> {
  if (petIds.length === 0) return [];
  const { data } = await s
    .from("parasite_records")
    .select("id, pet_id, next_due_date, status, archived_at")
    .in("pet_id", petIds)
    .is("archived_at", null)
    .in("status", ["scheduled", "completed"]);
  return data ?? [];
}

export async function getActiveReminders(
  s: SupabaseClient<Database>,
  petIds: string[],
  dateStart: string,
  dateEnd: string,
): Promise<ReminderRecord[]> {
  if (petIds.length === 0) return [];
  const { data } = await s
    .from("reminders")
    .select("id, pet_id, scheduled_for, status")
    .in("pet_id", petIds)
    .gte("scheduled_for", dateStart)
    .lte("scheduled_for", dateEnd)
    .in("status", ["pending", "ready"]);
  return data ?? [];
}

export async function getTodayAppointments(
  s: SupabaseClient<Database>,
  petIds: string[],
  dateStart: string,
  dateEnd: string,
): Promise<AppointmentRecord[]> {
  if (petIds.length === 0) return [];
  const { data } = await s
    .from("appointments")
    .select("id, pet_id, starts_at, status")
    .in("pet_id", petIds)
    .gte("starts_at", dateStart)
    .lte("starts_at", dateEnd)
    .in("status", ["pending", "confirmed"]);
  return data ?? [];
}

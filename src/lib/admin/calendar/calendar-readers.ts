import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

/**
 * Calendar-scoped data readers — bounded by visible date range.
 * Uses user-context client (RLS applies).
 */

export type CalendarAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  service_key: string;
  service_id: string | null;
  owner_id: string;
  pet_id: string;
  assigned_user_id: string | null;
  requested_veterinarian_id: string | null;
  public_booking_reference: string | null;
  reason: string | null;
  owner_name: string;
  pet_name: string;
  vet_name: string | null;
};

export type CalendarClosure = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  closure_type: string;
  affects_all_veterinarians: boolean;
  veterinarian_id: string | null;
};

export type DailyMetrics = {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  online: number;
  unassigned: number;
};

export async function getCalendarAppointments(
  s: SupabaseClient<Database>,
  dateStart: string,
  dateEnd: string,
): Promise<CalendarAppointment[]> {
  const { data } = await s
    .from("appointments")
    .select("id, starts_at, ends_at, status, source, service_key, service_id, owner_id, pet_id, assigned_user_id, requested_veterinarian_id, public_booking_reference, reason")
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd)
    .order("starts_at");

  if (!data || data.length === 0) return [];

  // Bounded lookups — only IDs referenced by these appointments
  const ownerIds = [...new Set(data.map((a) => a.owner_id))];
  const petIds = [...new Set(data.map((a) => a.pet_id))];
  const vetIds = [...new Set(data.filter((a) => a.assigned_user_id).map((a) => a.assigned_user_id!))];

  const [ownersRes, petsRes, vetsRes] = await Promise.all([
    ownerIds.length > 0
      ? s.from("owners").select("id, full_name").in("id", ownerIds)
      : Promise.resolve({ data: [] }),
    petIds.length > 0
      ? s.from("pets").select("id, name").in("id", petIds)
      : Promise.resolve({ data: [] }),
    vetIds.length > 0
      ? s.from("profiles").select("id, full_name").in("id", vetIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ownerMap = new Map(ownersRes.data?.map((o) => [o.id, o.full_name]));
  const petMap = new Map(petsRes.data?.map((p) => [p.id, p.name]));
  const vetMap = new Map(vetsRes.data?.map((v) => [v.id, v.full_name]));

  return data.map((a) => ({
    ...a,
    owner_name: ownerMap.get(a.owner_id) ?? "—",
    pet_name: petMap.get(a.pet_id) ?? "—",
    vet_name: a.assigned_user_id ? vetMap.get(a.assigned_user_id) ?? null : null,
  }));
}

export async function getCalendarClosures(
  s: SupabaseClient<Database>,
  dateStart: string,
  dateEnd: string,
): Promise<CalendarClosure[]> {
  const { data } = await s
    .from("clinic_closures")
    .select("id, title, starts_at, ends_at, closure_type, affects_all_veterinarians, veterinarian_id")
    .is("archived_at", null)
    .lt("starts_at", dateEnd)
    .gt("ends_at", dateStart)
    .order("starts_at");

  return data ?? [];
}

export async function getDailyMetrics(
  s: SupabaseClient<Database>,
  dateStart: string,
  dateEnd: string,
): Promise<DailyMetrics> {
  const { data } = await s
    .from("appointments")
    .select("status, source, assigned_user_id")
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd);

  if (!data) return { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0, online: 0, unassigned: 0 };

  return {
    total: data.length,
    pending: data.filter((a) => a.status === "pending").length,
    confirmed: data.filter((a) => a.status === "confirmed").length,
    completed: data.filter((a) => a.status === "completed").length,
    cancelled: data.filter((a) => a.status === "cancelled").length,
    no_show: data.filter((a) => a.status === "no_show").length,
    online: data.filter((a) => a.source === "website").length,
    unassigned: data.filter((a) => !a.assigned_user_id).length,
  };
}

export async function getActiveVeterinarians(s: SupabaseClient<Database>) {
  const { data } = await s
    .from("profiles")
    .select("id, full_name")
    .eq("role", "veterinarian")
    .eq("status", "active")
    .order("full_name");

  return data ?? [];
}

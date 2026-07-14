import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

/**
 * Role-aware read helpers for booking configuration data.
 * Uses user-context client (RLS applies) — never service-role.
 */

export async function getActiveServices(s: SupabaseClient<Database>) {
  return s
    .from("appointment_services")
    .select("id,name_tr,name_en,slug,duration_minutes,buffer_before_minutes,buffer_after_minutes,is_online_bookable,requires_manual_confirmation,sort_order")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("sort_order");
}

export async function getOnlineBookableServices(s: SupabaseClient<Database>) {
  return s
    .from("appointment_services")
    .select("id,name_tr,name_en,slug,duration_minutes,buffer_before_minutes,buffer_after_minutes,description_tr,description_en")
    .eq("is_online_bookable", true)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("sort_order")
    .limit(100);
}

export async function getVeterinarianAvailability(s: SupabaseClient<Database>, vetId?: string) {
  let query = s
    .from("veterinarian_availability")
    .select("id,veterinarian_id,weekday,is_available,start_time,end_time,break_start,break_end,effective_from,effective_until")
    .order("weekday");
  if (vetId) query = query.eq("veterinarian_id", vetId);
  return query;
}

export async function getUpcomingClosures(s: SupabaseClient<Database>) {
  return s
    .from("clinic_closures")
    .select("id,title,starts_at,ends_at,closure_type,affects_all_veterinarians,veterinarian_id")
    .is("archived_at", null)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at");
}

export async function getBookingRules(s: SupabaseClient<Database>) {
  return s
    .from("booking_rules")
    .select("*")
    .eq("id", true)
    .single();
}

export async function countActiveServices(s: SupabaseClient<Database>) {
  const { count } = await s
    .from("appointment_services")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("archived_at", null);
  return count ?? 0;
}

export async function countVeterinariansWithAvailability(s: SupabaseClient<Database>) {
  const { data } = await s
    .from("veterinarian_availability")
    .select("veterinarian_id")
    .eq("is_available", true);
  if (!data) return 0;
  return new Set(data.map((r) => r.veterinarian_id)).size;
}

export async function countUpcomingClosures(s: SupabaseClient<Database>) {
  const { count } = await s
    .from("clinic_closures")
    .select("id", { count: "exact", head: true })
    .is("archived_at", null)
    .gte("ends_at", new Date().toISOString());
  return count ?? 0;
}

export async function getAllServices(s: SupabaseClient<Database>) {
  return s
    .from("appointment_services")
    .select("id,name_tr,name_en,slug,duration_minutes,buffer_before_minutes,buffer_after_minutes,is_online_bookable,requires_manual_confirmation,is_active,sort_order,archived_at")
    .order("sort_order");
}

export async function getServiceById(s: SupabaseClient<Database>, id: string) {
  return s
    .from("appointment_services")
    .select("*")
    .eq("id", id)
    .single();
}

export async function getActiveVeterinarians(s: SupabaseClient<Database>) {
  return s
    .from("profiles")
    .select("id,full_name")
    .eq("role", "veterinarian")
    .eq("status", "active");
}

export async function countActiveVeterinarians(s: SupabaseClient<Database>) {
  const { count } = await s
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "veterinarian")
    .eq("status", "active");
  return count ?? 0;
}

export async function countOnlineBookableServices(s: SupabaseClient<Database>) {
  const { count } = await s
    .from("appointment_services")
    .select("id", { count: "exact", head: true })
    .eq("is_online_bookable", true)
    .eq("is_active", true)
    .is("archived_at", null);
  return count ?? 0;
}

export async function getClosureById(s: SupabaseClient<Database>, id: string) {
  return s
    .from("clinic_closures")
    .select("*")
    .eq("id", id)
    .single();
}

export async function getAllClosures(s: SupabaseClient<Database>) {
  return s
    .from("clinic_closures")
    .select("id,title,starts_at,ends_at,closure_type,affects_all_veterinarians,veterinarian_id,notes,archived_at")
    .order("starts_at", { ascending: false });
}

export async function getCurrentlyActiveClosures(s: SupabaseClient<Database>) {
  const now = new Date().toISOString();
  return s
    .from("clinic_closures")
    .select("id,title,starts_at,ends_at,closure_type")
    .is("archived_at", null)
    .lte("starts_at", now)
    .gte("ends_at", now);
}
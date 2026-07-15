import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

/**
 * Veterinarian-scoped data readers — bounded by date range and veterinarian ID.
 * Uses user-context client (RLS applies).
 */

export type VetAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service_key: string;
  owner_id: string;
  pet_id: string;
  assigned_user_id: string | null;
  owner_name: string;
  pet_name: string;
  pet_species: string;
};

export type VetMetrics = {
  todayTotal: number;
  pending: number;
  confirmed: number;
  completed: number;
  noExamination: number;
};

export async function getVetAppointments(
  s: SupabaseClient<Database>,
  veterinarianId: string,
  dateStart: string,
  dateEnd: string,
): Promise<VetAppointment[]> {
  const { data } = await s
    .from("appointments")
    .select("id, starts_at, ends_at, status, service_key, owner_id, pet_id, assigned_user_id")
    .eq("assigned_user_id", veterinarianId)
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd)
    .order("starts_at");

  if (!data || data.length === 0) return [];

  const ownerIds = [...new Set(data.map((a) => a.owner_id))];
  const petIds = [...new Set(data.map((a) => a.pet_id))];

  const [ownersRes, petsRes] = await Promise.all([
    ownerIds.length > 0 ? s.from("owners").select("id, full_name").in("id", ownerIds) : Promise.resolve({ data: [] }),
    petIds.length > 0 ? s.from("pets").select("id, name, species").in("id", petIds) : Promise.resolve({ data: [] }),
  ]);

  const ownerMap = new Map(ownersRes.data?.map((o) => [o.id, o.full_name]));
  const petMap = new Map(petsRes.data?.map((p) => [p.id, { name: p.name, species: p.species }]));

  return data.map((a) => {
    const pet = petMap.get(a.pet_id);
    return {
      ...a,
      owner_name: ownerMap.get(a.owner_id) ?? "—",
      pet_name: pet?.name ?? "—",
      pet_species: pet?.species ?? "—",
    };
  });
}

export async function getVetMetrics(
  s: SupabaseClient<Database>,
  veterinarianId: string,
  dateStart: string,
  dateEnd: string,
): Promise<VetMetrics> {
  const { data } = await s
    .from("appointments")
    .select("id, status")
    .eq("assigned_user_id", veterinarianId)
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd);

  if (!data) return { todayTotal: 0, pending: 0, confirmed: 0, completed: 0, noExamination: 0 };

  return {
    todayTotal: data.filter((a) => a.status !== "cancelled").length,
    pending: data.filter((a) => a.status === "pending").length,
    confirmed: data.filter((a) => a.status === "confirmed").length,
    completed: data.filter((a) => a.status === "completed").length,
    noExamination: data.filter((a) => a.status === "confirmed" || a.status === "pending").length,
  };
}

export async function getNextPatient(
  s: SupabaseClient<Database>,
  veterinarianId: string,
  nowIso: string,
): Promise<VetAppointment | null> {
  const { data } = await s
    .from("appointments")
    .select("id, starts_at, ends_at, status, service_key, owner_id, pet_id, assigned_user_id")
    .eq("assigned_user_id", veterinarianId)
    .gt("starts_at", nowIso)
    .in("status", ["pending", "confirmed"])
    .order("starts_at")
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const [ownerRes, petRes] = await Promise.all([
    s.from("owners").select("id, full_name").eq("id", data.owner_id).limit(1),
    s.from("pets").select("id, name, species").eq("id", data.pet_id).limit(1),
  ]);

  const pet = petRes.data?.[0];
  return {
    ...data,
    owner_name: ownerRes.data?.[0]?.full_name ?? "—",
    pet_name: pet?.name ?? "—",
    pet_species: pet?.species ?? "—",
  };
}

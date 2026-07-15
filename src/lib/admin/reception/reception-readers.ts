import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

/**
 * Reception-scoped data readers — bounded by visible date range.
 * Uses user-context client (RLS applies).
 */

export type ReceptionAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  service_key: string;
  owner_id: string;
  pet_id: string;
  assigned_user_id: string | null;
  requested_veterinarian_id: string | null;
  public_booking_reference: string | null;
  phone: string;
  owner_name: string;
  pet_name: string;
  vet_name: string | null;
};

export type ReceptionMetrics = {
  todayTotal: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  website: number;
  unassigned: number;
};

export async function getReceptionAppointments(
  s: SupabaseClient<Database>,
  dateStart: string,
  dateEnd: string,
): Promise<ReceptionAppointment[]> {
  const { data } = await s
    .from("appointments")
    .select("id, starts_at, ends_at, status, source, service_key, owner_id, pet_id, assigned_user_id, requested_veterinarian_id, public_booking_reference")
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd)
    .order("starts_at");

  if (!data || data.length === 0) return [];

  const ownerIds = [...new Set(data.map((a) => a.owner_id))];
  const petIds = [...new Set(data.map((a) => a.pet_id))];
  const vetIds = [...new Set(data.filter((a) => a.assigned_user_id).map((a) => a.assigned_user_id!))];

  const [ownersRes, petsRes, vetsRes] = await Promise.all([
    ownerIds.length > 0 ? s.from("owners").select("id, full_name, phone").in("id", ownerIds) : Promise.resolve({ data: [] }),
    petIds.length > 0 ? s.from("pets").select("id, name").in("id", petIds) : Promise.resolve({ data: [] }),
    vetIds.length > 0 ? s.from("profiles").select("id, full_name").in("id", vetIds) : Promise.resolve({ data: [] }),
  ]);

  const ownerMap = new Map(ownersRes.data?.map((o) => [o.id, { name: o.full_name, phone: o.phone }]));
  const petMap = new Map(petsRes.data?.map((p) => [p.id, p.name]));
  const vetMap = new Map(vetsRes.data?.map((v) => [v.id, v.full_name]));

  return data.map((a) => {
    const owner = ownerMap.get(a.owner_id);
    return {
      ...a,
      owner_name: owner?.name ?? "—",
      pet_name: petMap.get(a.pet_id) ?? "—",
      vet_name: a.assigned_user_id ? vetMap.get(a.assigned_user_id) ?? null : null,
      phone: owner?.phone ?? "",
    };
  });
}

export async function getReceptionMetrics(
  s: SupabaseClient<Database>,
  dateStart: string,
  dateEnd: string,
): Promise<ReceptionMetrics> {
  const { data } = await s
    .from("appointments")
    .select("status, source, assigned_user_id")
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd);

  if (!data) return { todayTotal: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, noShow: 0, website: 0, unassigned: 0 };

  return {
    todayTotal: data.filter((a) => a.status !== "cancelled").length,
    pending: data.filter((a) => a.status === "pending").length,
    confirmed: data.filter((a) => a.status === "confirmed").length,
    completed: data.filter((a) => a.status === "completed").length,
    cancelled: data.filter((a) => a.status === "cancelled").length,
    noShow: data.filter((a) => a.status === "no_show").length,
    website: data.filter((a) => a.source === "website").length,
    unassigned: data.filter((a) => !a.assigned_user_id).length,
  };
}

export async function searchOwnersAndPets(
  s: SupabaseClient<Database>,
  query: string,
): Promise<{ owners: Array<{ id: string; full_name: string; phone: string | null }>; pets: Array<{ id: string; name: string; owner_id: string }> }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { owners: [], pets: [] };

  const [ownersRes, petsRes] = await Promise.all([
    s.from("owners").select("id, full_name, phone").ilike("full_name", `%${trimmed}%`).limit(10),
    s.from("pets").select("id, name, owner_id").ilike("name", `%${trimmed}%`).limit(10),
  ]);

  return {
    owners: ownersRes.data ?? [],
    pets: petsRes.data ?? [],
  };
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClinicFlowState, Database } from "@/src/types/database";
import { deriveFlowState } from "@/src/lib/admin/clinic-flow/clinic-flow";

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
  flow_state: ClinicFlowState;
  checked_in_at: string | null;
  waiting_started_at: string | null;
  called_at: string | null;
  examination_started_at: string | null;
  flow_completed_at: string | null;
  examination_id: string | null;
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
  waiting: number;
  inExam: number;
};

export async function getReceptionAppointments(
  s: SupabaseClient<Database>,
  dateStart: string,
  dateEnd: string,
): Promise<ReceptionAppointment[]> {
  const { data } = await s
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, source, service_key, owner_id, pet_id, assigned_user_id, requested_veterinarian_id, public_booking_reference, flow_state, checked_in_at, waiting_started_at, called_at, examination_started_at, flow_completed_at",
    )
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd)
    .order("starts_at");

  if (!data || data.length === 0) return [];

  const ownerIds = [...new Set(data.map((a) => a.owner_id))];
  const petIds = [...new Set(data.map((a) => a.pet_id))];
  const vetIds = [...new Set(data.filter((a) => a.assigned_user_id).map((a) => a.assigned_user_id!))];
  const appointmentIds = data.map((a) => a.id);

  const [ownersRes, petsRes, vetsRes, examsRes] = await Promise.all([
    ownerIds.length > 0
      ? s.from("owners").select("id, full_name, phone").in("id", ownerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; phone: string }> }),
    petIds.length > 0
      ? s.from("pets").select("id, name").in("id", petIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    vetIds.length > 0
      ? s.from("profiles").select("id, full_name").in("id", vetIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    appointmentIds.length > 0
      ? s
          .from("examinations")
          .select("id, appointment_id, status")
          .in("appointment_id", appointmentIds)
          .neq("status", "archived")
      : Promise.resolve({ data: [] as Array<{ id: string; appointment_id: string | null; status: string }> }),
  ]);

  const ownerMap = new Map(ownersRes.data?.map((o) => [o.id, { name: o.full_name, phone: o.phone }]));
  const petMap = new Map(petsRes.data?.map((p) => [p.id, p.name]));
  const vetMap = new Map(vetsRes.data?.map((v) => [v.id, v.full_name]));
  const examMap = new Map<string, string>();
  for (const e of examsRes.data ?? []) {
    if (e.appointment_id && !examMap.has(e.appointment_id)) {
      examMap.set(e.appointment_id, e.id);
    }
  }

  return data.map((a) => {
    const owner = ownerMap.get(a.owner_id);
    const flow = deriveFlowState(a);
    return {
      ...a,
      owner_name: owner?.name ?? "—",
      pet_name: petMap.get(a.pet_id) ?? "—",
      vet_name: a.assigned_user_id ? (vetMap.get(a.assigned_user_id) ?? null) : null,
      phone: owner?.phone ?? "",
      flow_state: flow,
      checked_in_at: a.checked_in_at ?? null,
      waiting_started_at: a.waiting_started_at ?? null,
      called_at: a.called_at ?? null,
      examination_started_at: a.examination_started_at ?? null,
      flow_completed_at: a.flow_completed_at ?? null,
      examination_id: examMap.get(a.id) ?? null,
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
    .select("status, source, assigned_user_id, flow_state")
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd);

  if (!data) {
    return {
      todayTotal: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      website: 0,
      unassigned: 0,
      waiting: 0,
      inExam: 0,
    };
  }

  return {
    todayTotal: data.filter((a) => a.status !== "cancelled").length,
    pending: data.filter((a) => a.status === "pending").length,
    confirmed: data.filter((a) => a.status === "confirmed").length,
    completed: data.filter((a) => a.status === "completed").length,
    cancelled: data.filter((a) => a.status === "cancelled").length,
    noShow: data.filter((a) => a.status === "no_show").length,
    website: data.filter((a) => a.source === "website").length,
    unassigned: data.filter((a) => !a.assigned_user_id).length,
    waiting: data.filter((a) => a.flow_state === "waiting").length,
    inExam: data.filter((a) => a.flow_state === "in_examination").length,
  };
}

export async function searchOwnersAndPets(
  s: SupabaseClient<Database>,
  query: string,
): Promise<{
  owners: Array<{ id: string; full_name: string; phone: string | null }>;
  pets: Array<{ id: string; name: string; owner_id: string }>;
}> {
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

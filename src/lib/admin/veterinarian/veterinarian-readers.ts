import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClinicFlowState, Database } from "@/src/types/database";
import { deriveFlowState } from "@/src/lib/admin/clinic-flow/clinic-flow";

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
  flow_state: ClinicFlowState;
  checked_in_at: string | null;
  waiting_started_at: string | null;
  called_at: string | null;
  examination_started_at: string | null;
  flow_completed_at: string | null;
  examination_id: string | null;
};

export type VetMetrics = {
  todayTotal: number;
  pending: number;
  confirmed: number;
  completed: number;
  noExamination: number;
  waiting: number;
  called: number;
  inExam: number;
};

function mapAppointments(
  data: Array<{
    id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    service_key: string;
    owner_id: string;
    pet_id: string;
    assigned_user_id: string | null;
    flow_state?: string | null;
    checked_in_at?: string | null;
    waiting_started_at?: string | null;
    called_at?: string | null;
    examination_started_at?: string | null;
    flow_completed_at?: string | null;
  }>,
  ownerMap: Map<string, string>,
  petMap: Map<string, { name: string; species: string }>,
  examMap: Map<string, string>,
): VetAppointment[] {
  return data.map((a) => {
    const pet = petMap.get(a.pet_id);
    return {
      ...a,
      owner_name: ownerMap.get(a.owner_id) ?? "—",
      pet_name: pet?.name ?? "—",
      pet_species: pet?.species ?? "—",
      flow_state: deriveFlowState(a),
      checked_in_at: a.checked_in_at ?? null,
      waiting_started_at: a.waiting_started_at ?? null,
      called_at: a.called_at ?? null,
      examination_started_at: a.examination_started_at ?? null,
      flow_completed_at: a.flow_completed_at ?? null,
      examination_id: examMap.get(a.id) ?? null,
    };
  });
}

export async function getVetAppointments(
  s: SupabaseClient<Database>,
  veterinarianId: string,
  dateStart: string,
  dateEnd: string,
): Promise<VetAppointment[]> {
  const { data } = await s
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, service_key, owner_id, pet_id, assigned_user_id, flow_state, checked_in_at, waiting_started_at, called_at, examination_started_at, flow_completed_at",
    )
    .eq("assigned_user_id", veterinarianId)
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd)
    .order("starts_at");

  if (!data || data.length === 0) return [];

  const ownerIds = [...new Set(data.map((a) => a.owner_id))];
  const petIds = [...new Set(data.map((a) => a.pet_id))];
  const appointmentIds = data.map((a) => a.id);

  const [ownersRes, petsRes, examsRes] = await Promise.all([
    ownerIds.length > 0
      ? s.from("owners").select("id, full_name").in("id", ownerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    petIds.length > 0
      ? s.from("pets").select("id, name, species").in("id", petIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; species: string }> }),
    appointmentIds.length > 0
      ? s
          .from("examinations")
          .select("id, appointment_id")
          .in("appointment_id", appointmentIds)
          .neq("status", "archived")
      : Promise.resolve({ data: [] as Array<{ id: string; appointment_id: string | null }> }),
  ]);

  const ownerMap = new Map(ownersRes.data?.map((o) => [o.id, o.full_name]));
  const petMap = new Map(petsRes.data?.map((p) => [p.id, { name: p.name, species: p.species }]));
  const examMap = new Map<string, string>();
  for (const e of examsRes.data ?? []) {
    if (e.appointment_id && !examMap.has(e.appointment_id)) examMap.set(e.appointment_id, e.id);
  }

  return mapAppointments(data, ownerMap, petMap, examMap);
}

export async function getVetMetrics(
  s: SupabaseClient<Database>,
  veterinarianId: string,
  dateStart: string,
  dateEnd: string,
): Promise<VetMetrics> {
  const { data } = await s
    .from("appointments")
    .select("id, status, flow_state")
    .eq("assigned_user_id", veterinarianId)
    .gte("starts_at", dateStart)
    .lt("starts_at", dateEnd);

  if (!data) {
    return {
      todayTotal: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      noExamination: 0,
      waiting: 0,
      called: 0,
      inExam: 0,
    };
  }

  return {
    todayTotal: data.filter((a) => a.status !== "cancelled").length,
    pending: data.filter((a) => a.status === "pending").length,
    confirmed: data.filter((a) => a.status === "confirmed").length,
    completed: data.filter((a) => a.status === "completed").length,
    noExamination: data.filter((a) => a.status === "confirmed" || a.status === "pending").length,
    waiting: data.filter((a) => a.flow_state === "waiting").length,
    called: data.filter((a) => a.flow_state === "called").length,
    inExam: data.filter((a) => a.flow_state === "in_examination").length,
  };
}

export async function getNextPatient(
  s: SupabaseClient<Database>,
  veterinarianId: string,
  nowIso: string,
): Promise<VetAppointment | null> {
  // Prefer waiting/called patients, then nearest upcoming scheduled
  const { data: queue } = await s
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, service_key, owner_id, pet_id, assigned_user_id, flow_state, checked_in_at, waiting_started_at, called_at, examination_started_at, flow_completed_at",
    )
    .eq("assigned_user_id", veterinarianId)
    .in("flow_state", ["waiting", "called"])
    .in("status", ["pending", "confirmed"])
    .order("waiting_started_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const data =
    queue ??
    (
      await s
        .from("appointments")
        .select(
          "id, starts_at, ends_at, status, service_key, owner_id, pet_id, assigned_user_id, flow_state, checked_in_at, waiting_started_at, called_at, examination_started_at, flow_completed_at",
        )
        .eq("assigned_user_id", veterinarianId)
        .gt("starts_at", nowIso)
        .in("status", ["pending", "confirmed"])
        .order("starts_at")
        .limit(1)
        .maybeSingle()
    ).data;

  if (!data) return null;

  const [ownerRes, petRes, examRes] = await Promise.all([
    s.from("owners").select("id, full_name").eq("id", data.owner_id).limit(1),
    s.from("pets").select("id, name, species").eq("id", data.pet_id).limit(1),
    s
      .from("examinations")
      .select("id")
      .eq("appointment_id", data.id)
      .neq("status", "archived")
      .limit(1)
      .maybeSingle(),
  ]);

  const pet = petRes.data?.[0];
  return {
    ...data,
    owner_name: ownerRes.data?.[0]?.full_name ?? "—",
    pet_name: pet?.name ?? "—",
    pet_species: pet?.species ?? "—",
    flow_state: deriveFlowState(data),
    checked_in_at: data.checked_in_at ?? null,
    waiting_started_at: data.waiting_started_at ?? null,
    called_at: data.called_at ?? null,
    examination_started_at: data.examination_started_at ?? null,
    flow_completed_at: data.flow_completed_at ?? null,
    examination_id: examRes.data?.id ?? null,
  };
}

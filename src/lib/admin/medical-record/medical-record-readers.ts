import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

/**
 * Medical record readers — bounded queries for unified patient timeline.
 * Uses user-context client (RLS applies).
 */

export type PetMedicalRecord = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  birth_date: string | null;
  microchip_number: string | null;
  owner_id: string;
  archived_at: string | null;
  owner_name: string;
  owner_phone: string | null;
};

export type TimelineEvent = {
  id: string;
  event_type: "appointment" | "examination" | "vaccination" | "parasite" | "reminder" | "document";
  occurred_at: string;
  title: string;
  description: string | null;
  status: string;
  veterinarian_name: string | null;
  source_route: string;
  finalized: boolean;
};

export async function getPetMedicalRecord(
  s: SupabaseClient<Database>,
  petId: string,
): Promise<PetMedicalRecord | null> {
  const { data: pet } = await s
    .from("pets")
    .select("id, name, species, breed, sex, birth_date, microchip_number, owner_id, archived_at")
    .eq("id", petId)
    .maybeSingle();

  if (!pet) return null;

  const { data: owner } = await s
    .from("owners")
    .select("full_name, phone")
    .eq("id", pet.owner_id)
    .maybeSingle();

  return {
    ...pet,
    owner_name: owner?.full_name ?? "—",
    owner_phone: owner?.phone ?? null,
  };
}

export async function getTimelineEvents(
  s: SupabaseClient<Database>,
  petId: string,
  dateStart?: string,
  dateEnd?: string,
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  // Parallel bounded queries
  const [
    { data: appointments },
    { data: examinations },
    { data: vaccinations },
    { data: parasites },
    { data: reminders },
    { data: documents },
  ] = await Promise.all([
    s.from("appointments")
      .select("id, starts_at, status, service_key, assigned_user_id")
      .eq("pet_id", petId)
      .order("starts_at", { ascending: false }),
    s.from("examinations")
      .select("id, created_at, status, visit_type, veterinarian_id, finalized_at")
      .eq("pet_id", petId)
      .order("created_at", { ascending: false }),
    s.from("vaccination_records")
      .select("id, administration_date, vaccine_name, status")
      .eq("pet_id", petId)
      .is("archived_at", null)
      .order("administration_date", { ascending: false }),
    s.from("parasite_records")
      .select("id, administration_date, product_name, status")
      .eq("pet_id", petId)
      .is("archived_at", null)
      .order("administration_date", { ascending: false }),
    s.from("reminders")
      .select("id, scheduled_for, reminder_type, status")
      .eq("pet_id", petId)
      .order("scheduled_for", { ascending: false }),
    s.from("generated_documents")
      .select("id, generated_at, document_type, status")
      .eq("pet_id", petId)
      .order("generated_at", { ascending: false }),
  ]);

  if (appointments) {
    for (const appt of appointments) {
      if (dateStart && appt.starts_at < dateStart) continue;
      if (dateEnd && appt.starts_at > dateEnd) continue;

      const { data: vet } = appt.assigned_user_id
        ? await s.from("profiles").select("full_name").eq("id", appt.assigned_user_id).maybeSingle()
        : { data: null };

      events.push({
        id: appt.id,
        event_type: "appointment",
        occurred_at: appt.starts_at,
        title: "Randevu",
        description: appt.service_key,
        status: appt.status,
        veterinarian_name: vet?.full_name ?? null,
        source_route: `/admin/appointments/${appt.id}`,
        finalized: appt.status === "completed" || appt.status === "cancelled",
      });
    }
  }

  if (examinations) {
    for (const exam of examinations) {
      if (dateStart && exam.created_at < dateStart) continue;
      if (dateEnd && exam.created_at > dateEnd) continue;

      const { data: vet } = await s
        .from("profiles")
        .select("full_name")
        .eq("id", exam.veterinarian_id)
        .maybeSingle();

      events.push({
        id: exam.id,
        event_type: "examination",
        occurred_at: exam.created_at,
        title: "Muayene",
        description: exam.visit_type,
        status: exam.status,
        veterinarian_name: vet?.full_name ?? null,
        source_route: `/admin/examinations/${exam.id}`,
        finalized: exam.status === "finalized",
      });
    }
  }

  if (vaccinations) {
    for (const vac of vaccinations) {
      if (dateStart && vac.administration_date < dateStart) continue;
      if (dateEnd && vac.administration_date > dateEnd) continue;

      events.push({
        id: vac.id,
        event_type: "vaccination",
        occurred_at: vac.administration_date,
        title: "Aşı",
        description: vac.vaccine_name,
        status: vac.status,
        veterinarian_name: null,
        source_route: `/admin/vaccines/${vac.id}`,
        finalized: true,
      });
    }
  }

  if (parasites) {
    for (const par of parasites) {
      if (dateStart && par.administration_date < dateStart) continue;
      if (dateEnd && par.administration_date > dateEnd) continue;

      events.push({
        id: par.id,
        event_type: "parasite",
        occurred_at: par.administration_date,
        title: "Parazit",
        description: par.product_name,
        status: par.status,
        veterinarian_name: null,
        source_route: `/admin/parasites/${par.id}`,
        finalized: true,
      });
    }
  }

  if (reminders) {
    for (const rem of reminders) {
      if (dateStart && rem.scheduled_for < dateStart) continue;
      if (dateEnd && rem.scheduled_for > dateEnd) continue;

      events.push({
        id: rem.id,
        event_type: "reminder",
        occurred_at: rem.scheduled_for,
        title: "Hatırlatıcı",
        description: rem.reminder_type,
        status: rem.status,
        veterinarian_name: null,
        source_route: `/admin/reminders/${rem.id}`,
        finalized: rem.status === "sent" || rem.status === "cancelled",
      });
    }
  }

  if (documents) {
    for (const doc of documents) {
      if (dateStart && doc.generated_at < dateStart) continue;
      if (dateEnd && doc.generated_at > dateEnd) continue;

      events.push({
        id: doc.id,
        event_type: "document",
        occurred_at: doc.generated_at,
        title: "Belge",
        description: doc.document_type,
        status: doc.status,
        veterinarian_name: null,
        source_route: `/admin/documents/${doc.id}`,
        finalized: true,
      });
    }
  }

  // Sort by occurred_at descending
  events.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  return events;
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildFlowAuditMetadata,
  deriveFlowState,
  FLOW_AUDIT_ACTIONS,
  flowTimestampPatch,
  nextFlowState,
  type ClinicFlowAction,
  type ClinicFlowState,
  validateFlowTransition,
} from "@/src/lib/admin/clinic-flow/clinic-flow";
import { canWriteExamination } from "@/src/lib/admin/examinations";
import { canTransitionStatus } from "@/src/lib/admin/appointments";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";
import type { AppointmentStatus, Json } from "@/src/types/database";

export type ClinicFlowResult = {
  ok: boolean;
  message: string;
  examinationId?: string;
};

const FAILED: ClinicFlowResult = {
  ok: false,
  message: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function revalidateClinicPaths(appointmentId: string) {
  revalidatePath("/admin/reception");
  revalidatePath("/admin/veterinarian");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${appointmentId}`);
}

type AppointmentRow = {
  id: string;
  status: AppointmentStatus;
  owner_id: string;
  pet_id: string;
  assigned_user_id: string | null;
  flow_state: string | null;
  checked_in_at: string | null;
  waiting_started_at: string | null;
  called_at: string | null;
  examination_started_at: string | null;
  flow_completed_at: string | null;
};

async function loadAppointment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  s: any,
  id: string,
): Promise<AppointmentRow | null> {
  const { data } = await s
    .from("appointments")
    .select(
      "id, status, owner_id, pet_id, assigned_user_id, flow_state, checked_in_at, waiting_started_at, called_at, examination_started_at, flow_completed_at",
    )
    .eq("id", id)
    .maybeSingle();
  return data as AppointmentRow | null;
}

/**
 * Core optimistic transition: reload → authorize → validate →
 * update with expected flow_state → audit.
 */
async function applyFlowTransition(
  appointmentId: string,
  action: ClinicFlowAction,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  if (!isUuid(appointmentId)) {
    return { ok: false, message: "Geçersiz randevu." };
  }

  const session = await requireStaff();
  const s = await createClient();
  if (!s) return FAILED;

  const row = await loadAppointment(s, appointmentId);
  if (!row) return { ok: false, message: "Randevu bulunamadı." };

  const currentFlow = deriveFlowState(row);

  // Stale browser: expected state must match current
  if (currentFlow !== expectedFlowState) {
    return {
      ok: false,
      message: "Kayıt güncellenmiş. Lütfen sayfayı yenileyip tekrar deneyin.",
    };
  }

  const validationError = validateFlowTransition({
    role: session.profile.role,
    action,
    currentFlow,
    businessStatus: row.status,
    assignedUserId: row.assigned_user_id,
    actorId: session.id,
  });
  if (validationError) return { ok: false, message: validationError };

  const nowIso = new Date().toISOString();

  // Side-effect actions that also change business status
  if (action === "cancel") {
    if (!canTransitionStatus(row.status, "cancelled", session.profile.role, true)) {
      return { ok: false, message: "Bu randevu iptal edilemez." };
    }
    const { data: updated, error } = await s
      .from("appointments")
      .update({ status: "cancelled" as AppointmentStatus })
      .eq("id", appointmentId)
      .eq("status", row.status)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      return {
        ok: false,
        message: "Kayıt güncellenmiş. Lütfen sayfayı yenileyip tekrar deneyin.",
      };
    }
    await s.from("audit_logs").insert({
      actor_user_id: session.id,
      action: "appointment_cancelled",
      entity_type: "appointment",
      entity_id: appointmentId,
      metadata: {
        previous_status: row.status,
        new_status: "cancelled",
        via: "clinic_flow",
      } as Json,
    });
    revalidateClinicPaths(appointmentId);
    return { ok: true, message: "Randevu iptal edildi." };
  }

  if (action === "no_show") {
    if (!canTransitionStatus(row.status, "no_show", session.profile.role, session.profile.role === "admin")) {
      return { ok: false, message: "Gelmedi işaretlenemedi." };
    }
    const { data: updated, error } = await s
      .from("appointments")
      .update({ status: "no_show" as AppointmentStatus })
      .eq("id", appointmentId)
      .eq("status", row.status)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      return {
        ok: false,
        message: "Kayıt güncellenmiş. Lütfen sayfayı yenileyip tekrar deneyin.",
      };
    }
    await s.from("audit_logs").insert({
      actor_user_id: session.id,
      action: "appointment_status_changed",
      entity_type: "appointment",
      entity_id: appointmentId,
      metadata: {
        previous_status: row.status,
        new_status: "no_show",
        via: "clinic_flow",
      } as Json,
    });
    revalidateClinicPaths(appointmentId);
    return { ok: true, message: "Gelmedi olarak işaretlendi." };
  }

  const next = nextFlowState(currentFlow, action);
  if (!next) return { ok: false, message: "Geçersiz akış geçişi." };

  const patch = flowTimestampPatch(action, next, nowIso);

  // Optimistic concurrency on flow_state
  const { data: updated, error } = await s
    .from("appointments")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq("id", appointmentId)
    .eq("flow_state", currentFlow)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return {
      ok: false,
      message: "Kayıt güncellenmiş. Lütfen sayfayı yenileyip tekrar deneyin.",
    };
  }

  const auditAction =
    action in FLOW_AUDIT_ACTIONS
      ? FLOW_AUDIT_ACTIONS[action as keyof typeof FLOW_AUDIT_ACTIONS]
      : "clinic_flow_corrected";

  const metadata = buildFlowAuditMetadata({
    appointmentId,
    actorId: session.id,
    oldFlow: currentFlow,
    newFlow: next,
    timestamp: nowIso,
  });

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: auditAction,
    entity_type: "appointment",
    entity_id: appointmentId,
    metadata: metadata as unknown as Json,
  });

  revalidateClinicPaths(appointmentId);
  return { ok: true, message: "Akış güncellendi." };
}

export async function checkInPatient(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  return applyFlowTransition(appointmentId, "check_in", expectedFlowState);
}

export async function movePatientToWaiting(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  return applyFlowTransition(appointmentId, "move_to_waiting", expectedFlowState);
}

export async function callPatient(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  return applyFlowTransition(appointmentId, "call_patient", expectedFlowState);
}

export async function returnPatientToWaiting(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  return applyFlowTransition(appointmentId, "return_to_waiting", expectedFlowState);
}

export async function undoCheckIn(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  return applyFlowTransition(appointmentId, "undo_check_in", expectedFlowState);
}

export async function completeClinicFlow(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  // Does NOT set appointment.status = completed — clinical finalization is separate
  return applyFlowTransition(appointmentId, "complete_flow", expectedFlowState);
}

export async function cancelFromClinicFlow(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  return applyFlowTransition(appointmentId, "cancel", expectedFlowState);
}

export async function markNoShowFromClinicFlow(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  return applyFlowTransition(appointmentId, "no_show", expectedFlowState);
}

/**
 * Start examination from clinic flow:
 * 1. verify appointment + owner/pet + assigned vet
 * 2. prevent duplicate examination
 * 3. create or open existing
 * 4. set examination_started_at / flow state
 * Does NOT finalize clinical records or complete the appointment.
 */
export async function startExaminationFromFlow(
  appointmentId: string,
  expectedFlowState: ClinicFlowState,
): Promise<ClinicFlowResult> {
  if (!isUuid(appointmentId)) {
    return { ok: false, message: "Geçersiz randevu." };
  }

  const session = await requireStaff();
  if (!canWriteExamination(session.profile.role)) {
    return { ok: false, message: "Bu işlem için yetkiniz bulunmuyor." };
  }

  const s = await createClient();
  if (!s) return FAILED;

  const row = await loadAppointment(s, appointmentId);
  if (!row) return { ok: false, message: "Randevu bulunamadı." };

  const currentFlow = deriveFlowState(row);
  if (currentFlow !== expectedFlowState) {
    return {
      ok: false,
      message: "Kayıt güncellenmiş. Lütfen sayfayı yenileyip tekrar deneyin.",
    };
  }

  const validationError = validateFlowTransition({
    role: session.profile.role,
    action: "start_examination",
    currentFlow,
    businessStatus: row.status,
    assignedUserId: row.assigned_user_id,
    actorId: session.id,
  });
  if (validationError) return { ok: false, message: validationError };

  // Owner/pet relationship
  const { data: pet } = await s
    .from("pets")
    .select("id, owner_id")
    .eq("id", row.pet_id)
    .eq("owner_id", row.owner_id)
    .is("archived_at", null)
    .maybeSingle();
  if (!pet) {
    return { ok: false, message: "Sahip ve hayvan eşleşmesi doğrulanamadı." };
  }

  // Assigned veterinarian must be clinical for examination creation
  const veterinarianId =
    session.profile.role === "veterinarian"
      ? session.id
      : row.assigned_user_id;

  if (!veterinarianId) {
    return { ok: false, message: "Randevuya veteriner atanmamış." };
  }

  const { data: vetProfile } = await s
    .from("profiles")
    .select("id, role, status")
    .eq("id", veterinarianId)
    .maybeSingle();

  if (
    !vetProfile ||
    vetProfile.status !== "active" ||
    (vetProfile.role !== "veterinarian" && vetProfile.role !== "admin")
  ) {
    return { ok: false, message: "Geçerli bir veteriner hekim bulunamadı." };
  }

  // Existing examination for this appointment?
  const { data: existing } = await s
    .from("examinations")
    .select("id, status")
    .eq("appointment_id", appointmentId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let examinationId = existing?.id as string | undefined;

  if (!examinationId) {
    const { data: created, error: createError } = await s
      .from("examinations")
      .insert({
        pet_id: row.pet_id,
        owner_id: row.owner_id,
        appointment_id: appointmentId,
        veterinarian_id: veterinarianId,
        status: "draft",
        visit_type: "general_exam",
      })
      .select("id")
      .single();

    if (createError || !created) {
      // Race: another request may have created it
      const { data: raced } = await s
        .from("examinations")
        .select("id")
        .eq("appointment_id", appointmentId)
        .neq("status", "archived")
        .limit(1)
        .maybeSingle();
      if (!raced) return FAILED;
      examinationId = raced.id;
    } else {
      examinationId = created.id;
      await s.from("audit_logs").insert({
        actor_user_id: session.id,
        action: "examination_created",
        entity_type: "examination",
        entity_id: examinationId,
        metadata: {
          visit_type: "general_exam",
          appointment_id: appointmentId,
          via: "clinic_flow",
        } as Json,
      });
    }
  }

  const nowIso = new Date().toISOString();
  const next: ClinicFlowState = "in_examination";
  const patch = flowTimestampPatch("start_examination", next, nowIso);

  // Only advance flow if currently "called"; if already in_examination, just open
  if (currentFlow === "called") {
    const { data: updated, error } = await s
      .from("appointments")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", appointmentId)
      .eq("flow_state", "called")
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      return {
        ok: false,
        message: "Kayıt güncellenmiş. Lütfen sayfayı yenileyip tekrar deneyin.",
      };
    }

    const metadata = buildFlowAuditMetadata({
      appointmentId,
      actorId: session.id,
      oldFlow: currentFlow,
      newFlow: next,
      timestamp: nowIso,
    });

    await s.from("audit_logs").insert({
      actor_user_id: session.id,
      action: FLOW_AUDIT_ACTIONS.start_examination,
      entity_type: "appointment",
      entity_id: appointmentId,
      metadata: metadata as unknown as Json,
    });
  } else if (currentFlow === "in_examination") {
    // Open existing — no state change
  } else {
    return { ok: false, message: "Geçersiz akış geçişi." };
  }

  revalidateClinicPaths(appointmentId);
  revalidatePath("/admin/examinations");
  revalidatePath(`/admin/examinations/${examinationId}`);

  redirect(`/admin/examinations/${examinationId}`);
}

import type { AppointmentStatus, UserRole } from "@/src/types/database";

/**
 * Clinic operational flow — independent of appointment business status.
 * Business status: pending | confirmed | completed | cancelled | no_show
 * Flow state: scheduled → checked_in → waiting → called → in_examination → completed
 */

export type ClinicFlowState =
  | "scheduled"
  | "checked_in"
  | "waiting"
  | "called"
  | "in_examination"
  | "completed";

export type ClinicFlowAction =
  | "check_in"
  | "move_to_waiting"
  | "call_patient"
  | "start_examination"
  | "complete_flow"
  | "return_to_waiting"
  | "undo_check_in"
  | "cancel"
  | "no_show";

export const CLINIC_FLOW_STATES: ClinicFlowState[] = [
  "scheduled",
  "checked_in",
  "waiting",
  "called",
  "in_examination",
  "completed",
];

export const flowStateLabels: Record<ClinicFlowState, string> = {
  scheduled: "Beklenen",
  checked_in: "Geldi",
  waiting: "Bekleme Salonunda",
  called: "Veteriner Çağırdı",
  in_examination: "Muayenede",
  completed: "Tamamlandı",
};

export const flowActionLabels: Record<ClinicFlowAction, string> = {
  check_in: "Geldi",
  move_to_waiting: "Beklemeye Al",
  call_patient: "Hastayı Çağır",
  start_examination: "Muayeneyi Başlat",
  complete_flow: "Tamamla",
  return_to_waiting: "Beklemeye Döndür",
  undo_check_in: "Check-in Geri Al",
  cancel: "İptal",
  no_show: "Gelmedi",
};

/** Audit actions — metadata must stay free of clinical PII. */
export const FLOW_AUDIT_ACTIONS = {
  check_in: "patient_checked_in",
  move_to_waiting: "patient_moved_to_waiting",
  call_patient: "patient_called",
  start_examination: "examination_started_from_flow",
  complete_flow: "clinic_flow_completed",
  return_to_waiting: "clinic_flow_corrected",
  undo_check_in: "clinic_flow_corrected",
} as const;

export type FlowAuditAction =
  (typeof FLOW_AUDIT_ACTIONS)[keyof typeof FLOW_AUDIT_ACTIONS];

const TERMINAL_BUSINESS: AppointmentStatus[] = ["cancelled", "no_show", "completed"];

/** Derive flow state from timestamps when flow_state is missing (pre-migration safety). */
export function deriveFlowState(row: {
  flow_state?: string | null;
  checked_in_at?: string | null;
  waiting_started_at?: string | null;
  called_at?: string | null;
  examination_started_at?: string | null;
  flow_completed_at?: string | null;
}): ClinicFlowState {
  if (row.flow_state && CLINIC_FLOW_STATES.includes(row.flow_state as ClinicFlowState)) {
    return row.flow_state as ClinicFlowState;
  }
  if (row.flow_completed_at) return "completed";
  if (row.examination_started_at) return "in_examination";
  if (row.called_at) return "called";
  if (row.waiting_started_at) return "waiting";
  if (row.checked_in_at) return "checked_in";
  return "scheduled";
}

/** Explicit allowed transitions: from → action → to */
const TRANSITIONS: Record<
  ClinicFlowState,
  Partial<Record<ClinicFlowAction, ClinicFlowState>>
> = {
  scheduled: {
    check_in: "checked_in",
  },
  checked_in: {
    move_to_waiting: "waiting",
    undo_check_in: "scheduled",
  },
  waiting: {
    call_patient: "called",
  },
  called: {
    start_examination: "in_examination",
    return_to_waiting: "waiting",
  },
  in_examination: {
    complete_flow: "completed",
  },
  completed: {},
};

/** Role matrix for operational flow actions */
const ROLE_ACTIONS: Record<UserRole, ClinicFlowAction[]> = {
  admin: [
    "check_in",
    "move_to_waiting",
    "call_patient",
    "start_examination",
    "complete_flow",
    "return_to_waiting",
    "undo_check_in",
    "cancel",
    "no_show",
  ],
  staff: ["check_in", "move_to_waiting", "cancel", "no_show"],
  veterinarian: [
    "call_patient",
    "start_examination",
    "complete_flow",
    "return_to_waiting",
  ],
};

export function canPerformFlowAction(role: UserRole, action: ClinicFlowAction): boolean {
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}

export function nextFlowState(
  from: ClinicFlowState,
  action: ClinicFlowAction,
): ClinicFlowState | null {
  return TRANSITIONS[from]?.[action] ?? null;
}

export function isBusinessStatusOpen(status: AppointmentStatus): boolean {
  return !TERMINAL_BUSINESS.includes(status);
}

/**
 * Validate a flow transition.
 * Returns null if valid, or a stable Turkish error message if invalid.
 */
export function validateFlowTransition(input: {
  role: UserRole;
  action: ClinicFlowAction;
  currentFlow: ClinicFlowState;
  businessStatus: AppointmentStatus;
  assignedUserId: string | null;
  actorId: string;
}): string | null {
  const { role, action, currentFlow, businessStatus, assignedUserId, actorId } = input;

  if (!canPerformFlowAction(role, action)) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }

  // Business-status side effects (cancel / no_show) — not pure flow graph edges
  if (action === "cancel") {
    if (role !== "admin") return "Randevuyu yalnızca yönetici iptal edebilir.";
    if (businessStatus !== "pending" && businessStatus !== "confirmed") {
      return "Bu randevu iptal edilemez.";
    }
    if (currentFlow === "completed" || currentFlow === "in_examination") {
      return "Muayene veya tamamlanmış akışta iptal yapılamaz.";
    }
    return null;
  }

  if (action === "no_show") {
    if (businessStatus !== "confirmed" && !(role === "admin" && businessStatus === "pending")) {
      return "Gelmedi yalnızca onaylı randevular için işaretlenebilir.";
    }
    if (currentFlow === "in_examination" || currentFlow === "completed" || currentFlow === "called") {
      return "Bu akış durumunda gelmedi işaretlenemez.";
    }
    return null;
  }

  if (!isBusinessStatusOpen(businessStatus)) {
    return "İptal, gelmedi veya tamamlanmış randevularda akış değiştirilemez.";
  }

  const next = nextFlowState(currentFlow, action);
  if (!next) {
    return "Geçersiz akış geçişi.";
  }

  // Veterinarian may only call / examine patients assigned to them
  if (
    role === "veterinarian" &&
    (action === "call_patient" ||
      action === "start_examination" ||
      action === "complete_flow" ||
      action === "return_to_waiting")
  ) {
    if (!assignedUserId || assignedUserId !== actorId) {
      return "Bu randevu size atanmamış.";
    }
  }

  return null;
}

/** Timestamp patch for a successful transition (server clock via nowIso). */
export function flowTimestampPatch(
  action: ClinicFlowAction,
  next: ClinicFlowState,
  nowIso: string,
): Record<string, string | null> {
  const base: Record<string, string | null> = { flow_state: next };

  switch (action) {
    case "check_in":
      base.checked_in_at = nowIso;
      break;
    case "move_to_waiting":
      base.waiting_started_at = nowIso;
      break;
    case "call_patient":
      base.called_at = nowIso;
      break;
    case "start_examination":
      base.examination_started_at = nowIso;
      break;
    case "complete_flow":
      base.flow_completed_at = nowIso;
      break;
    case "return_to_waiting":
      base.called_at = null;
      base.waiting_started_at = nowIso;
      break;
    case "undo_check_in":
      base.checked_in_at = null;
      base.waiting_started_at = null;
      base.called_at = null;
      base.examination_started_at = null;
      base.flow_completed_at = null;
      break;
    default:
      break;
  }

  return base;
}

export type SafeAuditMetadata = {
  appointment_id: string;
  actor_id: string;
  old_flow_state: ClinicFlowState;
  new_flow_state: ClinicFlowState;
  timestamp: string;
};

export function buildFlowAuditMetadata(input: {
  appointmentId: string;
  actorId: string;
  oldFlow: ClinicFlowState;
  newFlow: ClinicFlowState;
  timestamp: string;
}): SafeAuditMetadata {
  return {
    appointment_id: input.appointmentId,
    actor_id: input.actorId,
    old_flow_state: input.oldFlow,
    new_flow_state: input.newFlow,
    timestamp: input.timestamp,
  };
}

/** Forbidden keys that must never appear in flow audit metadata. */
export const FORBIDDEN_AUDIT_KEYS = [
  "phone",
  "owner_phone",
  "pet_name",
  "owner_name",
  "notes",
  "internal_notes",
  "diagnosis",
  "chief_complaint",
  "history",
  "examination_findings",
  "assessment",
  "treatment_plan",
  "medications_notes",
  "recommendations",
] as const;

export function auditMetadataIsSafe(meta: Record<string, unknown>): boolean {
  const keys = Object.keys(meta);
  const allowed = new Set([
    "appointment_id",
    "actor_id",
    "old_flow_state",
    "new_flow_state",
    "timestamp",
  ]);
  if (keys.some((k) => !allowed.has(k))) return false;
  for (const bad of FORBIDDEN_AUDIT_KEYS) {
    if (bad in meta) return false;
  }
  return true;
}

/** Waiting durations in minutes (non-negative integers). */
export function waitingDurations(
  row: {
    checked_in_at?: string | null;
    waiting_started_at?: string | null;
    called_at?: string | null;
  },
  nowMs: number = Date.now(),
): {
  minutesSinceCheckIn: number | null;
  minutesWaiting: number | null;
  minutesSinceCalled: number | null;
} {
  const mins = (iso: string | null | undefined) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    return Math.max(0, Math.floor((nowMs - t) / 60_000));
  };
  return {
    minutesSinceCheckIn: mins(row.checked_in_at),
    minutesWaiting: mins(row.waiting_started_at),
    minutesSinceCalled: mins(row.called_at),
  };
}

/** Long wait threshold (minutes) — visual highlight only, not medical urgency. */
export const LONG_WAIT_MINUTES = 30;

export function isLongWait(minutes: number | null): boolean {
  return minutes !== null && minutes >= LONG_WAIT_MINUTES;
}

export function formatMinutesTr(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 1) return "<1 dk";
  return `${minutes} dk`;
}

/** Istanbul display helpers — never use host machine timezone. */
export function formatIstanbulTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatIstanbulDateTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Valid actions for UI given role + current flow + business status */
export function availableFlowActions(
  role: UserRole,
  currentFlow: ClinicFlowState,
  businessStatus: AppointmentStatus,
  assignedUserId: string | null,
  actorId: string,
): ClinicFlowAction[] {
  const candidates = ROLE_ACTIONS[role] ?? [];
  return candidates.filter(
    (action) =>
      validateFlowTransition({
        role,
        action,
        currentFlow,
        businessStatus,
        assignedUserId,
        actorId,
      }) === null,
  );
}

export function flowSectionKey(state: ClinicFlowState): ClinicFlowState {
  return state;
}

export const RECEPTION_FLOW_SECTIONS: { state: ClinicFlowState; title: string }[] = [
  { state: "scheduled", title: "Beklenen Randevular" },
  { state: "checked_in", title: "Geldi" },
  { state: "waiting", title: "Bekleme Salonunda" },
  { state: "called", title: "Veteriner Çağırdı" },
  { state: "in_examination", title: "Muayenede" },
  { state: "completed", title: "Tamamlandı" },
];

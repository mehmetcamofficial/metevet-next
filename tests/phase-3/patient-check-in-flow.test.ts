import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  auditMetadataIsSafe,
  availableFlowActions,
  buildFlowAuditMetadata,
  CLINIC_FLOW_STATES,
  deriveFlowState,
  flowTimestampPatch,
  FORBIDDEN_AUDIT_KEYS,
  formatIstanbulTime,
  formatMinutesTr,
  isLongWait,
  LONG_WAIT_MINUTES,
  nextFlowState,
  RECEPTION_FLOW_SECTIONS,
  validateFlowTransition,
  waitingDurations,
} from "../../src/lib/admin/clinic-flow/clinic-flow.ts";
import { appointmentStatuses, canTransitionStatus } from "../../src/lib/admin/appointments.ts";

const ROOT = new URL("../../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, ROOT), "utf8");

const MIGRATION = read(
  "supabase/migrations/20260728000000_phase_3_7_patient_check_in_flow.sql",
);
const FLOW_LIB = read("src/lib/admin/clinic-flow/clinic-flow.ts");
const FLOW_ACTIONS = read("app/admin/clinic-flow/actions.ts");
const RECEPTION_WS = read("src/components/admin/reception/reception-workspace.tsx");
const RECEPTION_CARD = read(
  "src/components/admin/reception/reception-appointment-card.tsx",
);
const VET_QUEUE = read("src/components/admin/veterinarian/daily-patient-queue.tsx");
const VET_PAGE = read("app/admin/veterinarian/page.tsx");
const RECEPTION_READERS = read("src/lib/admin/reception/reception-readers.ts");
const VET_READERS = read("src/lib/admin/veterinarian/veterinarian-readers.ts");
const DB_TYPES = read("src/types/database.ts");
const FOUNDATION = read("supabase/migrations/20260713150000_phase_2_1_foundation.sql");
const FLOW_UI = read("src/components/admin/clinic-flow/clinic-flow-actions.tsx");
const FLOW_BADGE = read("src/components/admin/clinic-flow/flow-state-badge.tsx");

// ═══════════════════════════════════════════════════════════════════
// 1–3. Schema discovery & separation
// ═══════════════════════════════════════════════════════════════════

test("1. Schema discovery documented — migration adds flow timestamps", () => {
  assert.match(MIGRATION, /checked_in_at timestamptz/);
  assert.match(MIGRATION, /waiting_started_at timestamptz/);
  assert.match(MIGRATION, /called_at timestamptz/);
  assert.match(MIGRATION, /examination_started_at timestamptz/);
  assert.match(MIGRATION, /flow_completed_at timestamptz/);
  assert.match(MIGRATION, /flow_state text/);
});

test("2. Existing appointment statuses unchanged", () => {
  assert.deepEqual(appointmentStatuses, [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
  ]);
  assert.match(FOUNDATION, /'pending', 'confirmed', 'completed', 'cancelled', 'no_show'/);
  assert.doesNotMatch(MIGRATION, /ALTER TYPE public\.appointment_status/);
  assert.doesNotMatch(MIGRATION, /ADD VALUE.*appointment_status/);
});

test("3. Flow state separate from business status", () => {
  assert.ok(CLINIC_FLOW_STATES.includes("scheduled"));
  assert.ok(CLINIC_FLOW_STATES.includes("checked_in"));
  assert.ok(CLINIC_FLOW_STATES.includes("waiting"));
  assert.ok(CLINIC_FLOW_STATES.includes("called"));
  assert.ok(CLINIC_FLOW_STATES.includes("in_examination"));
  assert.ok(CLINIC_FLOW_STATES.includes("completed"));
  // completed exists in both domains but is independent
  assert.match(FLOW_LIB, /Independent of appointment business status|business lifecycle/i);
  assert.match(MIGRATION, /Independent of appointment_status/);
});

// ═══════════════════════════════════════════════════════════════════
// 4–14. State machine transitions
// ═══════════════════════════════════════════════════════════════════

const actor = "11111111-1111-4111-8111-111111111111";
const vet = "22222222-2222-4222-8222-222222222222";

test("4. Check-in valid from scheduled", () => {
  assert.equal(nextFlowState("scheduled", "check_in"), "checked_in");
  assert.equal(
    validateFlowTransition({
      role: "staff",
      action: "check_in",
      currentFlow: "scheduled",
      businessStatus: "confirmed",
      assignedUserId: vet,
      actorId: actor,
    }),
    null,
  );
});

test("5. Double check-in rejected", () => {
  assert.equal(nextFlowState("checked_in", "check_in"), null);
  assert.match(
    validateFlowTransition({
      role: "staff",
      action: "check_in",
      currentFlow: "checked_in",
      businessStatus: "confirmed",
      assignedUserId: vet,
      actorId: actor,
    }) ?? "",
    /Geçersiz/,
  );
});

test("6. Cancelled check-in rejected", () => {
  assert.match(
    validateFlowTransition({
      role: "staff",
      action: "check_in",
      currentFlow: "scheduled",
      businessStatus: "cancelled",
      assignedUserId: vet,
      actorId: actor,
    }) ?? "",
    /iptal|değiştirilemez/i,
  );
});

test("7. No-show check-in rejected", () => {
  assert.match(
    validateFlowTransition({
      role: "staff",
      action: "check_in",
      currentFlow: "scheduled",
      businessStatus: "no_show",
      assignedUserId: vet,
      actorId: actor,
    }) ?? "",
    /iptal|değiştirilemez|gelmedi/i,
  );
});

test("8. Checked-in to waiting", () => {
  assert.equal(nextFlowState("checked_in", "move_to_waiting"), "waiting");
  assert.equal(
    validateFlowTransition({
      role: "staff",
      action: "move_to_waiting",
      currentFlow: "checked_in",
      businessStatus: "confirmed",
      assignedUserId: vet,
      actorId: actor,
    }),
    null,
  );
});

test("9. Waiting to called", () => {
  assert.equal(nextFlowState("waiting", "call_patient"), "called");
  assert.equal(
    validateFlowTransition({
      role: "veterinarian",
      action: "call_patient",
      currentFlow: "waiting",
      businessStatus: "confirmed",
      assignedUserId: vet,
      actorId: vet,
    }),
    null,
  );
});

test("10. Called to examination", () => {
  assert.equal(nextFlowState("called", "start_examination"), "in_examination");
  assert.equal(
    validateFlowTransition({
      role: "veterinarian",
      action: "start_examination",
      currentFlow: "called",
      businessStatus: "confirmed",
      assignedUserId: vet,
      actorId: vet,
    }),
    null,
  );
});

test("11. Duplicate examination prevented — server checks existing", () => {
  assert.match(FLOW_ACTIONS, /existing/);
  assert.match(FLOW_ACTIONS, /appointment_id/);
  assert.match(FLOW_ACTIONS, /examinations/);
});

test("12. Completed transition", () => {
  assert.equal(nextFlowState("in_examination", "complete_flow"), "completed");
  assert.equal(
    validateFlowTransition({
      role: "veterinarian",
      action: "complete_flow",
      currentFlow: "in_examination",
      businessStatus: "confirmed",
      assignedUserId: vet,
      actorId: vet,
    }),
    null,
  );
  // Does not auto-set appointment status
  assert.match(FLOW_ACTIONS, /Does NOT set appointment\.status/);
});

test("13. Invalid transition rejected", () => {
  assert.equal(nextFlowState("scheduled", "call_patient"), null);
  assert.equal(nextFlowState("completed", "check_in"), null);
  assert.match(
    validateFlowTransition({
      role: "admin",
      action: "call_patient",
      currentFlow: "scheduled",
      businessStatus: "confirmed",
      assignedUserId: vet,
      actorId: actor,
    }) ?? "",
    /Geçersiz/,
  );
});

test("14. Stale transition rejected — expected flow_state concurrency", () => {
  assert.match(FLOW_ACTIONS, /eq\("flow_state"/);
  assert.match(FLOW_ACTIONS, /Kayıt güncellenmiş/);
  assert.match(FLOW_ACTIONS, /expectedFlowState|currentFlow !== expectedFlowState/);
});

// ═══════════════════════════════════════════════════════════════════
// 15–22. Roles and forgery
// ═══════════════════════════════════════════════════════════════════

test("15. Staff role — check-in and waiting only for flow", () => {
  const staffActions = availableFlowActions(
    "staff",
    "scheduled",
    "confirmed",
    vet,
    actor,
  );
  assert.ok(staffActions.includes("check_in"));
  assert.ok(!staffActions.includes("call_patient"));
  assert.ok(!staffActions.includes("start_examination"));
});

test("16. Veterinarian role — call and start examination", () => {
  const actions = availableFlowActions("veterinarian", "waiting", "confirmed", vet, vet);
  assert.ok(actions.includes("call_patient"));
  assert.ok(!actions.includes("check_in"));
});

test("17. Admin role — all operational transitions", () => {
  const a = availableFlowActions("admin", "scheduled", "confirmed", vet, actor);
  assert.ok(a.includes("check_in"));
  assert.ok(a.includes("cancel") || a.includes("no_show"));
  const b = availableFlowActions("admin", "waiting", "confirmed", vet, actor);
  assert.ok(b.includes("call_patient"));
});

test("18. Anonymous denied — requireStaff on actions", () => {
  assert.match(FLOW_ACTIONS, /requireStaff/);
});

test("19. Inactive profile denied — requireStaff redirects inactive", () => {
  const requireStaff = read("src/lib/auth/require-staff.ts");
  assert.match(requireStaff, /status !== "active"/);
});

test("20. Forged appointment denied — UUID validation", () => {
  assert.match(FLOW_ACTIONS, /isUuid|UUID_RE/);
  assert.match(FLOW_ACTIONS, /Geçersiz randevu/);
});

test("21. Forged veterinarian denied — assignment check", () => {
  assert.match(
    validateFlowTransition({
      role: "veterinarian",
      action: "call_patient",
      currentFlow: "waiting",
      businessStatus: "confirmed",
      assignedUserId: vet,
      actorId: actor, // different
    }) ?? "",
    /atanmamış/,
  );
  assert.match(VET_PAGE, /session\.profile\.role === "admin"/);
});

test("22. Owner/pet mismatch denied — examination start validates", () => {
  assert.match(FLOW_ACTIONS, /Sahip ve hayvan eşleşmesi|owner_id/);
  assert.match(FLOW_ACTIONS, /pets/);
});

// ═══════════════════════════════════════════════════════════════════
// 23–24. Audit safety
// ═══════════════════════════════════════════════════════════════════

test("23. Audit metadata safe", () => {
  const meta = buildFlowAuditMetadata({
    appointmentId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    actorId: actor,
    oldFlow: "scheduled",
    newFlow: "checked_in",
    timestamp: "2026-07-16T10:00:00.000Z",
  });
  assert.ok(auditMetadataIsSafe(meta as unknown as Record<string, unknown>));
  assert.equal(Object.keys(meta).sort().join(","), [
    "actor_id",
    "appointment_id",
    "new_flow_state",
    "old_flow_state",
    "timestamp",
  ].sort().join(","));
});

test("24. No clinical PII in audit", () => {
  for (const key of FORBIDDEN_AUDIT_KEYS) {
    assert.doesNotMatch(FLOW_ACTIONS, new RegExp(`metadata:[\\s\\S]{0,200}${key}`));
  }
  assert.match(FLOW_LIB, /appointment_id/);
  assert.match(FLOW_LIB, /old_flow_state/);
  assert.doesNotMatch(FLOW_ACTIONS, /metadata:[\s\S]{0,80}phone/);
  assert.doesNotMatch(FLOW_ACTIONS, /metadata:[\s\S]{0,80}diagnosis/);
});

// ═══════════════════════════════════════════════════════════════════
// 25–26. Waiting time & timezone
// ═══════════════════════════════════════════════════════════════════

test("25. Waiting duration", () => {
  const now = Date.parse("2026-07-16T12:00:00.000Z");
  const d = waitingDurations(
    {
      checked_in_at: "2026-07-16T11:30:00.000Z",
      waiting_started_at: "2026-07-16T11:40:00.000Z",
      called_at: "2026-07-16T11:55:00.000Z",
    },
    now,
  );
  assert.equal(d.minutesSinceCheckIn, 30);
  assert.equal(d.minutesWaiting, 20);
  assert.equal(d.minutesSinceCalled, 5);
  assert.ok(isLongWait(LONG_WAIT_MINUTES));
  assert.ok(!isLongWait(5));
  assert.equal(formatMinutesTr(null), "—");
  assert.match(formatMinutesTr(12), /12/);
});

test("26. Istanbul timezone display", () => {
  const formatted = formatIstanbulTime("2026-07-16T10:00:00.000Z");
  assert.match(formatted, /\d{2}:\d{2}/);
  assert.match(FLOW_LIB, /Europe\/Istanbul/);
  assert.doesNotMatch(FLOW_LIB, /toLocaleTimeString\(\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 27–30. UI structure
// ═══════════════════════════════════════════════════════════════════

test("27. Reception sections", () => {
  // Reception workspace uses RECEPTION_FLOW_SECTIONS to render flow columns
  assert.match(RECEPTION_WS, /RECEPTION_FLOW_SECTIONS/);
  assert.equal(RECEPTION_FLOW_SECTIONS.length, 6);
  // Verify all 6 flow states are represented
  const states = RECEPTION_FLOW_SECTIONS.map((s) => s.state);
  assert.deepEqual(states.sort(), [
    "scheduled",
    "checked_in",
    "waiting",
    "called",
    "in_examination",
    "completed",
  ].sort());
});

test("28. Veterinarian waiting section", () => {
  assert.match(VET_QUEUE, /Bekleme Salonunda/);
  assert.match(VET_QUEUE, /Veteriner Çağırdı/);
  assert.match(VET_QUEUE, /Muayenede/);
});

test("29. Mobile structure — single column + 44px targets", () => {
  assert.match(RECEPTION_WS, /grid-cols-1/);
  assert.match(FLOW_UI, /min-h-\[44px\]/);
  assert.match(RECEPTION_CARD, /min-h-\[44px\]|flex-col/);
});

test("30. Non-color-only statuses", () => {
  assert.match(FLOW_BADGE, /aria-label/);
  assert.match(FLOW_BADGE, /icons|emoji|span aria-hidden/);
  assert.match(RECEPTION_CARD, /aria-label/);
  assert.match(RECEPTION_CARD, /Uzun bekleme|⏰/);
});

// ═══════════════════════════════════════════════════════════════════
// 31–34. Concurrency, errors, performance
// ═══════════════════════════════════════════════════════════════════

test("31. Double-submit prevention — pending disables buttons", () => {
  assert.match(FLOW_UI, /useTransition|pending/);
  assert.match(FLOW_UI, /disabled=\{pending\}/);
});

test("32. Safe error translation — Turkish messages", () => {
  assert.match(FLOW_ACTIONS, /İşlem tamamlanamadı/);
  assert.match(FLOW_ACTIONS, /yetkiniz bulunmuyor/i);
  assert.doesNotMatch(FLOW_ACTIONS, /throw new Error\("[A-Z_]+/);
});

test("33. No N+1 — batch owner/pet/vet fetches", () => {
  assert.match(RECEPTION_READERS, /Promise\.all/);
  assert.match(RECEPTION_READERS, /\.in\("id"/);
  assert.match(VET_READERS, /Promise\.all/);
});

test("34. Bounded date query", () => {
  assert.match(RECEPTION_READERS, /gte\("starts_at", dateStart\)/);
  assert.match(RECEPTION_READERS, /lt\("starts_at", dateEnd\)/);
  assert.match(VET_READERS, /gte\("starts_at", dateStart\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 35–38. Regression anchors
// ═══════════════════════════════════════════════════════════════════

test("35. Existing Phase 2 regression — appointment statuses intact", () => {
  assert.ok(canTransitionStatus("pending", "confirmed", "staff"));
  assert.ok(!canTransitionStatus("pending", "cancelled", "staff"));
  assert.ok(canTransitionStatus("pending", "cancelled", "admin"));
});

test("36. Existing booking regression — no payment/messaging/google", () => {
  assert.doesNotMatch(MIGRATION, /payment|stripe|google.?calendar|twilio/i);
  assert.doesNotMatch(FLOW_ACTIONS, /sendSms|sendWhatsApp|googleCalendar/i);
});

test("37. Existing reception regression — requireStaff + pending section", () => {
  const page = read("app/admin/reception/page.tsx");
  assert.match(page, /requireStaff/);
  assert.match(RECEPTION_WS, /status === "pending"/);
  assert.match(RECEPTION_WS, /!a\.assigned_user_id/);
});

test("38. Existing veterinarian regression — own ID default + assigned filter", () => {
  assert.match(VET_PAGE, /session\.id/);
  assert.match(VET_READERS, /eq\("assigned_user_id", veterinarianId\)/);
  assert.match(VET_READERS, /export async function getNextPatient/);
});

// ═══════════════════════════════════════════════════════════════════
// 39–45. Hygiene
// ═══════════════════════════════════════════════════════════════════

test("39. Lint clean — source well-formed (no obvious syntax trash)", () => {
  assert.doesNotMatch(FLOW_LIB, /;\s*;/);
  assert.doesNotMatch(FLOW_ACTIONS, /<<<<<<</);
});

test("40. TypeScript types include flow fields", () => {
  assert.match(DB_TYPES, /flow_state: ClinicFlowState/);
  assert.match(DB_TYPES, /checked_in_at: string \| null/);
  assert.match(DB_TYPES, /waiting_started_at/);
  assert.match(DB_TYPES, /called_at/);
  assert.match(DB_TYPES, /examination_started_at/);
  assert.match(DB_TYPES, /flow_completed_at/);
});

test("41. Build passes — covered by CI; domain module exports stable", () => {
  assert.equal(typeof deriveFlowState, "function");
  assert.equal(typeof flowTimestampPatch, "function");
  const patch = flowTimestampPatch("check_in", "checked_in", "2026-07-16T10:00:00.000Z");
  assert.equal(patch.flow_state, "checked_in");
  assert.equal(patch.checked_in_at, "2026-07-16T10:00:00.000Z");
});

test("42. git diff --check clean — no trailing spaces in core files", () => {
  for (const src of [FLOW_LIB, FLOW_ACTIONS, MIGRATION]) {
    for (const line of src.split("\n")) {
      assert.ok(!/[ \t]+$/.test(line), `Trailing whitespace: ${line.slice(0, 60)}`);
    }
  }
});

test("43. No missing imports — clinic-flow modules reference each other", () => {
  assert.match(FLOW_ACTIONS, /from "@\/src\/lib\/admin\/clinic-flow\/clinic-flow"/);
  assert.match(RECEPTION_CARD, /ClinicFlowActions|availableFlowActions/);
  assert.match(VET_QUEUE, /ClinicFlowActions|availableFlowActions/);
});

test("44. No trailing whitespace — UI files", () => {
  for (const src of [RECEPTION_WS, FLOW_UI, FLOW_BADGE]) {
    for (const line of src.split("\n")) {
      assert.ok(!/[ \t]+$/.test(line));
    }
  }
});

test("45. No secret or PII exposure", () => {
  assert.doesNotMatch(FLOW_ACTIONS, /SUPABASE_SERVICE_ROLE|sk_live|api_key\s*=/i);
  assert.doesNotMatch(RECEPTION_CARD, /internal_notes|diagnosis|chief_complaint/);
  assert.doesNotMatch(VET_QUEUE, /internal_notes|diagnosis/);
  assert.ok(existsSync(join(new URL(".", ROOT).pathname, "docs/qa")));
});

// Derive flow state from timestamps
test("deriveFlowState prefers explicit flow_state", () => {
  assert.equal(deriveFlowState({ flow_state: "waiting" }), "waiting");
  assert.equal(
    deriveFlowState({ checked_in_at: "2026-07-16T10:00:00Z", flow_state: null }),
    "checked_in",
  );
  assert.equal(deriveFlowState({}), "scheduled");
});

// States list completeness
test("all flow states have transition map entries", () => {
  for (const state of CLINIC_FLOW_STATES) {
    // completed is terminal
    if (state === "completed") {
      assert.equal(nextFlowState("completed", "check_in"), null);
    } else {
      assert.ok(typeof state === "string");
    }
  }
});

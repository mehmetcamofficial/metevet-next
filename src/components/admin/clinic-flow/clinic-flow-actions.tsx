"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  callPatient,
  cancelFromClinicFlow,
  checkInPatient,
  completeClinicFlow,
  markNoShowFromClinicFlow,
  movePatientToWaiting,
  returnPatientToWaiting,
  startExaminationFromFlow,
  undoCheckIn,
  type ClinicFlowResult,
} from "@/app/admin/clinic-flow/actions";
import {
  flowActionLabels,
  type ClinicFlowAction,
  type ClinicFlowState,
} from "@/src/lib/admin/clinic-flow/clinic-flow";

type Props = {
  appointmentId: string;
  flowState: ClinicFlowState;
  actions: ClinicFlowAction[];
  examinationId?: string | null;
  compact?: boolean;
};

const DANGER: ClinicFlowAction[] = ["cancel", "no_show", "undo_check_in"];

async function dispatch(
  action: ClinicFlowAction,
  appointmentId: string,
  expected: ClinicFlowState,
): Promise<ClinicFlowResult> {
  switch (action) {
    case "check_in":
      return checkInPatient(appointmentId, expected);
    case "move_to_waiting":
      return movePatientToWaiting(appointmentId, expected);
    case "call_patient":
      return callPatient(appointmentId, expected);
    case "start_examination":
      return startExaminationFromFlow(appointmentId, expected);
    case "complete_flow":
      return completeClinicFlow(appointmentId, expected);
    case "return_to_waiting":
      return returnPatientToWaiting(appointmentId, expected);
    case "undo_check_in":
      return undoCheckIn(appointmentId, expected);
    case "cancel":
      return cancelFromClinicFlow(appointmentId, expected);
    case "no_show":
      return markNoShowFromClinicFlow(appointmentId, expected);
    default:
      return { ok: false, message: "Bilinmeyen işlem." };
  }
}

export function ClinicFlowActions({
  appointmentId,
  flowState,
  actions,
  examinationId,
  compact = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<ClinicFlowAction | null>(null);

  if (actions.length === 0 && !examinationId) return null;

  function run(action: ClinicFlowAction) {
    if (pending) return;
    if (DANGER.includes(action)) {
      const label = flowActionLabels[action];
      if (!window.confirm(`${label} işlemini onaylıyor musunuz?`)) return;
    }
    setMessage(null);
    setBusyAction(action);
    startTransition(async () => {
      try {
        const result = await dispatch(action, appointmentId, flowState);
        if (!result.ok) {
          setMessage(result.message);
        } else if (action !== "start_examination") {
          setMessage(result.message);
          router.refresh();
        }
      } catch {
        // redirect() from startExamination throws; treat as success navigation
        router.refresh();
      } finally {
        setBusyAction(null);
      }
    });
  }

  const btnBase =
    "inline-flex min-h-[44px] items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/40 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={compact ? "flex flex-wrap gap-1.5" : "flex flex-col gap-1.5 sm:flex-row sm:flex-wrap"}>
      <div aria-live="polite" className="sr-only">
        {message ?? (pending ? "İşlem yapılıyor…" : "")}
      </div>
      {message && (
        <p role="status" className="w-full text-xs text-red-800">
          {message}
        </p>
      )}
      {actions.map((action) => {
        const danger = DANGER.includes(action);
        const isBusy = pending && busyAction === action;
        return (
          <button
            key={action}
            type="button"
            disabled={pending}
            onClick={() => run(action)}
            aria-busy={isBusy}
            className={`${btnBase} ${
              danger
                ? "border border-red-300 bg-red-50 text-red-900 hover:bg-red-100"
                : action === "start_examination" || action === "call_patient"
                  ? "bg-[#123A30] text-white hover:brightness-110"
                  : "border border-[#D1DBD5] bg-white text-[#0D2922] hover:border-[#123A30] hover:bg-[#DDE9E3]/50"
            }`}
          >
            {isBusy ? "…" : flowActionLabels[action]}
          </button>
        );
      })}
      {examinationId && flowState === "in_examination" && !actions.includes("start_examination") && (
        <a
          href={`/admin/examinations/${examinationId}`}
          className={`${btnBase} bg-[#123A30] text-white hover:brightness-110`}
        >
          Muayeneyi Aç
        </a>
      )}
      <a
        href={`/admin/appointments/${appointmentId}`}
        className={`${btnBase} border border-[#D1DBD5] bg-white text-[#526a64] hover:border-[#123A30]`}
      >
        Detay
      </a>
      <a
        href={`/admin/appointments/${appointmentId}/edit`}
        className={`${btnBase} border border-[#D1DBD5] bg-white text-[#526a64] hover:border-[#123A30]`}
      >
        Yeniden Planla
      </a>
    </div>
  );
}

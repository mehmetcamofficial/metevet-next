import { AppointmentStatusBadge } from "../appointments/appointment-status-badge";
import { ClinicFlowActions } from "../clinic-flow/clinic-flow-actions";
import { FlowStateBadge } from "../clinic-flow/flow-state-badge";
import { serviceLabels, sourceLabels } from "@/src/lib/admin/appointments";
import {
  availableFlowActions,
  formatIstanbulTime,
  formatMinutesTr,
  isLongWait,
  waitingDurations,
  type ClinicFlowState,
} from "@/src/lib/admin/clinic-flow/clinic-flow";
import type { AppointmentStatus, AppointmentSource, UserRole } from "@/src/types/database";

export type ReceptionCardItem = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  service_key: string;
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
  examination_id: string | null;
};

type Props = {
  item: ReceptionCardItem;
  role: UserRole;
  actorId: string;
};

export function ReceptionAppointmentCard({ item, role, actorId }: Props) {
  const isPending = item.status === "pending";
  const isUnassigned = !item.assigned_user_id;
  const durations = waitingDurations(item);
  const waitMins =
    item.flow_state === "called"
      ? durations.minutesSinceCalled
      : item.flow_state === "waiting" || item.flow_state === "checked_in"
        ? durations.minutesWaiting ?? durations.minutesSinceCheckIn
        : durations.minutesSinceCheckIn;
  const longWait = isLongWait(waitMins);

  const actions = availableFlowActions(
    role,
    item.flow_state,
    item.status as AppointmentStatus,
    item.assigned_user_id,
    actorId,
  );

  return (
    <article
      className={`rounded-xl border p-3 ${
        isPending
          ? "border-amber-300 bg-amber-50"
          : isUnassigned
            ? "border-orange-300 bg-orange-50"
            : longWait
              ? "border-amber-400 bg-white"
              : "border-[#D1DBD5] bg-white"
      }`}
      aria-label={`${formatIstanbulTime(item.starts_at)} - ${item.pet_name} - ${item.flow_state}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{formatIstanbulTime(item.starts_at)}</span>
            <span className="font-medium">{item.pet_name}</span>
            <FlowStateBadge state={item.flow_state} />
            <AppointmentStatusBadge status={item.status as AppointmentStatus} />
          </div>
          <p className="mt-1 text-sm text-[#526a64]">
            {item.owner_name} · {serviceLabels[item.service_key] ?? item.service_key}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#95A8A2]">
            {item.vet_name && <span>👨‍⚕️ {item.vet_name}</span>}
            <span>{sourceLabels[item.source as AppointmentSource] ?? item.source}</span>
            {item.public_booking_reference && (
              <span className="font-mono">{item.public_booking_reference}</span>
            )}
            {isPending && (
              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-amber-800">Bekleyen onay</span>
            )}
            {isUnassigned && (
              <span className="rounded bg-orange-200 px-1.5 py-0.5 text-orange-800">Atanmamış</span>
            )}
            {waitMins !== null && item.flow_state !== "scheduled" && item.flow_state !== "completed" && (
              <span
                className={longWait ? "inline-flex items-center gap-1 font-semibold text-amber-900" : ""}
                aria-label={
                  longWait
                    ? `Uzun bekleme: ${formatMinutesTr(waitMins)}`
                    : `Bekleme: ${formatMinutesTr(waitMins)}`
                }
              >
                {longWait ? "⏰ Uzun bekleme: " : "⏱ "}
                {formatMinutesTr(waitMins)}
              </span>
            )}
          </div>
          {item.phone && (
            <a
              href={`tel:${item.phone}`}
              className="mt-1 inline-flex min-h-[44px] items-center text-xs text-[#123A30] underline hover:no-underline"
              aria-label="Telefon et"
            >
              📞 Ara
            </a>
          )}
        </div>
        <div className="shrink-0 sm:max-w-xs">
          <ClinicFlowActions
            appointmentId={item.id}
            flowState={item.flow_state}
            actions={actions}
            examinationId={item.examination_id}
            compact
          />
        </div>
      </div>
    </article>
  );
}
